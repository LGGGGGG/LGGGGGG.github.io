# 光栅化

我们经过前面的内容，已经定好照相机/人眼的位置了，现在就是确定哪些物体反射过来的光应当被保留，在底片以及视网膜上的像素被激活后，成像软件和人脑应当怎么把这些信号绘制成图案。

## 屏幕空间

屏幕就那么大，屏幕之外的渲染了你也看不见，所以看到再渲染是很正常的。

- 定义一个像素是一个$1 \times 1$的小方格。
- 屏幕范围$(0,0)\sim (width, height)$。
- 约定空间上的整点代表一个像素的左下角。
- 像素的范围是$(0,0)\sim (width - 1, height - 1)$
- 像素$(x, y)$的中心是$(x + 0.5, y + 0.5)$

## 视口变换

我们需要将之前的包围盒$[-1,1]^3$的 z 轴拍扁以二维化，还要进行平移以压缩至$[0, width] \times [0, height]$的平面上。变换矩阵易得。

$$
    M=
     \begin{bmatrix}
     \frac{width}{2}&0 &0&\frac{width}{2}\\
     0&\frac{height}{2} &0&\frac{height}{2}\\
     0&0&1&0\\
     0&0&0&1
     \end{bmatrix}
$$

## 光栅化

目前学界和业界基本都用三角面片来作为基础的图形方案(本科理论老师做了一辈子非三角形要哭了)。

其优势有：

- 三角形可以表示任意多边形
- 唯一确定一个平面
- 内外明确，给定一个点一定能判断其是否在三角形所在平面内且是在内还是在外。
- 前人累积的成果多，有好用的插值方法和各种渐变效果。
  其劣势在于：
- 需要大量面片才能很好的还原图形，给存储带来极大压力

现在回归主线，我们有了物体的顶点数据和边数据，假设我们要给整个物体涂色，我们如何确定哪些像素是该涂色的呢？这就是光栅化的核心问题。
由于任何物体的基础都是三角面片，因此，搞懂了怎么画一个三角形，也就搞懂了怎么画一个物体。

### 采样

在这里，采样的定义是：若一个像素的中心在三角形内部，那么应当被着色。
![](/sample.png)
整个光栅化其实说起来就是做下面这一串代码：

```c++
for (int x = xmin; x < xmax; x++)
    for (int y = xmin; y < ymax; y++)
        image[x][y] = inside(tri,x+0.5,y+0.5)
        //inside函数：如果在三角形内返回1，否则0
```

知道了顶点数据后，用不着遍历整个空间，只需要遍历上图的蓝色部分，也就是包围盒，上图的包围盒又称轴对齐包围盒，也就是八股 AABB(Axis-aligned bounding box)，其范围由$xmin,xmax$和$ymin,ymax$这四个参数约束。

还有需要注意的问题是如何判断点在内部，最简单的在作业 0 中已经谈过了，三次叉乘即可。但是也有一个常用方案，就是使用点的三角形重心坐标，当且仅当三个分量全部非负时点在三角形内部。

还有就是中心点出现在边上时怎么办，这个要依据自身需求（审美），自己定义。

到这里，光栅化就结束了，接下来的东西都是怎么把表现变得更好看的各种方法。

### 走样

世界是实数连续的，然而屏幕是整数离散的。我们怎么还原都会有信息的丢失，丢失到一定地步，图形就与原物体相去甚远了。

- 游戏中最耳熟能详的，锯齿(空间采样瑕疵)：
  ![](/jaggies.png)
- 手机拍屏经常出现的，摩尔纹(欠采样瑕疵)
- 梗图经常出现的会转的静态图，车轮效应(时间采样瑕疵)
  根本原因是信号频率太高而采样频率太低，这就叫走样。

### 反走样

为了动画更好看，游戏更逼真而卖大钱，反走样是必要的。
上文说了走样的根本是信号频率太高而采样频率太低，那么信号与系统的绝活就要出现了，我们需要一个操作滤高频信号，通过低频信号以匹配采样频率。

