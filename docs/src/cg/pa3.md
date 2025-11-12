# 着色

物体颜色来源于光，定义光照模型就定义了物体颜色的表现。着色就是给物体应用材质。
本科好像在学冯氏光照前还学了个啥不记得了，不过不关键，学界的光照模型只是让我们知道 shader 里面能改点啥，为以后写 shader 奠定基础。（101 居然不把 shader 分出来一个文件然后写成真 shader 的样子，不如哥们本科好吧，张师兄牛，不愧能入职太极）

## 简单冯氏光照模型

![](/shadingpoint.png)
最简单而且有一定竞争力的是冯氏光照模型，想法很自然，物体的“光”就是光源发射的光经物体反射后进入相机/人眼的光。物体无限微分后视作一个平面，简单应用光的反射定律即可。但这样做简单归简单，会造成一个后果就是没有阴影，很失真。
重要参数：

- 入射光法向量$l$
- 单位平面法向量$n$
- 观察方向向量$v$
- 物体材质参数，例如漫反射系数、偏折系数之类的。

接下来介绍简单冯氏光照模型中，物体材质影响的三种光。

### 漫反射

简单冯氏光照模型假设漫反射是均匀的，相机能收到多少漫反射光取决于物体表面的漫反射光强。漫反射光强显然和距离相关，假设光源到物体的距离为$r$，光源单位半径上的光强为$I$,则物体处光强为$\frac{I}{r^2}$。显然也和入射光角度相关，由点乘性质易求$\cos \theta = n \cdot l$相关系数是多少是经验设置，通常合并入漫反射系数$k_d$中，这个系数也合并了表面的漫反射光强吸收系数。最终，漫反射光对光照的影响为：
$$L_d = k_d\frac{I}{r^2}\max(n \cdot l, 0)$$
这里的$\max(n \cdot l, 0)$是为了过滤掉从表明另一侧来的光。

$k_d$增大的效果如图：
![](/diffuseresult.png)

### 镜面反射

镜面反射是相对纯粹的，能看到多少光基本取决于反射光方向与观测方向有多接近，这里用两向量角度$\cos \theta = v \cdot r$多少来衡量远近。我本科的时候并没有求什么半程向量来代替反射向量，单纯就是用入射光向量与法向量的关系算出反射向量然后求角度，101 是用半程向量，想了想也只是差个常数，被反射系数$k_s$和指数$p$吸收掉了，这里就使用 101 的公式吧。
$$h = \frac{v + l}{|v + l|}$$
$$L_s = k_s\frac{I}{r^2}\max(n \cdot h, 0)^p$$
这里的$p$是为了模拟真实加入的衰减系数，凭审美设置（图形学的领域不是工业仿真软件的子集，为了表现是可以牺牲真实性的，记住这一点！）。
超参数影响如下所示：
![](/cosinePower.png)
![](/specularresult.png)

### 环境光

环境光代表的是非光源的光对物体的影响，简单冯氏光照的简单就来源于此，和中学阶段的滑动摩擦力一样，仅仅用一个环境光系数$k_a$和全局环境光强$I_a$就决定了这一项。
$$L_a=k_aI_a$$

### 汇总

最后的物体得到的光就是三者之和：

$$
    \begin{align}
    L &= L_d + L_s + L_a\\
     &= k_d\frac{I}{r^2}\max(n \cdot l, 0) + k_s\frac{I}{r^2}\max(n \cdot h, 0)^p + k_aI_a
    \end{align}
$$

![](/blinnphongresult.png)

## 着色频率

现在好了，我们知道打光的光长什么样了，那具体到每一个点，它们应当被怎么打光呢？或者说每个点该被如何着色？每个点在光照模型中法向量的决定了该点着色与其他点的不同。对了，记得归一化。
有三个策略：

