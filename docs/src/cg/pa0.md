# 回忆

本科期间早已上过基于 learn OpenGL 的图形学，最远学到了光追。并且通过高等代数、线性代数、毕设、考研等几大关把线性代数给轮了好几遍，按说完全没问题，可惜高估了自己的记忆，无可奈何，重放吧。

图形学的数学是$R^2$,$R^3$,$R^4$的。

## 点乘

- 向量的点乘在图形学的一个用处是求两个向量的夹角。
- 另一个用处是求向量$a$在另向量$b$上的投影向量。
  - $b_{\bot} = ka = |b|cos(\theta) a = |b|\frac{a \cdot b}{|a||b|} \cdot a= \frac{a\cdot b}{|a|}\cdot a$
  - 垂直于$a$的向量就可易得 $b-$$b_{\bot}$
- 两向量点乘大于等于 0 则同处一个方向，否则则不在一个方向。同一个方向的定义是作任一向量的法线，两向量的指向同属法线一侧。

![](/pa0_1.png)

## 叉乘

- 两向量$a,b$叉乘的结果是垂直于它们的向量。

  - $a \times b$ 的方向是右手定则下，四非拇指与$a$贴紧，弯曲关节指向$b$时，拇指竖直指向的方向。大小是$|a||b|sin \theta$

- $a \times b$ > 0 则 b 在 a 左侧，反之则在右侧。
- 判断一点是否在三角形内部，取其三边的向量，与三角形顶点指向该点的向量作叉乘，均同正负即在内部。

## 线性变换

线性变换武断一点就是可以写成一个可逆矩阵的变换。

伟大的三蓝一棕告诉我们，线性变换与矩阵一一对应，可以通过对基向量$x = (1, 0), y = (0, 1)$重定位算出，注意我们默认向量是竖着的，这里横着写只是为了好写，且变换矩阵默认左乘。

比如：

- 缩放矩阵
  $$x \to x^{'} = (1, 0) \to (s_x, 0), y \to y^{'} = (0, 1) \to (0, s_y)$$
  $$
  S(s_x, s_y) = \begin{bmatrix}
  s_x&0 \\
  0&s_y
  \end{bmatrix}
  $$
- 反射矩阵
  $$x \to x^{'} = (1, 0) \to (-1, 0), y \to y^{'} = (0, 1) \to (0, 1)$$
  $$
  RFL = \begin{bmatrix}
  -1&0 \\
  0&1
  \end{bmatrix}
  $$
- 切变矩阵
  $$x \to x^{'} = (1, 0) \to (1, 0), y \to y^{'} = (0, 1) \to (a, 1)$$
  $$
  SHR(a) = \begin{bmatrix}
  1&a \\
  0&1
  \end{bmatrix}
  $$
- 旋转矩阵
  $$x \to x^{'} = (1, 0) \to (\cos \theta, \sin \theta), y \to y^{'} = (0, 1) \to (-\sin \theta, \cos \theta)$$
  $$
  R(\theta) = \begin{bmatrix}
  \cos \theta&-\sin \theta \\
  \sin \theta&\cos \theta
  \end{bmatrix}
  $$

## 非线性变换

然而，我们从小到大最熟悉的平移变换却是非线性变换，也就无法仅仅用一个可逆矩阵表示，但是还是可以用线性变换矩阵与偏置表示

$$
T(t_x,t_y)= \begin{pmatrix}
 x^{'}\\ y^{'}

\end{pmatrix} =   \begin{bmatrix}
    a&b \\
    c&d
    \end{bmatrix} \begin{pmatrix}
 x\\ y

\end{pmatrix}+\begin{pmatrix}
 t_x\\ t_y

\end{pmatrix}
$$

## 统一

数学上为什么别管，增加一个维度就可以统一了(升维，很神奇吧)。
一个二维平面上的“东西”可以这样表示：$(x, y, w)$

- 其中 $w = 0$时，代表点$(x, y, 0)$
- 其中 $w = 1$时，代表向量$(x, y, 1)$

我本科图形学老师告诉我$w$不止有这些意义，他告诉我$w = 0$时可以视作无穷远点，即平行光的方向。$w$不为 1 也不为 0 时，视作透视缩放。
这个“东西”的数学是这样的:

- 向量+向量=向量
- 点-点=向量
- 向量+点=点
- 点+点=两点中点($w=2$,缩放就是$\frac{1}{w}=\frac{1}{2}$)
  然后，线性变换以及平移就可以统一为：

  $$
   \begin{pmatrix}
   x^{'}\\ y^{'}\\ 1
  \end{pmatrix} = \begin{bmatrix}
  a&b &t_x\\
  c&d &t_y\\
  0&0&1
  \end{bmatrix}
  \begin{pmatrix}
  x\\ y\\ 1
  \end{pmatrix}
  $$

那么，之前定义的重要变换矩阵$T，R，S$
可以表示为：

$$
T(t_x,t_y)=  \begin{bmatrix}
  1&0 &t_x\\
  0&1 &t_y\\
  0&0&1
  \end{bmatrix}
$$

$$
R(\theta) = \begin{bmatrix}
\cos \theta &-\sin \theta &0\\
\sin \theta&\cos \theta &0\\
0&0&1
\end{bmatrix}
$$

$$
  S(s_x, s_y) = \begin{bmatrix}
  s_x&0 &0\\
  0&s_y&0\\
  0&0&1
  \end{bmatrix}


$$

注意，与上面的仿射变换一致，这样的矩阵代表的都是先线性变换再平移。容易证明，这样的矩阵一定可逆。因此，所有变换的最终结果等于是对应矩阵之积对应的变换。

由于矩阵运算不全满足交换性质，这代表并非所有变换都可以交换(对角矩阵是可交换的，意味着放缩、镜像变换可交换；二维旋转矩阵可交换，旋转变换也是可交换的)，因此矩阵顺序很重要。

绕某点$C(x,y)$旋转的例子：
先平移回原点，再旋转，再平移回$C$:
$$T(x,y)R(\theta)T(-x,-y)$$

矩阵左乘造成了最先的变换的矩阵在算式的最右侧，顺序，这一点要记住。

# 作业

点$P(2,1)$先绕原点转四十五度再平移(1,2)，翻译成变换易得:
$T(1,2)R(\frac{\pi}{4})P$
然后就是无聊的填数游戏。

## 核心代码

::: details

```c++
...
#define PI std::acos(-1)
#define ANGLE_TO_RADIAN(X) (X) / 180.0f * PI
...
 Eigen::Vector3f P(2.0f, 1.0f, 1.0f);
    Eigen::Matrix3f T;
    float a = ANGLE_TO_RADIAN(45);
    T << std::cos(a), -std::sin(a), 1.0,
        std::sin(a), std::cos(a), 2.0,
        0.0, 0.0, 1.0;
    std::cout << T * P << std::endl;

```

:::

$$
$$