- 可以将图片做傅里叶变换，会发现低频信息多，高频信息少

  - 去除低频信息（高通滤波），发现原始图像只剩下边界

  - 去除高频信息（低通滤波），发现原始图像变模糊，边界不清晰

- 模糊操作等于做了个低通滤波，即去掉了高频的信号，减少了信号重叠的情况。从而在采样的时候可以实现反走样

- 对原始图像在空间域上的卷积实现了频域上的滤波

![](/blur.png)

#### SSAA

问题归结为如何进行模糊。一个很自然的想法是根据像素被三角形覆盖的面积多少来确定一个像素被“模糊”也就是填色的“色号”（本色弱也不知道怎么表述这个东西，理解为向白色过渡多少吧）降低多少。

那么怎么界定一个像素被三角形覆盖了多少呢？要是几何方法的话计算量和精度问题会压死 CPU。这里介绍了超采样抗锯齿（supersample anti-aliasing，简称 SSAA）方法。简单来说将一个像素再平均划分为 N 个子像素，对分辨率扩大了 N 倍的图像再进行采样，然后原像素的颜色就是各子像素颜色之和的平均，可以看出来，计算量增加了 N 倍。
![](/22supersample.png)
![](/result.png)
![](/afterss.png)

#### MSAA

上面的计算流程有一些冗余，冗余就冗余在一个像素的有些子像素是没有被覆盖到的，然而我们同时也遍历了它们的颜色并反馈到原像素中，这没有必要，我们只需要统计一个像素中有多少个子像素被包含在了三角形中，假设是$x$,那么原像素的颜色就是$预定颜色 * \frac{x}{N}$，比起 SSAA 的$N^2$遍历(我知道时间没什么区别，但空间上区别很大，并且数据规模上去以后空间会影响时间，取数换页之类的)，这里常数上有优势，这种方法就叫做多重采样抗锯齿（Multi Sampling Anti-Aliasing，简称 MSAA）。业界常用的其实是 FXAA(Fast Approximate AA)(以亮度界定边缘，只优化边缘锯齿，但会造成整体模糊和动态不佳)、TAA(Temporal AA)（复用前帧信息完成平滑，但是时空开销大、有拖影）。

## 可见与遮挡

上文中只谈到了一个三角形的情况，除非有意设置，不然一般情况下屏幕内出现多个三角形才是正常的。那么如何处理这些层次关系呢？

### 画家算法

这种做法需要将所有的三角形进行排序，并且维护一个帧缓存(Frame Buffer) 存放屏幕空间的临时像素值，不断用更近的点覆盖原有的像素值，就像油画家的做法一样，最后将得到的 Frame Buffer 写入屏幕空间对应的像素数组，得到结果图像。
问题是，这样定义的三维空间中的远近不良，处理不了循环覆盖问题,且需要排序，时间复杂度$O(nlogn)$。
![](/painter.png)

### 深度缓冲

在缓存每一帧的同时，还用一个数组缓存$XOY$平面上一点$(x,y)$的深度，该数组被称为 z-buffer，同时定义深度为$|z|$,越小则越近，帧缓存与 z-buffer 永远更新为最近的像素数据。则每一帧要处理的事项表示为：

```
for each triangle T
    for each sample(x, y, z) in T
        if (z < ZBuffer[x, y])
            FrameBuffer[x, y] = RGB
            ZBuffer = z
```

这样避免了排序，且顺序无关，时间复杂度$O(n)$

## 作业

哥们偷懒实现的 MSAA，然而速度确实要比 SSAA 快，毕竟少一点循环不是？这次作业有坑爹的地方，我认为这是框架的锅。
::: details
首先是判断点是否在三角形内的函数，它的原始签名是(int,int,...)，你要把它改成(float,float,...)不然会有狗屎 BUG。但是我认为设置成这样背离了初心好吧，还有就是我的编译器的问题？我的 insideTriangle 必须要出现在 computeBarycentric2D 前才能正确编译。

```c++
static bool insideTriangle(float x, float y, const Vector3f* _v)
{
    auto [a, b, c] = computeBarycentric2D(x, y, _v);
    return a >= 0 && b >= 0 && c >= 0;
}
```