- 平直着色，每个三角形的点共享三角面片的法向量(任意两边叉乘除以模长)，然后整个三角面片一起着色，这样做面数少时不好看。（法向和着色都一样）
- Gouraud 着色，对于三角面片的每个顶点，取所有共享这一顶点的三角面片的法向量按面积做加权平均得到顶点法向量，对顶点着色，面片内部的点的着色由插值得到，这样做显然会受到权重分布不均匀的影响。（只求顶点法向，只对顶点着色，内部点着色插值得到）
  $$n_v = \frac{\sum_{i=1}^{n}S_in_i}{\sum_{i=1}^{n}S_i}$$
- 冯氏着色，顶点法向就是面片法向，内部的点的法向由顶点法向插值得到，然后对三角面片上的每个点着色。（所有的点的法向都求，所有点都着色）

至于上文中提到的插值法，在下面会讲，本科进的实验室就是搞各种花样的插值的，然而并没有学到什么。

各个策略效果如下，可以看到面数上去了大家效果都差不多，力大砖飞才是王道，硬件进步才是真进步！！！
![](/shadingFreq.png)

## 图形管线

老八股了，很奇怪，101 居然把这个放在这里讲，这不应该是图形学第一张图吗？
![](/gpipe.png)

- 处理顶点数据，模型->世界->相机->屏幕
- 处理边数据，同上流程
- 光栅化，定位最小处理单位，片元
- 着色，根据不同策略对每一个偏远着色
- 展示至屏幕内

注意几个关键，我们选择三维空间中做好变换再在二维空间中连边，这样在面数上去了少算很多，并且内存也有优化。整个图形管线在图形处理单元中已经定义好，不用我们自己去写，我们需要写的根据 openGL 只需要绑定顶点数据、边数据、纹理数据，着色什么的用 GLSL 写 shader。

## 纹理映射

我们之前展示简单冯氏光照的时候假设物体都是均质的，然而不太可能，描述不均质物体上每个片元性质的就是纹理。纹理数据定义了每个片元被打光后会有什么反映的数据。然而，图形学只关心能又好又快地把这个数据显示出来，贴图是否符合审美，正确显示后的贴图是不是有点歪(就是说你在模型空间中都是歪的，就不要苛求最后在屏幕空间中不歪了)，则不是这门学科关心的事情。

纹理映射（texture mapping）就是把一张 2 维的图像贴（映射）到一个三维物体表面。三维物体上每个三角形顶点对应二维纹理的一个坐标$(u,v)$。
![](/tmapping.png)

## 插值

对于没有数据的片元，我们照样需要给它们着色，着色的依据就是插值，就是某个片元受三角面片顶点影响程度的大小之和，101 介绍的是用三角形重心坐标插值。
![](/tbc.png)
对于三角形 ABC 所在平面任意一点$(x,y)$,都可以表示为
$$(x,y)=\alpha A_{x,y} + \beta B_{x,y} + \gamma C_{x,y}, \alpha+\beta+\gamma = 1$$

证明：
取平面上一点$P$,连接$CP$延长交$AB$于$Q$,则：

$$
  \begin{align}
    Q_{x,y} &= aA_{x,y}+(1-a)B_{x,y}\\
    P_{x,y} &= bC_{x,y}+(1-b)Q_{x,y}\\
            &= bC_{x,y}+(1-b)(aA_{x,y}+(1-a)B_{x,y})\\
            &= a(1-b)A_{x,y} +(1-a)(1-b)B_{x,y}+ bC_{x,y}
  \end{align}
$$

令 $\alpha = a(1-b), \beta = (1-a)(1-b), \gamma = b$即可。这样就有$(x,y) \to (\alpha, \beta, \gamma)$。注意当且仅当点在三角形内部时$\alpha, \beta, \gamma$都非负。

那么证明过程也给出了计算公式：

