# react 杂项

这里记载学习 react 中本人认为值得记录的东西。

## react 渲染三步骤

1. 触发时机

- 组件第一次渲染
- 组件本身状态或祖先组件状态发生变更

2. 渲染中
   渲染是**react**在调用组件，用的自身持有的状态确定组件及子组件的状态。第一次渲染从根组件开始，其余从触发了渲染的组件开始。渲染中只计算状态。
3. 提交
   将更改的状态真正应用到 DOM 中。

## 阻止组件间互相影响

子组件更新也会向上触发父组件中的“立即函数”，想要避免这一情况可以使用`e.stopPropagation()`来阻止向上传递冒泡事件。

然而，有些组件的行为直接触发渲染，例如表单提交，此时使用
`e.preventDefault()`来阻止重新渲染

## 状态队列

```javascript
const [state, setStsate] = useState(0);
```

state 相当于别的语言中的静态变量，只初始化一次，在函数内部调用生效，每次获取的“值”是上次渲染后的快照，我怀疑实际上是值传递的 getState()的返回值。由于 react 的思路是 f(f(x))，所谓“状态提升”不过是把静态变量提到更高层的作用域中，幽默的是，子组件获取父组件状态还需要通过参数传递而不是直接静态链获取，可能有什么我不了解的工程哲学，毕竟你不能号称自己是 f(f(x)),结果内层 f(x)并不是真函数。

### setState 思路

`setStsate(x)`只能将`x`放入状态队列中，然后每次渲染更新一次 state 的值，也就是说，队尾的操作决定 state 最终值，由于这个操作允许是函数，可以用来实现一些依赖队列中间态的操作，例如连续两次加不是

```javascript
setStsate(state + 1);
setStsate(state + 1);
```

这里的 state 是值传递过来的，你在一次渲染内怎么做 state 值永远不变，假设原值为 0，那么实际上这两个操作相当于。

```javascript
setStsate(0 + 1);
setStsate(0 + 1);
```

也就是最终把队列内状态值直接设为 1。
正确的做法是这样：

```javascript
setStsate((s) => s + 1);
setStsate((s) => s + 1);
```

传递一个 lambda 函数，让函数作用于队列内状态值，原值是 0，两次作用以后真实状态值再更新为队列内状态值。还是注意值传递，即便队列内状态改变了，现在获取的状态仍是上一次渲染完成后的状态。`setStsate(x)`只能将`x`放入状态队列中，等待下一次渲染才会真正去更新 state。其代码如下：

```javascript
export function getFinalState(baseState, queue) {
  let finalState = baseState;

  for (let update of queue) {
    if (typeof update === "function") {
      // 调用更新函数
      finalState = update(finalState);
    } else {
      // 替换下一个 state
      finalState = update;
    }
  }

  return finalState;
}

//渲染，然后在某个函数内有
state = getFinalState(baseState, queue);
```

## useReducer 实现

经典 map-reduce 思路可是却没有按照`map()`和`reduce()`分开的思路写，可能是 map 已经做了关键字，但是`map()`的功能还是要写。在`xxxReducer(task, action)`中，写`map()`，例如：

```javascript
function xxxReducer(task, action) {
  switch (action.type) {
    case 'task_1': {
      return ...;
    }
    case 'task_2': {
      return ...;
    }
    case 'task_3': {
      return ...;
    }
    default: {
      throw Error('未知 action: ' + action.type);
    }
  }
}
```

库里倒是帮你写好了`reduce()`

```javascript
import { useState } from "react";

export function useReducer(reducer, initialState) {
  const [state, setState] = useState(initialState);

  function dispatch(action) {
    setState((s) => reducer(s, action));
  }

  return [state, dispatch];
}
```

## useContext

指定某个值的作用域，用 xxxContext 标签包裹实现，包裹下的标签符合 context 的的作用域。

```javascript
<xxxContext value={xxx}>
  //在这个标签内的子标签的JSX中使用 const xxx =
  //useContext(xxxContext);就可以是同一个xxx。同一个属性会被最近的作用域覆盖，不同的共存。
</xxxContext>
```

## useRef

