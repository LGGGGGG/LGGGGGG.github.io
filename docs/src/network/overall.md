# 回放

这个 lab 应该是 2024 年做的，很多东西找不到了，权当回忆复习。

## 部署

环境：wsl2+docker+vscode dev container 实验通过虚拟一块网卡完成测试。参考资料：https://zhuanlan.zhihu.com/p/716880549

## 全局优化内容

所有涉及复制的地方全程使用 move 完成所有权的转移，先验不会更改的值全用 const 让编译器生成更优代码。

## lab0

### http 实验

根据 http 协议，写一个最小的报文。
:::details

```c++
sock.connect( Address( host, "http" ) );

  sock.write( string_view( "GET " + path + " HTTP/1.1\r\n" ) );
  sock.write( string_view( "Host: " + host + "\r\n" ) );
  sock.write( string_view( "Connection: close\r\n\r\n" ) );

  while ( not sock.eof() ) {
    string buffer;
    sock.read( buffer );
    cout << buffer;
  }
  sock.wait_until_closed();
```

:::

### 可靠字节流

实现流控字节流的只读(peek),写(push),真读(pop)。

用队列完成操作，使用 lazy-pop(即队头没读完就先别 pop ，只移动已读前缀指针)

:::details

```c++
string_view Reader::peek() const
{
  return stream_.empty() ? string_view {} // std::string_view dependents on the initializer through its lifetime.
                         : string_view { stream_.front() }.substr( removed_prefix_ );
}

void Writer::push( string data )
{
  if ( Writer::is_closed() or Writer::available_capacity() == 0 or data.empty() ) {
    return;
  }

  if ( data.size() > Writer::available_capacity() ) {
    data.resize( Writer::available_capacity() );
  }
  total_pushed_ += data.size();
  total_buffered_ += data.size();

  stream_.emplace( move( data ) );
}

void Reader::pop( uint64_t len )
{
  total_buffered_ -= len;
  total_popped_ += len;
  while ( len != 0U ) {
    const uint64_t& size { stream_.front().size() - removed_prefix_ };
    if ( len < size ) {
      removed_prefix_ += len;
      break; // with len = 0;
    }
    stream_.pop();
    removed_prefix_ = 0;
    len -= size;
  }
}
```

:::

## lab1 字节流整合器

重整乱序接受的字节流,使用 map 优化区间合并
:::details

```c++
auto Reassembler::split( uint64_t pos ) noexcept
{
  auto it { buf_.lower_bound( pos ) };
  if ( it != buf_.end() and it->first == pos ) {
    return it;
  }
  if ( it == buf_.begin() ) { // if buf_.empty() then begin() == end()
    return it;
  }
  if ( const auto pit { prev( it ) }; pit->first + size( pit->second ) > pos ) {
    const auto res = buf_.emplace_hint( it, pos, pit->second.substr( pos - pit->first ) );
    pit->second.resize( pos - pit->first );
    return res;
  }
  return it;
};

void Reassembler::insert( uint64_t first_index, string data, bool is_last_substring )
{
  const auto try_close = [&]() noexcept -> void {
    if ( end_index_.has_value() and end_index_.value() == writer().bytes_pushed() ) {
      output_.writer().close();
    }
  };

  if ( data.empty() ) { // No capacity limit
    if ( not end_index_.has_value() and is_last_substring ) {
      end_index_.emplace( first_index );
    }
    return try_close();
  }

  if ( writer().is_closed() or writer().available_capacity() == 0U ) {
    return;
  }

  // Reassembler's internal storage: [unassembled_index, unacceptable_index)
  const uint64_t unassembled_index { writer().bytes_pushed() };
  const uint64_t unacceptable_index { unassembled_index + writer().available_capacity() };
  if ( first_index + size( data ) <= unassembled_index or first_index >= unacceptable_index ) {
    return; // Out of ranger
  }
  if ( first_index + size( data ) > unacceptable_index ) { // Remove unacceptable bytes
    data.resize( unacceptable_index - first_index );
    is_last_substring = false;
  }
  if ( first_index < unassembled_index ) { // Remove poped/buffered bytes
    data.erase( 0, unassembled_index - first_index );
    first_index = unassembled_index;
  }

  if ( not end_index_.has_value() and is_last_substring ) {
    end_index_.emplace( first_index + size( data ) );
  }

  // Can be optimizated !!!
  const auto upper { split( first_index + size( data ) ) };
  const auto lower { split( first_index ) };
  ranges::for_each( ranges::subrange( lower, upper ) | views::values,
                    [&]( const auto& str ) { total_pending_ -= str.size(); } );
  total_pending_ += size( data );
  buf_.emplace_hint( buf_.erase( lower, upper ), first_index, move( data ) );

  while ( not buf_.empty() ) {
    auto&& [index, payload] { *buf_.begin() };
    if ( index != writer().bytes_pushed() ) {
      break;
    }

    total_pending_ -= size( payload );
    output_.writer().push( move( payload ) );
    buf_.erase( buf_.begin() );
  }
  return try_close();
```

