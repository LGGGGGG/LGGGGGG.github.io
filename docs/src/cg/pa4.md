# 几何

几何在图形学中的问题就是如何表示三维模型。哥们的本科毕设与此息息相关。

## 隐式表示

### 方程表示

没有给出模型三角面片各顶点的具体坐标，只给出点满足的表达式$f(x,y,z) = 0$，例如球面方程$x^2+y^2+z^2 - 1 = 0$。显然这样的的表示非常容易判断一点在模型内还是外：$f(x,y,z) > 0$时在模型外，$f(x,y,z) < 0$时在模型内。但是想求模型上一点未必简单，甚至未必有根式解。

### 构造实体几何(CSG, Constructive Solid Geometry)

通过对基本模型的基本布尔运算（并集、交集、差集），来定义新的模型。
![](/csg.png)

### 符号距离函数(Signed Distance Functions)

使用一个点到某个模型表面的最近距离来表示一个模型，这就是符号距离函数$SDF$,距离带符号，为正在模型外，为负在模型内。可以通过在模型空间内，模型坐标系对齐以后，两个$SDF$简单相加得出两个模型融合的样子。
![](/disfunc.png)

### 水平集(Level Set Methods)

就是地图上的等高线。

### 分形

递归描述图形，用来生成随机地图和海岸线(分形本身就算是研究海岸线起家的)。但是容易递归过深导致走样，需要设定阈值。

### 优点和缺点

- 优势在于表示简单，容易判定物体间的关系，方便用来光线追踪，简单物体不会出现采样错误，很容易进行拓扑变换。
- 劣势在于绝大多数模型难以用简单的函数去描述，分段太多得不偿失。

## 显示表示

### 参数映射

和水平集一个思路，不过一个记函数，一个记值。
![](/explicit.png)

### 点云

直接用点来表示整个物体，点不够时就有点抽象了，一般用于传感器比较多的时候，比如车载雷达之类的。

### 多边形面(Polygon Mesh)

业界用得最多的，也就是传说中的.obj 文件。格式如下：

- v：顶点坐标；

- vt：纹理坐标；

- vn：每个面的法向；

- f：描述哪三个顶点构成三角形，格式为 三角形顶点/纹理坐标/法线坐标；

## 贝塞尔曲线

本科图形学老师的专业领域，B 样条和贝塞尔，用来给骨头建模。

### 定义

一条贝塞尔曲线由一系列控制点$b_0,b_1,\cdots,b_n$定义。首先连接各点得到$n-1$条边,取每边的同个编号的$t$分点,$t \in [0,1]$得到下一列控制点$b_0^1,b_2^1,\cdots,b_{n-1}^1$,重复该过程直至剩下唯一一个点$b_0^n$,点列$b_0^i,i \in [0,n]$的平滑连线就是所求的贝塞尔曲线。
![](/bezier.png)
$$b_0^i(t) = \sum ^i_{j = 0}b_jC_i^jt^j(1-t)^{i-j}$$

### 性质

- $b(0) = b_0, b(1) = b_{n-1}$
- 端点切线斜率$b^{'}(0)=(n-1)(b_1-b_0),b^{'}(1)=(n-1)(b_{n-1}-b_{n-2})$
- 仿射变换后做贝塞尔曲线，与先做贝塞尔曲线再仿射变换，结果一致
- 凸包性质：贝塞尔曲线一定在凸包（最小围住控制点的多边形）内

### 推论

控制点过多时，反而更难“控制”贝塞尔曲线的走向，需要通过分段连接来真正控制贝塞尔曲线的形状。

但是如果简单连接的话(称为$C^0$连续)效果未必是我们想要的。

因此，一般要求连接点处一阶导数连续，称为$C^1$连续，更严格的会要求二阶导数连续，称为$C^2$连续，本科导师告诉我现实中一般做到$C^2$连续就够了，飞机外壳一般是$C^2$连续的。

## 表面

### 贝塞尔表面

举一个例子说明即可：考虑$4 \times 4$的控制点阵，先用每列四个控制点画出四条贝塞尔曲线（图中灰色，参数 u 控制），再利用这四条曲线在相同参数 u 上的点，画出一条贝塞尔曲线（图中蓝色，参数 v 控制）。诸多这样蓝色的曲线就可以组成贝塞尔曲面。
![](/bs2.png)

### 网格

然而现实中大部分应用中的物体表面都是用网格表示，三角面片足够多什么都能给你近似出来。这里主要介绍一般应用中的几种操作。
![](/mesh.png)

#### 网格细分