$$
\begin{align}
    \alpha &= \frac{-(x -x_B)(y_C-y_B)+(y-y_B)(x_C-x_B)}{-(x_A -x_B)(y_C-y_B)+(y_A-y_B)(x_C-x_B)}\\
    \beta &= \frac{-(x -x_C)(y_A-y_C)+(y-y_C)(x_A-x_C)}{-(x_B -x_C)(y_A-y_C)+(y_B-y_X)(x_A-x_C)}\\
     \gamma       &= 1 - \alpha - \beta

  \end{align}
$$

是不是觉得这样实现起来很复杂，是的，当年我这么实现的时候很复杂，101 给出了基于面积的求法，用叉乘叉一下就好了，还是很方便的。
![](/bc.png)

最后，这三个系数代表了三角形内某点受顶点影响的权重，所以凡是与顶点相同的属性都可以用这三个系数进行插值，不局限于法向、颜色、光照之类的。
$$V= \alpha V_A + \beta V_B + \gamma V_C$$

如果喜欢做透视矫正，那么这个插值可以改写成:。

$$
  \begin{align}
    Weight &= \frac{1}{\frac{\alpha}{Z_A}+\frac{\beta}{Z_B}+\frac{\gamma}{Z_C}}\\
    V &= Weight *(\frac{\alpha}{Z_A} V_A + \frac{\beta}{Z_B} V_B + \frac{\gamma}{Z_C} V_C )
  \end{align}
$$

其中$Z_A,Z_B,Z_C$是三点深度值。

所以，对于纹理$uv$来说：
$$uv= \alpha uv_A + \beta uv_B + \gamma uv_C$$

## 纹理不匹配的处理

在现实中，不可能做到每个点都有纹理数据，甚至连每个顶点都有纹理数据都不能保证，此外，现代还有对图像放大缩小的需求，因此纹理应用到物体上就会出现：

- 纹理放大，当纹理图片分辨率过低，就会出现多个像素点对应一个$(u,v)$坐标。
- 纹理缩小，当纹理图片分辨率过高，就会出现一个像素点对应多个$(u,v)$坐标。

![](/txmp.png)
这就需要我们对这个问题做出相应地处理。

### 纹理放大

一个较小的纹理图片被放大时，可以像 MSAA 那样视作一个像素格子中多了很多像素点，如下图所示，黑点是原来的纹理图片的像素点，红点是放大以后的其中一个像素点在原图中的映射位置，可以想象为在原来的纹理图片的一个像素格子中还有很多这样的红点，在放大的图中红点及其格子和黑点及其格子等大，这里只取一个举例。下面我们将黑点代表的东西称为 texel。
![](/texelsample.png)

红点的取值该怎么取呢？最朴素的想法就是和最近的黑点值相同，这被称为就近法(nearest),好处是简单快捷，坏处是很多红点值都相同，会显得一块一块的，如下图所示：
![](/nearest.png)
因此业界还提出了中间的双线性插值以及右侧的双立方插值法。

双线性插值法很简单，取离红点最近的四个黑点值，先取横着的平行线水平插值，再将插出来的两个点垂直插值(先垂直再水平也可以，反正都一样)。
![](/bilinear.png)
双立方插值取的是十六个点，方法和双线性插值一样。

由于双线性插值的结果足够好，并且比双立方插值法的时空开销都小，所以这是大多数图形软件的默认插值方式。

### 纹理缩小

纹理缩小了，一个像素就会采样多个纹理值，采样和信号失配，这就出现了走样。
这是空间采样，因而会有摩尔纹。
![](/texelbig.png)
当然，我们可以用之前提到的反走样技术中的超采样技术(SSAA/MSAA)来解决，但是这样做时空开销太大。