:::

## lab2 TCP 接收器

带流量控制，收到一个字节流片段后要发确认号和窗口大小。包带 SYN flag 时传的是首个确认号关口在于处理上溢下溢，以及得到最靠近参考号的绝对号，办法是利用数学知识得解析解
:::details

### 绝对序列号转包号

```c++
Wrap32 Wrap32::wrap( uint64_t n, Wrap32 zero_point )
{
  /**
   * let n = [ high_32 | low_32 ]
   * wrap(n) = low_32 + zero_point.raw_value_
   *        or low_32 + zero_point.raw_value_ - 2^{32}
   */
  return zero_point + static_cast<uint32_t>( n );
}

uint64_t Wrap32::unwrap( Wrap32 zero_point, uint64_t checkpoint ) const
{
  const uint64_t n_low32 { this->raw_value_ - zero_point.raw_value_ };
  const uint64_t c_low32 { checkpoint & MASK_LOW_32 };
  const uint64_t res { ( checkpoint & MASK_HIGH_32 ) | n_low32 };
  if ( res >= BASE and n_low32 > c_low32 and ( n_low32 - c_low32 ) > ( BASE / 2 ) ) {
    return res - BASE;
  }
  if ( res < MASK_HIGH_32 and c_low32 > n_low32 and ( c_low32 - n_low32 ) > ( BASE / 2 ) ) {
    return res + BASE;
  }
  return res;
}
```

:::

### 实现接收器

:::details

```c++
void TCPReceiver::receive( TCPSenderMessage message )
{
  if ( writer().has_error() ) {
    return;
  }
  if ( message.RST ) {
    reader().set_error();
    return;
  }

  if ( not zero_point_.has_value() ) {
    if ( not message.SYN ) {
      return;
    }
    zero_point_.emplace( message.seqno );
  }

  const uint64_t checkpoint { writer().bytes_pushed() + 1 /* SYN */ }; // abs_seqno for expecting payload
  const uint64_t absolute_seqno { message.seqno.unwrap( zero_point_.value(), checkpoint ) };
  const uint64_t stream_index { absolute_seqno + static_cast<uint64_t>( message.SYN ) - 1 /* SYN */ };
  reassembler_.insert( stream_index, move( message.payload ), message.FIN );
}
```

:::

## lab3 TCP 发送器

带流量窗口的流控，主要实现使用指数退避算法的计时器，用于维护超时重传队列。
:::details