还有就是注释的那段代码，是为了完成从相机空间到屏幕空间的插值，本科的时候也手动实现过，当时师兄还让我们实验不同的$w$值对图形的影响。
本文实现的是 MSAA，代码量又少，跑得又快，不知道 SSAA 存在的意义是啥。

```c++
static constexpr int dir[4][2] = { {0, 0}, {0, 1}, {1, 0}, {1, 1}};
void rst::rasterizer::rasterize_triangle(const Triangle& t) {
    auto v = t.toVector4();

    // TODO : Find out the bounding box of current triangle.

    int min_x = std::floor(std::min({v[0][0], v[1][0], v[2][0]}));
    int max_x = std::ceil(std::max({v[0][0], v[1][0], v[2][0]}));
    int min_y = std::floor(std::min({v[0][1], v[1][1], v[2][1]}));
    int max_y = std::ceil(std::max({v[0][1], v[1][1], v[2][1]}));

    bool isMSAA = 1;

    // iterate through the pixel and find if the current pixel is inside the triangle
    if(isMSAA)
    {
        for(int x = min_x;x <= max_x;++x)
        {
            for(int y = min_y;y <= max_y;++y)
            {
                int cnt = 0;
                for(const auto&[dx, dy] : dir)
                {
                    float px = (float)x + 0.25 + 0.5 * dx;
                    float py = (float)y + 0.25 + 0.5 * dy;


                    if(!insideTriangle(px, py, t.v)) continue;
                    // If so, use the following code to get the interpolated z value.
                    auto[alpha, beta, gamma] = computeBarycentric2D(px, py, t.v);
                    float w_reciprocal = 1.0/(alpha / v[0].w() + beta / v[1].w() + gamma / v[2].w());
                    float z_interpolated = alpha * v[0].z() / v[0].w() + beta * v[1].z() / v[1].w() + gamma * v[2].z() / v[2].w();
                    z_interpolated *= w_reciprocal;

                    // TODO : set the current pixel (use the set_pixel function) to the color of the triangle (use getColor function) if it should be painted.
                    int idx = (x * 2 + dx) + (y * 2 + dy)* width * 2;

                    if(msaa_depth_buf[idx] != std::numeric_limits<float>::infinity() && z_interpolated >= msaa_depth_buf[idx])  continue;
                    msaa_depth_buf[idx] = z_interpolated;
                    ++cnt;
                }
                //std::cout << x<< " " << y << " " <<cnt << std::endl;
                if(!cnt) continue;
                float intensity=(float)cnt / 4.0f;
				auto idx = get_index(x, y);
                frame_buf[idx] += t.getColor() * intensity;

            }
        }
    }
    else
    {
        for(int x = min_x;x <= max_x;++x)
        {
            for(int y = min_y;y <= max_y;++y)
            {
                float cx = x + 0.5f;
                float cy = y + 0.5f;
                if(!insideTriangle(cx, cy, t.v)) continue;
                // If so, use the following code to get the interpolated z value.
                auto[alpha, beta, gamma] = computeBarycentric2D(x, y, t.v);
                float w_reciprocal = 1.0/(alpha / v[0].w() + beta / v[1].w() + gamma / v[2].w());
                float z_interpolated = alpha * v[0].z() / v[0].w() + beta * v[1].z() / v[1].w() + gamma * v[2].z() / v[2].w();
                z_interpolated *= w_reciprocal;

                // TODO : set the current pixel (use the set_pixel function) to the color of the triangle (use getColor function) if it should be painted.
                int idx = get_index(x, y);
                if(depth_buf[idx] != std::numeric_limits<float>::infinity() && z_interpolated >= depth_buf[idx])  continue;
                depth_buf[idx] = z_interpolated;
                set_pixel({x, y, 1.0f},t.getColor());

            }
        }
    }
}
```

左边是原图，右边是采样后的,可以看出右边有填充了一些锯齿，但是仔细放大还是会看到锯齿，远远地看好一些。
|![](/pa2_1.png)|![](/pa2_2.png)|
|---|---|
|![](/pa2_3.png)|![](/pa2_4.png)|
|![](/pa2_5.png)|![](/pa2_6.png)|
:::