本课程这里介绍了 Mipmap(Multum in parvo map)方法。原理很简单，对于一个纹理图，不断将其分辨率缩放一半，每缩放一次，将结果作为更高的 level。$D$层对应大小为$2^D$的纹理区域。之后只需要求出采样的纹理面积/边长，在相应 level 的纹理图中根据$uv$取值就行。额外存储其实只有原图的三分之一，不占多少空间。
![](/mipmap.png)
问题在于我们怎么知道$D$是多少？下面的公式中给出了答案，然而这个求$L$的方法还是不够具体，下面给出一种求$L$的近似方法。对于屏幕上的一个像素点$P$，我们可以找其相邻的四个像素点，将这五个点分别在纹理空间中找到对应的纹理坐标，然后求中心点$P_{tex}$到另外四个点距离的最大值$L$，就可以近似认为该像素点所采样的纹理区域是一个边长为$L$的正方形。说明该像素点对应的纹理值要去$log_2L$层取。
![](/computemipmap.png)
问题在于$log_2L$有极大概率不是整数，我们没能构造非整数维空间的贴图(想想也不算是不行)，所以得进一步处理，如果四舍五入就会遇到和就近法相同的问题，还得是插值。取 $D=floor(log_2L)$ 层和 $D+1$层的双线性插值结果再进行插值即可。这被称为三线性插值。
![](/trilinear.png)

但是由于这是在正方形范围内进行查找，屏幕像素对应材质的长方形甚至斜长的区域，在做 mipmap 时，自然会取过大的正方形，从而导致过模糊的情况。
![](/irregular.png)
解决方法有用矩形进行近似的各向异性过滤以及将不规则形状拆分为若干圆形，每次查询其中一个圆，分多次查询来近似的 EWA filtering。前者没有根本解决问题，后者有开销问题。

## 纹理的妙用

大家想想一张平面上的画/照片是怎么表现出真实场景的，仅是纹理也可以做到，纹理很神奇吧。

### 环境光

我们可以用纹理来描述环境光，再去渲染物体，这样就代替了点光源。此时我们可以假设环境光都是来自无穷远处，光强和距离无关，只记录方向信息，也就是说只要方向相同，环境光强就是一致的。
![](/cup.png)

### 凹凸贴图

可以记录物体表面相对高度，从而影响物体表面法线，进而影响阴影，给人凹凸感觉。不过物体表面实际上还是光滑的，凹凸只是纹理带来的错觉。这个东西就是法线贴图，进而可能需要切线空间去更好描述。(我就说嘛，本科图形学和 101 都没有谁说过切线空间这东西，然而居然有公司考这个，令人感叹)
![](/orange.png)
算切线是算贴图空间中$u$方向上两个相邻像素高度差和$v$方向上两个相邻像素高度差各乘上一个系数来代替两向量在这两个方向上的偏导，然后这两个向量叉乘就是法向。大概是

$$
  \begin{align}
    \frac{\partial p}{\partial u} &= c_1 * (h(p_u + 1) - h(p))\\
    \frac{\partial p}{\partial v} &= c_2 * (h(p_v + 1) - h(p))\\
    n &=(-\frac{\partial p}{\partial u},-\frac{\partial p}{\partial v},1).norm()
  \end{align}
$$

### 位移贴图

真的移动了顶点。有两种实现，一是模型面片数很高，高到顶点数大于纹理数，直接实现，二是面片数不足时再细分面片。
![](/displacementmap.png)

### 三维纹理

没有直接给数据，而是给出一系列噪声函数，通过函数算出具体数据。

### 预计算着色

在纹理中直接记录着色，不用再算。

### 体渲染

本科图形学组都是搞这个的，搞真实化展示 CT 图片的，也算颇有成果。

## 作业

### 核心代码

这次作业让我对 101 完全祛魅（本身也是为了面试官无理的要求）。

框架作业如果没有连贯性或者说和课程有差异的话就不要说复用前面作业的东西了。

不知道框架作者用的什么编译器那么厉害，能自动修正非法输入，反正我被超出图片坐标范围的 u，v 值搞懵了。

还有 eigen 的神秘 bug，拆开来写是对的，分开写是不对的。还得是 QT 牛！！！
花在寻找框架问题的时间远大于正确实现的时间，还能说什么呢？估计大家也回过味了，课程 lab 本身太玩具了，真做点可用的东西才是正道，但是没办法，得有证明嘛~我怎么知道我都回答得上来是八股背得熟还是真懂呢？
::: details
做了透视修正，不过差别不大。

