# 光线追踪

老网红项目了，不过大部分人应该都是玩/做游戏又不是做动画，很难理解过分拔高这个技术的用意，也许是“难就是好”这种诡异逻辑的拥趸吧。

光栅化不考虑物体与物体之间的之间的光照关系，并且又独立渲染每一个三角面片，三角面片之间没有考虑相互的关系，这使得光栅化缺少全局效果，无法处理软阴影、光泽反射、间接光照等需求。主要用于实时渲染中，比如网络游戏、直播。

相比较光栅化，光线追踪是从相机出发，计算相机发出的光线（视线）与场景产生的结果，这里的光线可能会与场景中的物体碰撞后生成另外一些光线，然后生成的光线也需要继续做计算。所以对于光线追踪来说，相机产生的光线是知道整个场景信息的。所以常常用来做电影特效、各种动画。

光栅化与光线追踪的对比：

1. 光栅化快，实时，是一种近似算法

2. 光线追踪慢，离线，是一种准确的算法

## 阴影映射

之前的讨论中都没有考虑阴影这个会影响表现效果的关键因素，现在需要引入。

定义阴影：既不被相机也不被光源看到的点。

判断方式：

1. 在光源处执行一次光栅化，获得各点的深度信息。
2. 在相机处执行一次光栅化，获得各点的深度信息，对深度信息执行从相机到光源的变换，比对变换后和在光源处深度信息，若一致则不是阴影，相反则是阴影。

![](/shadow.png)

优点：快！

缺点：

- 只能应对硬阴影。
- 对分辨率有要求，太低走样，太高开销会大。
- 变换会造成浮点误差，浮点数相等不是一个好的相等。

硬阴影可以理解为本影，也就是因为物体遮挡而绝对无光的区域；软阴影可以理解为半影，也就是光源与物体的距离、角度和光源大小共同决定的“透明”的阴影。
|![](/hardshadow.png)|![](/softshadow.png)|
|:--:|:--:|
|硬阴影|软阴影|

## Whitted 风格的递归光线追踪

方法假设：

- 光沿直线传播
- 两条光线不会发生碰撞
- 光路可逆
- 光线在碰撞到物体后还会产生折射和反射
- 每发生一次折射或者反射（弹射点）都计算一次着色，前提是该点不在阴影内

算法过程：

1. 从视点从成像平面发出光线，检测是否与物体碰撞

2. 碰撞后生成折射和反射部分

3. 递归计算生成的光线

4. 所有弹射点都与光源计算一次着色，前提是该弹射点能被光源看见

5. 将所有着色通过某种加权叠加起来，得到最终成像平面上的像素的颜色

![](/rta.png)

图中 primary ray 指从视角出发第一次打到物体的光线，secondary rays 指弹射之后的光线，shadow rays 指判断可见性的光线。

## 光线-表面 相交算法

我们来到了八股的核心，相交/碰撞检测。

光线定义,$O$是光源坐标，$D$是方向向量，$t$是时间：
$$r(t) = O + tD \quad t \in [0,+ \infty)$$

表面定义：

$$f(v) = 0$$

判断相交即求解$t$受方程：$f(O + tD) = 0$约束，且为正实数。

### 与模型表面相交

判断是否在模型内：一个点在封闭图形内，在任意方向打一束光线出去

- 奇数个交点：内
- 偶数个交点：外

现在大部分模型都是三角面片，所以算法可以进一步细化为：

先求光线和平面的交点 $\to$ 再判断点是否在三角形内。

#### 求与平面交点

表示平面有点法式，取平面上两点及平面法向量就可以唯一确定一个平面：$(P-P^{'})N=0$

设光线和平面交点为$P$,则有
$$(P-P^{'})N= (O + tD-P^{'})N = 0$$

$$
t = \frac{(P^{'}-O)}{D}
$$

判定$t$是否是正实数。

#### 判定是否在三角形内

求交点的重心坐标判断分量是否全非负即可。

同时也给出了一种同时求交和判定的快速算法：Möller–Trumbore 算法。
![](/MT.png)

## 作业

翻译即可。
::: details
注意：将$(0,0) \to (-1, -1),(0,h) \to (-1,1), (w, 0) \to (1,-1), (w, h) \to (1, 1)$

求得变换矩阵

$$
\begin{pmatrix}
x^{'}\\ y^{'}
\end{pmatrix}=\begin{bmatrix}
\frac{2}{w}&0 \\
0&\frac{2}{h}
\end{bmatrix}\begin{pmatrix}
x\\ y
\end{pmatrix}+\begin{pmatrix}
-1\\-1
\end{pmatrix}=\begin{pmatrix}
\frac{2x}{w} - 1 \\ \frac{2y}{h} - 1
\end{pmatrix}


$$

由于 y 是从上往下的，还需要反向。

```c++
void Renderer::Render(const Scene &scene)
{
    int w = scene.width, h = scene.height;
    std::vector<Vector3f> framebuffer(w * h);

    float scale = std::tan(deg2rad(scene.fov * 0.5f));
    float imageAspectRatio = scene.width / (float)scene.height;

    // Use this variable as the eye position to start your rays.
    Vector3f eye_pos(0);
    int m = 0;
    for (int j = 0; j < h; ++j)
    {
        for (int i = 0; i < w; ++i)
        {
            // generate primary ray direction

            // TODO: Find the x and y positions of the current pixel to get the direction
            // vector that passes through it.
            // Also, don't forget to multiply both of them with the variable *scale*, and
            // x (horizontal) variable with the *imageAspectRatio*
            float x = (2 * (i + 0.5f) / w - 1) * imageAspectRatio * scale;
            float y = (1 - 2 * (j + 0.5f) / h) * scale;

            Vector3f dir = normalize(Vector3f(x, y, -1)); // Don't forget to normalize this direction!
            framebuffer[m++] = castRay(eye_pos, dir, scene, 0);
        }
        UpdateProgress(j / (float)scene.height);
    }

}
```

逐条翻译

```c++
bool rayTriangleIntersect(const Vector3f &v0, const Vector3f &v1, const Vector3f &v2, const Vector3f &orig,
                          const Vector3f &dir, float &tnear, float &u, float &v)
{
    // TODO: Implement this function that tests whether the triangle
    // that's specified bt v0, v1 and v2 intersects with the ray (whose
    // origin is *orig* and direction is *dir*)
    // Also don't forget to update tnear, u and v.
    auto e1 = v1 - v0;
    auto e2 = v2 - v0;
    auto s = orig - v0;
    auto s1 = crossProduct(dir, e2);
    auto s2 = crossProduct(s, e1);
    auto f = dotProduct(s1, e1);

    auto t = dotProduct(s2, e2) / f;
    auto b1 = dotProduct(s1, s) / f;
    auto b2 = dotProduct(s2, dir) / f;
    if (t >= 0 && b1 >= 0 && b2 >= 0 && 1 >= b1 + b2)
    {
        tnear = t;
        u = b1;
        v = b2;
        return 1;
    }
    return false;
}

```

![](/binary.png)
:::