```c++
void TCPSender::push( const TransmitFunction& transmit )
{
  while ( ( window_size_ == 0 ? 1 : window_size_ ) > total_outstanding_ ) {
    if ( FIN_sent_ ) {
      break; // Is finished.
    }

    auto msg { make_empty_message() };
    if ( not SYN_sent_ ) {
      msg.SYN = true;
      SYN_sent_ = true;
    }

    const uint64_t remaining { ( window_size_ == 0 ? 1 : window_size_ ) - total_outstanding_ };
    const size_t len { min( TCPConfig::MAX_PAYLOAD_SIZE, remaining - msg.sequence_length() ) };
    auto&& payload { msg.payload };
    while ( reader().bytes_buffered() != 0U and payload.size() < len ) {
      string_view view { reader().peek() };
      view = view.substr( 0, len - payload.size() );
      payload += view;
      input_.reader().pop( view.size() );
    }

    if ( not FIN_sent_ and remaining > msg.sequence_length() and reader().is_finished() ) {
      msg.FIN = true;
      FIN_sent_ = true;
    }

    if ( msg.sequence_length() == 0 ) {
      break;
    }

    transmit( msg );
    if ( not timer_.is_active() ) {
      timer_.start();
    }
    next_abs_seqno_ += msg.sequence_length();
    total_outstanding_ += msg.sequence_length();
    outstanding_message_.emplace( move( msg ) );
  }
}

TCPSenderMessage TCPSender::make_empty_message() const
{
  return { Wrap32::wrap( next_abs_seqno_, isn_ ), false, {}, false, input_.has_error() };
}

void TCPSender::receive( const TCPReceiverMessage& msg )
{
  if ( input_.has_error() ) {
    return;
  }
  if ( msg.RST ) {
    input_.set_error();
    return;
  }

  window_size_ = msg.window_size;
  if ( not msg.ackno.has_value() ) {
    return;
  }
  const uint64_t recv_ack_abs_seqno { msg.ackno->unwrap( isn_, next_abs_seqno_ ) };
  if ( recv_ack_abs_seqno > next_abs_seqno_ ) {
    return;
  }
  bool has_acknowledgment { false };
  while ( not outstanding_message_.empty() ) {
    const auto& message { outstanding_message_.front() };
    if ( ack_abs_seqno_ + message.sequence_length() > recv_ack_abs_seqno ) {
      break; // Must be fully acknowledged by the TCP receiver.
    }
    has_acknowledgment = true;
    ack_abs_seqno_ += message.sequence_length();
    total_outstanding_ -= message.sequence_length();
    outstanding_message_.pop();
  }
  if ( has_acknowledgment ) {
    total_retransmission_ = 0;
    timer_.reload( initial_RTO_ms_ );
    outstanding_message_.empty() ? timer_.stop() : timer_.start();
  }
}

void TCPSender::tick( uint64_t ms_since_last_tick, const TransmitFunction& transmit )
{
  if ( timer_.tick( ms_since_last_tick ).is_expired() ) {
    if ( outstanding_message_.empty() ) {
      return;
    }
    transmit( outstanding_message_.front() );
    if ( window_size_ != 0 ) {
      total_retransmission_ += 1;
      timer_.exponential_backoff();
    }
    timer_.reset();
  }
}
```

:::

## lab5 网络接口

实现 arp 与 ip 的映射，主要是维护 arp 表项的活性以及重传 arp 广播，简易计时器。
:::details