```c++
void rst::rasterizer::rasterize_triangle(const Triangle &t, const std::array<Eigen::Vector3f, 3> &view_pos)
{
    // TODO: From your HW3, get the triangle rasterization code.
    auto v = t.toVector4();
    int min_x = std::floor(std::min({v[0][0], v[1][0], v[2][0]}));
    int max_x = std::ceil(std::max({v[0][0], v[1][0], v[2][0]}));
    int min_y = std::floor(std::min({v[0][1], v[1][1], v[2][1]}));
    int max_y = std::ceil(std::max({v[0][1], v[1][1], v[2][1]}));

    for (int x = min_x; x <= max_x; ++x)
    {
        for (int y = min_y; y <= max_y; ++y)
        {
            float cx = x + 0.5f;
            float cy = y + 0.5f;
            if (!insideTriangle(cx, cy, t.v))
                continue;
            // TODO: Inside your rasterization loop:
            //    * v[i].w() is the vertex view space depth value z.
            //    * Z is interpolated view space depth for the current pixel
            //    * zp is depth between zNear and zFar, used for z-buffer

            // float Z = 1.0 / (alpha / v[0].w() + beta / v[1].w() + gamma / v[2].w());
            // float zp = alpha * v[0].z() / v[0].w() + beta * v[1].z() / v[1].w() + gamma * v[2].z() / v[2].w();
            // zp *= Z;
            auto [alpha, beta, gamma] = computeBarycentric2D(x, y, t.v);
            float Z = 1.0 / (alpha / v[0].w() + beta / v[1].w() + gamma / v[2].w());
            float zp = alpha * v[0].z() / v[0].w() + beta * v[1].z() / v[1].w() + gamma * v[2].z() / v[2].w();
            zp *= Z;
            float a = alpha / v[0].w(), b = beta / v[1].w(), c = gamma / v[2].w();
            int idx = get_index(x, y);
            if (depth_buf[idx] != std::numeric_limits<float>::infinity() && zp >= depth_buf[idx])
                continue;

            depth_buf[idx] = zp;
            // 我们也对下列属性做做透视矫正

            // TODO: Interpolate the attributes:
            // auto interpolated_color
            // auto interpolated_normal
            // auto interpolated_texcoords
            // auto interpolated_shadingcoords
            auto interpolated_color = interpolate(a, b, c, t.color[0], t.color[1], t.color[2], Z);
            auto interpolated_normal = interpolate(a, b, c, t.normal[0], t.normal[1], t.normal[2], Z);
            auto interpolated_texcoords = interpolate(a, b, c, t.tex_coords[0], t.tex_coords[1], t.tex_coords[2], Z);
            auto interpolated_shadingcoords = interpolate(a, b, c, view_pos[0], view_pos[1], view_pos[2], Z);
            // auto interpolated_color = interpolate(alpha, beta, gamma, t.color[0], t.color[1], t.color[2], 1);
            // auto interpolated_normal = interpolate(alpha, beta, gamma, t.normal[0], t.normal[1], t.normal[2], 1);
            // auto interpolated_texcoords = interpolate(alpha, beta, gamma, t.tex_coords[0], t.tex_coords[1], t.tex_coords[2], 1);
            // auto interpolated_shadingcoords = interpolate(alpha, beta, gamma, view_pos[0], view_pos[1], view_pos[2], 1);

            // Use: fragment_shader_payload payload( interpolated_color, interpolated_normal.normalized(), interpolated_texcoords, texture ? &*texture : nullptr);
            // Use: payload.view_pos = interpolated_shadingcoords;
            // Use: Instead of passing the triangle's color directly to the frame buffer, pass the color to the shaders first to get the final color;
            // Use: auto pixel_color = fragment_shader(payload);
            fragment_shader_payload payload(interpolated_color, interpolated_normal.normalized(), interpolated_texcoords, texture ? &*texture : nullptr);
            payload.view_pos = interpolated_shadingcoords;
            auto pixel_color = fragment_shader(payload);
            set_pixel({x, y}, pixel_color);
        }
    }
}
```

