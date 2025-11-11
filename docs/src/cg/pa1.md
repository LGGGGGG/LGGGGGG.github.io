# 三维变换

我们到现在还是只能渲染二维图像的三维生物，所以图形学学到三维顶天了，与二维变换类似的，下面将展示关键变换矩阵的形状。

- 仿射矩阵
  $$
      \begin{pmatrix}
     x^{'}\\ y^{'}\\ z^{'}\\ 1
    \end{pmatrix} = \begin{bmatrix}
    a&b &c&t_x\\
    d&e&f &t_y\\
    g&h&i&t_z\\
    0&0&0&1
    \end{bmatrix}
    \begin{pmatrix}
    x\\ y\\ z\\ 1
    \end{pmatrix}
  $$
- 缩放矩阵

  $$
      S(s_x,s_y,s_z) =
      \begin{bmatrix}
      s_x&0 &0&0\\
      0&s_y&0 &0\\
      0&0&s_z&0\\
      0&0&0&1
      \end{bmatrix}


  $$

- 平移矩阵

  $$
      T(t_x,t_y,t_z) =
      \begin{bmatrix}
      1&0 &0&t_x\\
      0&1&0 &t_y\\
      0&0&1&t_z\\
      0&0&0&1
      \end{bmatrix}


  $$

- 旋转矩阵（绕看向轴负方向的逆时针转）

  $$
      R_x(\theta) =
      \begin{bmatrix}
      1&0 &0&0\\
      0&\cos \theta&-\sin \theta &0\\
      0&\sin \theta&\cos \theta&0\\
      0&0&0&1
      \end{bmatrix}


  $$

  $$
     R_y(\theta) =
     \begin{bmatrix}
     \cos \theta&0 &-\sin \theta&0\\
     0&1&0&0\\
     \sin \theta&0&\cos \theta&0\\
     0&0&0&1
     \end{bmatrix}


  $$

  $$
     R_z(\theta) =
     \begin{bmatrix}
     \cos \theta&-\sin \theta &0&0\\
     \sin \theta&\cos \theta&0&0\\
     0&0&1&0\\
     0&0&0&1
     \end{bmatrix}


  $$

**_绕刚体某一轴_** 旋转变换一定可分解：$R(\alpha, \beta,\gamma) = R_x(\alpha)R_y(\beta)R_z(\gamma)$.
其中$\alpha, \beta,\gamma$是欧拉角，这可能会有万向节死锁问题，简单来说就是复合运算后，矩阵中某个角度信息经过运算消掉了，导致解(变换)不唯一的问题，使用四元数来解决这个问题。

**_绕空间中某一轴_** $n$旋转$\theta$的旋转矩阵为罗德里格斯旋转公式：

$$
R(n, \theta) = \cos(\theta)I+((1-\cos(\theta)))nn^T+\sin(\theta)\begin{bmatrix}
     0&-n_z&n_y\\
     n_z&0&-n_x\\
     -n_y&n_x&0\\
     \end{bmatrix}
$$

# 摄像机空间

摄像机相当于人眼，摄像机拍到什么，我们在计算机屏幕中就看到什么。

核心是$M,V,P$变换，也就是世界坐标、摄像机坐标、投影坐标的变换，变换和矩阵一一对应，也就是操作$M,V,P$矩阵。下面的论述自然以世界坐标作为论述。

摄像机在世界坐标下的参数：

- 位置$e$
- 摄像头朝向 $\hat{g}$
- 底片竖直对称轴指向 $\hat{t}$

规定$\hat{g} \bot \hat{t}$。

若相机和物体的相对位置不变，无论如何移动相机和物体，拍到的照片都是一致的，为了简化计算，我们常常把相机的位置移到原点，并且让摄像头朝向 Z 轴负方向，底片竖直对称轴指向 y 轴正方向。即
$$\begin{align}e &= (0,0,0)\\ \hat{g} &= -z \\ \hat{t} &= y \end{align}$$

那么物体也要进行同样的变换，需要得到变换矩阵$V$，我们有$V = RT$,其中$T$是将相机原点$e=(e_x, e_y,e_z)$移动至世界原点的平移矩阵，$R$是将$\hat{g}$对准 $-z$,$\hat{t}$对准 $y$, $\hat{g} \times \hat{t}$ 对准 $x$的旋转矩阵。
所以有：

$$
     T =
     \begin{bmatrix}
     1&0 &0&-e_x\\
     0&1&0 &-e_y\\
     0&0&1&-e_z\\
     0&0&0&1
     \end{bmatrix}
$$

从相机角度转到世界角度不太好直接求，但是反过来很简单，再利用旋转矩阵是正交矩阵，其转置矩阵就是逆矩阵的性质轻易求得旋转矩阵。

$$

     R = (R^{-1})^{T}=
     \begin{bmatrix}
     x_{\hat{g} \times \hat{t} }&x_{ \hat{t} } &x_{-\hat{g}  }&0\\
     y_{\hat{g} \times \hat{t} }&y_{ \hat{t} } &y_{-\hat{g}  }&0\\
     z_{\hat{g} \times \hat{t} }&z_{ \hat{t} } &z_{-\hat{g}  }&0\\
     0&0&0&1
     \end{bmatrix}^T=\begin{bmatrix}
     x_{\hat{g} \times \hat{t} }&y_{\hat{g} \times \hat{t} } &z_{\hat{g} \times \hat{t} }&0\\
     x_{ \hat{t} }&y_{ \hat{t} } &z_{z\hat{t}  }&0\\
     x_{-\hat{g} }&y_{ -\hat{g} } &z_{-\hat{g}  }&0\\
     0&0&0&1
     \end{bmatrix}


$$

那么最后变换矩阵就是：

$$

     V = RT=
     \begin{bmatrix}
     x_{\hat{g} \times \hat{t} }&y_{\hat{g} \times \hat{t} } &z_{\hat{g} \times \hat{t} }&-e_x\\
     x_{ \hat{t} }&y_{ \hat{t} } &z_{z\hat{t}  }&-e_y\\
     x_{-\hat{g} }&y_{ -\hat{g} } &z_{-\hat{g}  }&-e_z\\
     0&0&0&1
     \end{bmatrix}
$$

这样被观测的物体就被变换到了保持与相机相对位置不变的世界坐标下。

# 投影空间

很简单，相机里物体的成像大小并不是真实物体大小，我们需要进行一定的投影，根据投影法则有正交投影和透视投影两种。
![](/pa1_1.png)

## 正交投影

最简单的做法是，用摄像机在世界原点下从负 z 轴方向看向物体，然后把物体的 z 轴拍扁，然后将物体放缩至$[-1,1]^2$的平面内即可。
然而这会丢失遮挡物体的层次关系，所以现在不这么做。

而是将物体用一个外切立方体$[f,n] \times [l,r] \times [b,t]$包裹住，平移缩放至一个中心在$(0,0,0)$的$[-1,1]^3$的正方体内。
![](/pa1_2.png)
易得变换矩阵为：

$$
P_O = \begin{bmatrix}
     \frac{2}{r-l} &0 &0&-\frac{r+l}{r - l}\\
     0&\frac{2}{t-b} &0&-\frac{t + b}{t - b}\\
     0&0 &\frac{2}{n-f}&-\frac{n + f}{n - f}\\
     0&0&0&1
     \end{bmatrix}
$$

左手系可以轻易地通过比较 f(远平面 z 值)和 n(近平面 z 值)来判断远近关系，而右手系要反向，且会有远大近小这种反直觉的事情出现，左手系的坏处是坐标轴叉乘方向不对。

## 透视投影

人眼是遵循透视的，地平线远端的轨道是交与一点的，所以透视投影是必要的。
![](/squish.png)
很简单，先把包围盒的近平面压缩，使包围盒变成一个棱台，再完成正交投影。
$$P_P = P_OM$$

下面我们求$M$,设包围盒中任意一点$(x,y,z)$,经过$M$变换后得到$(nx/z,ny/z,?)$，前两个分量可由相似三角形易得。
即：

$$
    M\begin{pmatrix}
        x \\ y \\ z \\ 1
    \end{pmatrix}=\begin{pmatrix}
        nx/z \\ ny/z \\ ? \\ 1
    \end{pmatrix}\equiv \begin{pmatrix}
        nx \\ ny \\ ? \\ z
    \end{pmatrix}
$$

然后容易得到(右乘列向量的转置，除以模长即可)：

$$
    M =\begin{bmatrix}
     n &0 &0&0\\
     0&n &0&0\\
     ?&?&?&?\\
     0&0&1&0
     \end{bmatrix}=\begin{bmatrix}
     n &0 &0&0\\
     0&n &0&0\\
     A&B&C&D\\
     0&0&1&0
     \end{bmatrix}
$$

又有近平面上点不变，远平面上点的 z 分量不变有：

$$
\begin{bmatrix}
     n &0 &0&0\\
     0&n &0&0\\
     A&B&C&D\\
     0&0&1&0
     \end{bmatrix}\begin{pmatrix}
        x \\ y \\ n \\ 1
    \end{pmatrix}=\begin{pmatrix}
        nx \\ ny \\ Ax+Bx+Cn+D \\ n
    \end{pmatrix}=\begin{pmatrix}
        nx \\ ny \\ n^2 \\ n
    \end{pmatrix}
$$

$$
\begin{bmatrix}
     n &0 &0&0\\
     0&n &0&0\\
     A&B&C&D\\
     0&0&1&0
     \end{bmatrix}\begin{pmatrix}
        0 \\ 0 \\ f \\ 1
    \end{pmatrix}=\begin{pmatrix}
        0 \\ ny \\ Cf+D \\ f
    \end{pmatrix}=\begin{pmatrix}
        0 \\ 0 \\ f^2 \\ f
    \end{pmatrix}
$$

有

$$
    \begin{cases}
    Cn+D = n^2\\ Cf+D = f^2

\end{cases}
$$

最终解得$A=B=0,C=n+f,D=-nf$

$$
 M =\begin{bmatrix}
     n &0 &0&0\\
     0&n &0&0\\
     0&0&n+f&-nf\\
     0&0&1&0
     \end{bmatrix}
$$

这样$P_P = P_OM$就求完了。

但现在相当于$f$已知，$n,l,r,b,t$未知。
但是，当我们选定$n$后，则全部参数已知，如图所示：
![](/viewport.png)
![](/lrbt.png)
易得

- $t = |n|\tan \frac{fov Y}{2}$
- $b = -t$
- $r = t \cdot aspect$
- $l = -r$

## 作业

构造$M,P$两个矩阵，本科图形学课这都是封装好了，现在写写也好。

### 核心代码

想起来 eigen 的坑了，还是 QT 舒服。

::: details
坑爹的 zNear 和 zFar 给的是绝对值，是否应该提前说明？

```c++
Eigen::Matrix4f get_model_matrix(float rotation_angle)
{
    Eigen::Matrix4f model = Eigen::Matrix4f::Identity();
    float a = ANGLE_TO_RADIAN(rotation_angle);
    float cosa = std::cos(a), sina = std::sin(a);
    model(0, 0) = cosa;
    model(0, 1) = -sina;
    model(1, 0) = sina;
    model(1, 1) = cosa;


    return model;
}

Eigen::Matrix4f get_projection_matrix(float eye_fov, float aspect_ratio,
                                      float zNear, float zFar)
{
    // Students will implement this function

   Eigen::Matrix4f projection = Eigen::Matrix4f::Identity();
    float n = zNear,
          f = zFar,
          t = std::abs(n) * std::tan(ANGLE_TO_RADIAN(eye_fov / 2)),
          b = -t,
          r = t * aspect_ratio,
          l = -r;
    projection(0, 0) = 2 / (r - l);
    projection(0, 3) = -(r + l) / (r - l);
    projection(1, 1) = 2 / (t - b);
    projection(1, 3) = -(t + b) / (t - b);
    projection(2, 2) = 2 / (f - n);
    projection(2, 3) = -(n + f) / (f - n);

    Eigen::Matrix4f M;
    M << n, 0, 0, 0,
        0, n, 0, 0,
        0, 0, n + f, -n * f,
        0, 0, 1, 0;
    return projection * M;
}
Eigen::Matrix4f get_rotation(Vector3f axis, float angle)
{
    Eigen::Matrix3f R, N, I = Eigen::Matrix3f::Identity();
    float a = ANGLE_TO_RADIAN(angle);
    N << 0, -axis[2], axis[1],
        axis[2], 0, -axis[0],
        -axis[1], axis[0], 0;
    R = std::cos(a) * I + (1 - std::cos(a)) * axis * axis.transpose() + std::sin(a) * N;
    Eigen::Matrix4f res;
    res << R(0, 0), R(0, 1), R(0, 2), 0,
        R(1, 0), R(1, 1), R(1, 2), 0,
        R(2, 0), R(2, 1), R(2, 2), 0,
        0, 0, 0, 1;
    return res;
}
```

:::