```c++
auto NetworkInterface::make_arp( const uint16_t opcode,
                                 const EthernetAddress& target_ethernet_address,
                                 const uint32_t target_ip_address ) const noexcept -> ARPMessage
{
  ARPMessage arp;
  arp.opcode = opcode;
  arp.sender_ethernet_address = ethernet_address_;
  arp.sender_ip_address = ip_address_.ipv4_numeric();
  arp.target_ethernet_address = target_ethernet_address;
  arp.target_ip_address = target_ip_address;
  return arp;
}

//! \param[in] ethernet_address Ethernet (what ARP calls "hardware") address of the interface
//! \param[in] ip_address IP (what ARP calls "protocol") address of the interface
NetworkInterface::NetworkInterface( string_view name,
                                    shared_ptr<OutputPort> port,
                                    const EthernetAddress& ethernet_address,
                                    const Address& ip_address )
  : name_( name )
  , port_( notnull( "OutputPort", move( port ) ) )
  , ethernet_address_( ethernet_address )
  , ip_address_( ip_address )
{
  cerr << "DEBUG: Network interface has Ethernet address " << to_string( ethernet_address ) << " and IP address "
       << ip_address.ip() << "\n";
}

//! \param[in] dgram the IPv4 datagram to be sent
//! \param[in] next_hop the IP address of the interface to send it to (typically a router or default gateway, but
//! may also be another host if directly connected to the same network as the destination) Note: the Address type
//! can be converted to a uint32_t (raw 32-bit IP address) by using the Address::ipv4_numeric() method.
void NetworkInterface::send_datagram( const InternetDatagram& dgram, const Address& next_hop )
{
  // Your code here.
  EthernetFrame thing_to_sent;
  thing_to_sent.header.src = ethernet_address_;
  const size_t next_hop_num { next_hop.ipv4_numeric() };
  if ( !arp_ache_.contains( next_hop_num ) ) {
    if ( arp_timer_.contains( next_hop_num ) )
      return;
    thing_to_sent.header.dst = ETHERNET_BROADCAST;
    thing_to_sent.header.type = EthernetHeader::TYPE_ARP;
    ARPMessage arpmessage_;
    arpmessage_.sender_ip_address = ip_address_.ipv4_numeric();
    arpmessage_.target_ip_address = next_hop.ipv4_numeric();
    arpmessage_.opcode = ARPMessage::OPCODE_REQUEST;
    arpmessage_.sender_ethernet_address = ethernet_address_;
    thing_to_sent.payload = serialize( arpmessage_ );
    arp_timer_.emplace( next_hop_num, std::pair<size_t, EthernetFrame>( cur_time, thing_to_sent ) );
    dgrams_waitting_[next_hop_num].emplace_back( dgram );
    transmit( thing_to_sent );
    return;
  }
  thing_to_sent.header.dst = arp_ache_[next_hop_num].second;
  thing_to_sent.header.type = EthernetHeader::TYPE_IPv4;
  thing_to_sent.payload = serialize( dgram );
  transmit( thing_to_sent );
}

//! \param[in] frame the incoming Ethernet frame
void NetworkInterface::recv_frame( const EthernetFrame& frame )
{
  // Your code here.
  if ( frame.header.dst != ethernet_address_ and frame.header.dst != ETHERNET_BROADCAST ) {
    return;
  }

  if ( frame.header.type == EthernetHeader::TYPE_IPv4 ) {
    InternetDatagram ipv4_datagram;
    if ( parse( ipv4_datagram, frame.payload ) ) {
      datagrams_received_.emplace( move( ipv4_datagram ) );
    }
    return;
  }

  if ( frame.header.type == EthernetHeader::TYPE_ARP ) {
    ARPMessage msg;
    if ( not parse( msg, frame.payload ) ) {
      return;
    }

    const size_t sender_ip { msg.sender_ip_address };
    const EthernetAddress sender_eth { msg.sender_ethernet_address };
    arp_ache_[sender_ip] = std::pair<size_t, EthernetAddress>( cur_time, sender_eth );

    if ( msg.opcode == ARPMessage::OPCODE_REQUEST and msg.target_ip_address == ip_address_.ipv4_numeric() ) {
      const ARPMessage arp_reply { make_arp( ARPMessage::OPCODE_REPLY, sender_eth, sender_ip ) };
      transmit( { { sender_eth, ethernet_address_, EthernetHeader::TYPE_ARP }, serialize( arp_reply ) } );
    }
    if ( dgrams_waitting_.contains( sender_ip ) ) {
      for ( const auto& dgram : dgrams_waitting_[sender_ip] ) {
        transmit( { { sender_eth, ethernet_address_, EthernetHeader::TYPE_IPv4 }, serialize( dgram ) } );
      }
      dgrams_waitting_.erase( sender_ip );
      arp_timer_.erase( sender_ip );
    }
  }
}

//! \param[in] ms_since_last_tick the number of milliseconds since the last call to this method
void NetworkInterface::tick( const size_t ms_since_last_tick )
{
  // Your code here.
  cur_time += ms_since_last_tick;
  for ( auto it = arp_ache_.begin(); it != arp_ache_.end(); ) {
    if ( cur_time - it->second.first >= 30000 ) {
      it = arp_ache_.erase( it );
    } else
      ++it;
  }
  for ( auto t : arp_timer_ ) {
    if ( cur_time - t.second.first >= 5000 ) {
      t.second.first = cur_time;
      transmit( t.second.second );
    }
  }
}
```

:::

## lab6 路由

:::details

```c++
 for ( const auto& interface : _interfaces ) {
    auto&& datagrams_received { interface->datagrams_received() };
    while ( not datagrams_received.empty() ) {
      InternetDatagram datagram { move( datagrams_received.front() ) };
      datagrams_received.pop();

      if ( datagram.header.ttl <= 1 ) {
        continue;
      }
      datagram.header.ttl -= 1;
      datagram.header.compute_checksum();

      const optional<info>& mp { match( datagram.header.dst ) };
      if ( not mp.has_value() ) {
        continue;
      }
      const auto& [num, next_hop] { mp.value() };
      _interfaces[num]->send_datagram( datagram,
                                       next_hop.value_or( Address::from_ipv4_numeric( datagram.header.dst ) ) );
    }
  }
}
[[nodiscard]] auto Router::match( uint32_t addr ) const noexcept -> optional<info>
{
  auto adaptor = views::filter( [&addr]( const auto& mp ) { return mp.contains( addr >>= 1 ); } )
                 | views::transform( [&addr]( const auto& mp ) -> info { return mp.at( addr ); } );
  auto res { routing_table_ | views::reverse | adaptor | views::take( 1 ) }; // just kidding
  return res.empty() ? nullopt : optional<info> { res.front() };
```

:::

我做的 CS144 版本能做的就这些，TCP 状态机啥的没有账号搞不定。
![](/tcpstate.png)