这里不知道 eigen 什么毛病，要这样实现才对。

```c++
Eigen::Vector3f phong_fragment_shader(const fragment_shader_payload &payload)
{
    Eigen::Vector3f ka = Eigen::Vector3f(0.005, 0.005, 0.005);
    Eigen::Vector3f kd = payload.color;
    Eigen::Vector3f ks = Eigen::Vector3f(0.7937, 0.7937, 0.7937);

    auto l1 = light{ {20, 20, 20}, {500, 500, 500}};
    auto l2 = light{ {-20, 20, 0}, {500, 500, 500}};

    std::vector<light> lights = {l1, l2};
    Eigen::Vector3f amb_light_intensity{10, 10, 10};
    Eigen::Vector3f eye_pos{0, 0, 10};

    float p = 150;

    Eigen::Vector3f color = payload.color;
    Eigen::Vector3f point = payload.view_pos;
    Eigen::Vector3f normal = payload.normal;
    // auto n = normal.normalized();
    Eigen::Vector3f result_color = {0, 0, 0};
    for (auto &light : lights)
    {
        // TODO: For each light source in the code, calculate what the *ambient*, *diffuse*, and *specular*
        // components are. Then, accumulate that result on the *result_color* object.
        auto l = (light.position - point);
        auto v = (eye_pos - point);
        auto nl = l.normalized();
        auto nv = v.normalized();
        auto h = (nl + nv).normalized();
        float rr = (l).dot(l);
        result_color += ka.cwiseProduct(amb_light_intensity);
        result_color += kd.cwiseProduct(light.intensity) / rr * std::max(0.0f, nl.dot(normal.normalized()));
        result_color += ks.cwiseProduct(light.intensity) / rr * std::pow(std::max(0.0f, normal.normalized().dot(h)), p);
    }

    return result_color * 255.f;
}
```

最让我生气的一个地方，我怎么知道你提供的 getcolor 有问题？

```c++
Eigen::Vector3f texture_fragment_shader(const fragment_shader_payload &payload)
{
    Eigen::Vector3f return_color = {0, 0, 0};
    if (payload.texture)
    {
        float u = payload.tex_coords.x();
        float v = payload.tex_coords.y();
        return_color = payload.texture->getColor(u, v);
    }
    Eigen::Vector3f texture_color;
    texture_color << return_color.x(), return_color.y(), return_color.z();

    Eigen::Vector3f ka = Eigen::Vector3f(0.005, 0.005, 0.005);
    Eigen::Vector3f kd = texture_color / 255.f;
    Eigen::Vector3f ks = Eigen::Vector3f(0.7937, 0.7937, 0.7937);

    auto l1 = light{{20, 20, 20}, {500, 500, 500}};
    auto l2 = light{{-20, 20, 0}, {500, 500, 500}};

    std::vector<light> lights = {l1, l2};
    Eigen::Vector3f amb_light_intensity{10, 10, 10};
    Eigen::Vector3f eye_pos{0, 0, 10};

    float p = 150;

    Eigen::Vector3f color = texture_color;
    Eigen::Vector3f point = payload.view_pos;
    Eigen::Vector3f normal = payload.normal;

    Eigen::Vector3f result_color = {0, 0, 0};
    auto n = normal.normalized();
    for (auto &light : lights)
    {
        // TODO: For each light source in the code, calculate what the *ambient*, *diffuse*, and *specular*
        // components are. Then, accumulate that result on the *result_color* object.
        auto l = (light.position - point);
        auto v = (eye_pos - point);
        auto nl = l.normalized();
        auto nv = v.normalized();
        auto h = (nl + nv).normalized();
        float rr = (l).dot(l);
        result_color += ka.cwiseProduct(amb_light_intensity);
        result_color += kd.cwiseProduct(light.intensity) / rr * std::max(0.0f, nl.dot(normal.normalized()));
        result_color += ks.cwiseProduct(light.intensity) / rr * std::pow(std::max(0.0f, normal.normalized().dot(h)), p);
    }

    return result_color * 255.f;
}
```