和`useState`类似这个更偏向全局变量的概念，这个东西更改不会触发重渲染而 state 会，并且和所有语言中的全局变量一样，运行时这个东西不确定，因此不要在渲染时对它读写。提交时生效。

### 何时使用

通常，当组件需要“跳出” React 并与外部 API 通信时，会用到 ref ，通常是不会影响组件外观的浏览器 API。以下是这些罕见情况中的几个：

- 存储 timeout ID
- 存储和操作 DOM 元素（反直觉，`ref = {xxxRef}`是把拥有左边 ref 的 DOM 的引用传入 JSX 的 xxxRef 中，以获得类似`this``的效果）
- 存储不需要被用来计算 JSX 的其他对象。

如果你的组件需要存储一些值，但不影响渲染逻辑，请选择 ref。

## useEffect

Effect 应当只在用于执行某个组件显示给用户时组件需要执行的代码，例如显示聊天界面时连接服务器，通常用于取外部 API 数据。可用来同步。感觉是一个函数对象，需要清理副作用行为。在提交时运行。在开发环境的 strict 模式下，这东西会被执行两次以查找潜在 bug，官方的建议是别管。

### 死循环

```javascript
const [count, setCount] = useState(0);
useEffect(() => {
  setCount(count + 1);
});
```

由于 Effect 在提交时运行，所以这个代码：改变状态->触发渲染->开始提交->改变状态->触发渲染->开始提交->...

### 避免多余的执行 effect

`useEffect(function,dependence)`的第二个参数是个列表参数，里面指定 effect 依赖的状态，如果状态未更新，则该 effect 无需执行。依赖列表中可以省略 ref

```javascript
useEffect(() => {
  // 这里的代码会在每次渲染后运行
});

useEffect(() => {
  // 这里的代码只会在组件挂载（首次出现）时运行
}, []);

useEffect(() => {
  // 这里的代码不但会在组件挂载时运行，而且当 a 或 b 的值自上次渲染后发生变化后也会运行
}, [a, b]);
```

### 清理函数

`function useEffect(function,dependence)`的返回值是一个函数，作用是清理内部引发的副作用，如果副作用应当只发生一次，那么就应该返回一个清理函数来结束那个副作用。

```javascript
useEffect(() => {
  const something = createSomething();
  something.do();
  return () => {
    something.undo();
  };
}, []);
```

## 常用获取外部数据写法

使用一个 flag 来进行同步处理，时间较前获取的数据将被 ignore 置为真时丢弃，只会获取最后一次数据。

```javascript
useEffect(() => {
  let ignore = false;
  fetchResults(query, page).then((json) => {
    if (!ignore) {
      setResults(json);
    }
  });
  return () => {
    ignore = true;
  };
}, [query, page]);
```

## useMemo

用来缓存时空性能不佳的计算操作，缓存对象应当是纯函数的结果。渲染期执行。但是现代 react 编译器大多数情况下已经自动帮你干这件事了。

```javascript
const something = useMemo(() => function(a, b), [a, b]);
```

当且仅当参数`a`,`b`改变时重新计算。

## useSyncExternalStore

订阅了一个外部的 store 数据。用来替代在 effect 中写取外部数据逻辑。

```javascript
return useSyncExternalStore(
  callback, // 只要传递的是同一个回调函数，React 不会重新订阅
  () => xxx.store, // 如何在客户端获取值
  () => true // 如何在服务端获取值
);
```

## useEffectEvent

如果你的 useEffect 中有不希望随着某个依赖更新而更新的部分，提取出来放到这里面去。感觉 react 的同步机制就是交给框架处理然后搞出了一堆重复的东西。

下面的`function()`依赖`a`不依赖`b`但是`b`更新了会导致`function`执行，这不是设计的目的。

```javascript
useEffect(() => {
    function(a);
  }, [a, b]);
```

因此，引入`useEffectEvent`就可以避免这个问题。

```javascript
const onFunction = useEffectEvent(a => {
    function(a)
});

useEffect(() => {
    onFunction(a);
  }, [a, b]);
```

一个`useEffectEvent`最好直接跟在它的`useEffect`附近。