我们需要更光滑的表面时，可以对网格执行细分操作。
网格细分的思路是：

1. 创建更多的三角形（顶点）

2. 调整所有顶点的位置

下面是两种细分方式

##### loop 细分(loop 是人名)

对于每个三角面片，取中点分成四份。
![](/loop1.png)
为了使表面更光滑,新点将诞生于$\frac{3}{8}(A+B)+\frac{1}{8}(C+D)$处。
![](/newvtx.png)

老点要调整位置，取某个老点的度$n$及一个超参数$u$,做一个加权平均，在老点度较小时保留原本位置信息，度较大时由其它点约束。
![](/oldvtx.png)

##### Catmull-Clark 细分

假如模型不使用三角面片，对于更一般的情形可以用 Catmull-Clark 细分。
对于度不为 4 的点称为奇异点，不是四边形的面称为非四边形面片。

对于所有的面，取其重心和各边中点成为新点，连接新点之后必不存在非四边形面片。
![](/cnewvtx.png)
然后就是调整位置。
![](/fyi.png)

#### 网格简化

面片数太多会给游戏等即时渲染程序以过大压力，因此要降低面数。

这里介绍边坍缩算法。
![](/ec.png)
选择一边坍缩至一个点，选边的标准是坍缩后，各个顶点的二次度量误差最小，最常用的误差就是距离的平方。
![](/eq.png)

于是简化的步骤如下：（贪心算法）

1. 假设坍缩每一条边，然后分别得到它们的二次误差。 做为各自的分数

2. 每次都坍缩分数最小的边，然后更新被影响边的分数

3. 重复步骤 1

懒删除最小堆做这个，维护分数数组，最小堆存边和分数，堆顶分数与数组中一致时坍缩，否则出堆。

#### 网格正则化

一句话，把所有三角面片变成正三角形。

## 作业

感觉不如 B 样条......难度
::: details

````c++
cv::Point2f recursive_bezier(const std::vector<cv::Point2f> &control_points, float t)
{
    // TODO: Implement de Casteljau's algorithm
    int n = control_points.size();
    if (n == 1)
        return control_points[0];
    std::vector<cv::Point2f> new_control_points(n - 1);
    for (int i = 0; i < n - 1; ++i)
        new_control_points[i] = t * control_points[i] + (1 - t) * control_points[i + 1];

    return recursive_bezier(new_control_points, t);
}

void bezier(const std::vector<cv::Point2f> &control_points, cv::Mat &window)
{
    // TODO: Iterate through all t = 0 to t = 1 with small steps, and call de Casteljau's
    // recursive Bezier algorithm.
    for (double t = 0.0; t <= 1.0; t += 0.001)
    {
        cv::Point2f point = recursive_bezier(control_points, t);

        window.at<cv::Vec3b>(point.y, point.x)[1] = 255;
    }
}
```
反走样
```c++
void bezier_antialiasing(const std::vector<cv::Point2f> &control_points, cv::Mat &window)
{
    // TODO: Iterate through all t = 0 to t = 1 with small steps, and call de Casteljau's
    // recursive Bezier algorithm.
    for (double t = 0.0; t <= 1.0; t += 0.001)
    {
        cv::Point2f point = recursive_bezier(control_points, t);

        float x = point.x;
        float y = point.y;
        float u = x - (int)x + 0.5;
        float v = y - (int)y + 0.5;
        if (u > 1)
        {
            u = u - 1;
        }
        if (v > 1)
        {
            v = v - 1;
        }

        float d00 = pow(u, 2) + pow(v, 2);
        float d01 = pow(1 - u, 2) + pow(v, 2);
        float d10 = pow(u, 2) + pow(1 - v, 2);
        float d11 = pow(1 - u, 2) + pow(1 - v, 2);

        window.at<cv::Vec3b>(y, x)[1] =
            fmin(255, window.at<cv::Vec3b>(y, x)[1] + 255 * (1 - sqrt(d00 / 2)));
        window.at<cv::Vec3b>(y, x + 1)[1] =
            fmin(255, window.at<cv::Vec3b>(y, x + 1)[1] + 255.0 * (1 - sqrt(d01 / 2)));
        window.at<cv::Vec3b>(y + 1, x)[1] =
            fmin(255, window.at<cv::Vec3b>(y + 1, x)[1] + 255.0 * (1 - sqrt(d10 / 2)));
        window.at<cv::Vec3b>(y + 1, x + 1)[1] =
            fmin(255, window.at<cv::Vec3b>(y + 1, x + 1)[1] + 255.0 * 1 - sqrt(d11 / 2));
    }
}
```

:::
````