按照注释实现即可，注意到函数$h(x)=getcolor(x).norm()$，而不是真有一个高度表。

```c++
Eigen::Vector3f displacement_fragment_shader(const fragment_shader_payload &payload)
{

    Eigen::Vector3f ka = Eigen::Vector3f(0.005, 0.005, 0.005);
    Eigen::Vector3f kd = payload.color;
    Eigen::Vector3f ks = Eigen::Vector3f(0.7937, 0.7937, 0.7937);

    auto l1 = light{{20, 20, 20}, {500, 500, 500}};
    auto l2 = light{{-20, 20, 0}, {500, 500, 500}};

    std::vector<light> lights = {l1, l2};
    Eigen::Vector3f amb_light_intensity{10, 10, 10};
    Eigen::Vector3f eye_pos{0, 0, 10};

    float p = 150;

    Eigen::Vector3f color = payload.color;
    Eigen::Vector3f point = payload.view_pos;
    Eigen::Vector3f normal = payload.normal;

    float kh = 0.2, kn = 0.1;

    // TODO: Implement displacement mapping here
    // Let n = normal = (x, y, z)
    // Vector t = (x*y/sqrt(x*x+z*z),sqrt(x*x+z*z),z*y/sqrt(x*x+z*z))
    // Vector b = n cross product t
    // Matrix TBN = [t b n]
    // dU = kh * kn * (h(u+1/w,v)-h(u,v))
    // dV = kh * kn * (h(u,v+1/h)-h(u,v))
    // Vector ln = (-dU, -dV, 1)
    // Position p = p + kn * n * h(u,v)
    // Normal n = normalize(TBN * ln)
    float x = normal.x(), y = normal.y(), z = normal.z();
    float nf = std::sqrt(x * x + z * z);
    Eigen::Vector3f t = {x * y / nf, nf, z * y / nf};
    Eigen::Vector3f b = normal.cross(t);
    Matrix3f TBN;
    TBN << t, b, normal;
    float u = payload.tex_coords.x();
    float v = payload.tex_coords.y();
    float w = payload.texture->width;
    float h = payload.texture->height;

    float dU = kh * kn * (payload.texture->getColor(u + 1.0f / w, v).norm() - payload.texture->getColor(u, v).norm());
    float dV = kh * kn * (payload.texture->getColor(u, v + 1.0f / h).norm() - payload.texture->getColor(u, v).norm());

    Eigen::Vector3f ln = {-dU, -dV, 1.0f};
    normal = (TBN * ln).normalized();
    point += kn * normal * payload.texture->getColor(u, v).norm();
    Eigen::Vector3f result_color = {0, 0, 0};

    for (auto &light : lights)
    {
        // TODO: For each light source in the code, calculate what the *ambient*, *diffuse*, and *specular*
        // components are. Then, accumulate that result on the *result_color* object.
        auto l = (light.position - point);
        auto v = (eye_pos - point);
        auto nl = l.normalized();
        auto nv = v.normalized();
        auto h = (nl + nv).normalized();
        float rr = (l).dot(l);
        result_color += ka.cwiseProduct(amb_light_intensity);
        result_color += kd.cwiseProduct(light.intensity) / rr * std::max(0.0f, nl.dot(normal.normalized()));
        result_color += ks.cwiseProduct(light.intensity) / rr * std::pow(std::max(0.0f, normal.normalized().dot(h)), p);
    }

    return result_color * 255.f;
}

Eigen::Vector3f bump_fragment_shader(const fragment_shader_payload &payload)
{

    Eigen::Vector3f ka = Eigen::Vector3f(0.005, 0.005, 0.005);
    Eigen::Vector3f kd = payload.color;
    Eigen::Vector3f ks = Eigen::Vector3f(0.7937, 0.7937, 0.7937);

    auto l1 = light{{20, 20, 20}, {500, 500, 500}};
    auto l2 = light{{-20, 20, 0}, {500, 500, 500}};

    std::vector<light> lights = {l1, l2};
    Eigen::Vector3f amb_light_intensity{10, 10, 10};
    Eigen::Vector3f eye_pos{0, 0, 10};

    float p = 150;

    Eigen::Vector3f color = payload.color;
    Eigen::Vector3f point = payload.view_pos;
    Eigen::Vector3f normal = payload.normal;

    float kh = 0.2, kn = 0.1;

    // TODO: Implement bump mapping here
    // Let n = normal = (x, y, z)
    // Vector t = (x*y/sqrt(x*x+z*z),sqrt(x*x+z*z),z*y/sqrt(x*x+z*z))
    // Vector b = n cross product t
    // Matrix TBN = [t b n]
    // dU = kh * kn * (h(u+1/w,v)-h(u,v))
    // dV = kh * kn * (h(u,v+1/h)-h(u,v))
    // Vector ln = (-dU, -dV, 1)
    // Normal n = normalize(TBN * ln)
    float x = normal.x(), y = normal.y(), z = normal.z();
    float nf = std::sqrt(x * x + z * z);
    Eigen::Vector3f t = {x * y / nf, nf, z * y / nf};
    Eigen::Vector3f b = normal.cross(t);
    Matrix3f TBN;
    TBN << t, b, normal;
    float u = payload.tex_coords.x();
    float v = payload.tex_coords.y();
    float w = payload.texture->width;
    float h = payload.texture->height;

    float dU = kh * kn * (payload.texture->getColor(u + 1.0f / w, v).norm() - payload.texture->getColor(u, v).norm());
    float dV = kh * kn * (payload.texture->getColor(u, v + 1.0f / h).norm() - payload.texture->getColor(u, v).norm());

    Eigen::Vector3f ln = {-dU, -dV, 1.0f};
    normal = (TBN * ln).normalized();

    Eigen::Vector3f result_color = {0, 0, 0};
    result_color = normal;

    return result_color * 255.f;
}
```

双线性插值也是翻译即可。

```c++
Eigen::Vector3f getColorBilinear(float u, float v)
{
      if (u < 0)
          u = 0;
      if (u > 1)
          u = 1;
      if (v < 0)
          v = 0;
      if (v > 1)
          v = 1;
      auto u_img = u * width;
      auto v_img = (1 - v) * height;

      float s = u_img - (int)u_img + 0.5;
      float t = v_img - (int)v_img + 0.5;

      if (s > 1)
      {
          s = s - 1;
      }
      else
      {
          u_img = u_img - 1;
      }
      if (t > 1)
      {
          t = t - 1;
      }
      else
      {
          v_img = v_img - 1;
      }

      auto u00 = image_data.at<cv::Vec3b>(v_img, u_img);
      auto u10 = image_data.at<cv::Vec3b>(v_img, u_img + 1);
      auto u01 = image_data.at<cv::Vec3b>(v_img + 1, u_img);
      auto u11 = image_data.at<cv::Vec3b>(v_img + 1, u_img + 1);

      auto u0 = u00 + s * (u10 - u00);
      auto u1 = u01 + t * (u11 - u01);

      auto color = u0 + t * (u1 - u0);
      return Eigen::Vector3f(color[0], color[1], color[2]);
}
```

### 效果图

| ![](/output1.png) | ![](/output2.png) | ![](/output3.png) | ![](/output4.png) | ![](/output5.png) |
| ----------------- | ----------------- | ----------------- | ----------------- | ----------------- |

:::
