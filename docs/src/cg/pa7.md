# 路径追踪

为了更细致地处理光照问题，主要解决反射不全是镜面反射以及处理漫反射后的光的问题。
如果在旧有框架下无法解决，那么就要引入新定义。

## 辐射度量学

光在物体表面的表现可以由光强大小表现出来，在前面的作业中，这个光强是给定的，为了能对其进行更细致的处理，在下文中将使用辐射度量学对光照进行描述。

### 定义

- 辐射能量：$Q$,单位$J$/焦耳。
- 辐射通量：$\Phi = \frac{\mathbf{d}Q}{\mathbf{d}t}$，单位时间内通过的辐射能量，也是传统理解上的功率。单位瓦特($W$
  )/流明($lm$)。也可定义为单位时间内通过某一平面的光子数量/光源的亮度。
  ![](/da.png)
- 辐射强度：$I(w) = \frac{\mathbf{d}\Phi}{\mathbf{d}w}$。单位立体角的辐射通量，单位立体角是半径为 1 的单位圆球上，1 平方单位的球冠所对应的球锥所代表的角度，其对应中截面的圆心角约 65°。假设光线从点光源处均匀辐射，在单位球上的辐射强度$I = \frac{\Phi}{4 \pi}$.

- 辐射照度：$E(x) = \frac{\mathbf{d}\Phi}{\mathbf{d}A}$。单位表面的辐射通量。
  我们发现对于一个点光源而言，随着半径的增大，辐射强度其实是不会发生变化的，因为立体角是不变的。但是对于任意半径的球面而言，它们的辐射能量也是不变的，其实是辐射照度发生了衰减。
  ![](/irradiancefalloff.png)
- 辐射亮度:$L(p,w) = \frac{\mathbf{d^2}\Phi(p,w)}{\mathbf{d}w\mathbf{d}A\cos \theta}$,单位立体角和垂直此方向的单位表面的辐射通量,既可以认为是投射到单位面积上的辐射强度，也可以认为是某个点从单位立体角上接收到的辐射照度。
  ![](/radiance.png)

### 双向反射分布函数

这里要做的事情就是把反射这个粒子运动学行为转换成能量辐射变化以及分布。BRDF 定义了辐射照度从某个单位立体角方向入射到单位面积上后，以怎样的结果向反射的立体角方向进行反射。
![](/brdf.png)

在上球面$H^2$上对立体角做积分，即得到反射方程，其中$P$是着色点也是光线的入射点：
![](/rq.png)
再考虑物体本身也会发光，加上后就得到了渲染方程：
![](/rrq.png)
下面是将该方程用泰勒展开离散化后的结果(哥们本科毕设是对某运动 ODE 方程展开)，可以从另一个角度理解反射的光的成分有自发光、一次反射、二次反射等等。
![](/yorq1.png)
![](/yorq2.png)

## 蒙特卡洛积分

观察上面的方程，用离散的数学求连续的积分是计算机永恒的问题，泰勒展开成显式/隐式方程是一个思路，这需要数值计算的知识，在这里，我们采用另一个思路，蒙特卡洛积分法。

回忆学的本科积分的不严谨定义，就是把曲线下图案细分成无穷多个小矩形然后求和，计算机说我没能力分成无穷，必须是有限的，并且我能力有限，还不能全算，因此就要按照一定概率选择(采样)某些矩形求和来代替全求和，这就是蒙特卡洛积分。也就是说，对于积分域 $[a,b]$，我们认为变量$x$在区间内满足一定概率分布 $X_i\sim p(x)$，我们只要不断地进行随机采样，求得采样值对应的函数值（可以认为是一个矩形面积值），那么定积分的结果可以认为是这些函数值的平均。即：

<!-- prettier-ignore -->
$$ \int f(x)\mathbf{d}x = \frac{1}{N} \sum_{i+1}^{N} \frac{f(X_i)}{p(X_i)},X_i\sim p(x)$$

在下文中，此时可以认为光线在所有方向上都是等概率的，即入射方向/立体角满足均匀分布（半球的立体角为$2 \pi$）,则我们采用的概率密度函数$p(x)$是均匀分布的概率密度函数$p(x) =  \frac{1}{2\pi}$。
那么，再额外考虑某一束入射光是来自光源还是其它物体表面$q$的反射光，物体一点处的反射方程即可写为：

$$
L_r(p,w_r)\approx
\begin{cases}
  \frac{1}{N} \sum_{i+1}^{N}\frac{f_r(p,w_i \to w_r)L_i(p,w_i)\cos \theta_i}{p(w_i)} & 光源来光\\
  \frac{1}{N} \sum_{i+1}^{N}\frac{f_r(p,w_i \to w_r)L_i(q,-w_i)\cos \theta_i}{p(w_i)} & 其他物体反射的光
\end{cases}
$$

伪码描述：
![](/globalillumination.png)

## 迈向路径追踪

### 指数爆炸

当一个着色点反射$N$条光线时，进行递归计算后，时间复杂度高达$O(a^N)$
![](/ptp1.png)
我们可以将反射的光线数目设为 1,这就是我们所说的路径追踪，于是 shade 函数变为
![](/ptp2.png)
但是这样噪声很大，于是我们在每个像素处打入多条光线来解决这个问题。
![](/paths.png)
我们可以在像素内均匀地取若干个不同的点，对于每个点，发射一条光线到场景中，如果与物体产生交点，那就计算相应的着色。
![](/rg.png)

### 无穷递归

由于没设定能量损失和光强阈值，所以反射是会无限递归下去的，这显然不能接受，所以需要处理方式，这里采用了简单的 P 采样算法，以 P 的概率继续反射，1-P 的概率不再反射，此时我们收集到的 shade() 结果需要除以 P，使得期望不变。
![](/shaderr.png)

到这里，一个正确的路径追踪算法实现了，但效率不高。要求有高采样率，即一个像素要发出很多条光线进行采样。我们希望通过低采样率也能获得高采样率的效果。
![](/spp.png)

### 换积分域

这里的做法就是将物体表面接收到的辐射亮度分解为两部分：来自光源和来自其他反射物体。

- 对于来自光源的部分，直接在光源上进行采样即可，采样过程就是换积分域的过程。

- 对于来自其他反射的光源，仍然按照 P 采样算法求解。

![](/trans.png)
伪代码为：
![](/finalcode.png)
注意辐射亮度还不是颜色，还需要$\gamma$校正。

## 材质

一句话图形学中，材质就是 BRDF

### 漫反射材质

会向着色点表面半球的各个方向进行均匀反射。
![](/dm.png)
现在假设一个漫反射材质着色点接收到均匀的光（$L_i(w_i)$为常数），并向各个方向均匀反射（$f_r(w_i,w_o)$为常数）。则由渲染方程有：
$$L_o(w_o) = \int_{H^2}f_rL_i\cos\theta_i\mathbf{d}w_i=\pi f_rL_i$$
由能量守恒$L_o=L_i$得到：
$$f_r = \frac{\rho}{\pi}$$

这里的$\rho$就是传说中的 albedo 反照率，定义为辐射亮度($L_o$)和辐射照度($L_i$)之比，值属于[0,1]，暗含了颜色。

### Glossy 材质

这种材质只会向一个方向反射。
![](/glossy.png)

### 理想反射材质

考虑反射和折射的材质。
![](/irm.png)

### 菲涅尔项

菲涅尔公式解释反射光的强度、折射光的强度、相位与入射光的角度的关系。菲涅尔效应指：视线垂直于表面时，反射较弱；而当视线非垂直表面时，夹角越小，反射越明显。譬如看脚底游泳池的水是透明的，但是远处的水面反射强烈。

#### 定性分析

![](/fcmp.png)

#### 定量分析

- 精确公式
  ![](/acf.png)
- 近似公式
  ![](/apf.png)

### 微表面

假设物体表面由不同法向量的微小平面组成。它引入了三个函数：D、G、F。
![](/MM.png)

- D：是法线分布函数，它解释了在观看者角度反射光的微平面的比例。法线分布函数描述了在这个表面周围的法线分布情况，当输入向量 h 时，如果微平面中有 35%与向量 h 取向一致，则法线分布函数就会返回 0.35。

- G：是几何衰减函数，它解释了微平面彼此之间的阴影和遮挡。

- F：是菲涅尔函数，它解释了菲涅耳效应，该效应使得与表面成较高的入射角的光线会以更高的镜面反射率进行反射。

可以根据物体微表面是否具有方向性将物体分类

- Isotropic(各项同性)：法线分布均匀

- Anisotropic(各项异性)：法线分布有明确的方向性

## BRDF 性质

- 非负
  $$f_r(w_i \to w_r) \ge 0$$
- 线性可加
  $$f_r(w_i \to w_r + w_r \to w_j) = f_r(w_i \to w_r) +f_r( w_r \to w_j)$$
- 可逆
  $$f_r(w_i \to w_r)=f_r(w_r \to w_i)$$
- 能量守恒
  $$\int_{H^2}f_rL_i\cos\theta_i\mathbf{d}w_i \le 1$$
- 各向同性/各向异性：如果满足各向同性，BRDF 可以从 4 维降低到 3 维。即
  $$f_r(\theta_i,\phi_i;\theta_r, \phi_r) = f_r(\theta_i,\theta_r,\phi_r-\phi_i)$$

## 作业

最有难度的一集。我承认，我实现的效果应该说不合格，查资料以后发现是浮点数精度问题，这我怎么排查啊？本科相当于只用实现逻辑，浮点数由 QT 安排好了，没想到浮点数出了这么大问题，不交流是做不到想要的效果的。
:::details
主要实现部分还是简单的，纯翻译即可。

光源是黑的是因为伪代码中没有处理发光物体的流程，补上就好。

还有就是噪点问题，这个看论坛上各种奇技淫巧规避浮点数精度问题，我就简单做做了。

本人自己还出现了**竖条纹**的黑线问题，排查了半天是与三角形求交的 getIntersection()没有处理除以 0 和三角坐标越界问题

```c++
Vector3f Scene::castRay(const Ray &ray, int depth) const
{
    // TO DO Implement Path Tracing Algorithm here
    Intersection isect = intersect(ray);
    if (!isect.happened)
        return Vector3f(0.0f, 0.0f, 0.0f);
    if (isect.m->hasEmission())
        return depth == 0 ? isect.m->getEmission() : Vector3f(0.0f, 0.0f, 0.0f);

    auto p = isect.coords;
    auto m = isect.m;
    auto N = isect.normal.normalized();
    auto wo = ray.direction;
    Vector3f L_dir{};
    Vector3f L_indir{};
    Intersection inter;
    float pdf_light{};
    sampleLight(inter, pdf_light);

    auto x = inter.coords;
    auto ws = normalize(x - p);
    auto NN = inter.normal.normalized();
    auto emit = inter.emit;
    auto d = (x - p).norm();
    auto d2 = intersect({p, ws}).distance;
    auto cosap = std::max(dotProduct(-ws, NN), 0.0f);
    if (d2 - d > -0.001 && pdf_light > EPSILON && cosap > EPSILON)
    {
        auto eval = m->eval(wo, ws, N);
        auto cosa = std::max(dotProduct(ws, N), 0.0f);

        L_dir = emit * eval * cosa * cosap / (d * d) / pdf_light;
    }

    auto P_RR = get_random_float();
    if (P_RR < RussianRoulette)
    {
        auto wi = m->sample(wo, N).normalized();
        Ray r(p, wi);
        Intersection isect2 = intersect(r);
        if (isect2.happened && !isect2.m->hasEmission())
        {
            auto eval = m->eval(wo, wi, N);
            auto pdf_0 = m->pdf(wo, wi, N);
            auto cosa = dotProduct(wi, N);
            L_indir = castRay(r, depth + 1) * eval * cosa / pdf_0 / RussianRoulette;
        }
    }
    auto res = L_dir + L_indir;
    res.x = (clamp(0, 1, res.x));
    res.y = (clamp(0, 1, res.y));
    res.z = (clamp(0, 1, res.z));
    return res;

}
```

不如说更难的地方反而是工程化的多线程

```c++
void Renderer::Render(const Scene &scene)
{
    std::vector<Vector3f> framebuffer(scene.width * scene.height);

    float scale = tan(deg2rad(scene.fov * 0.5));
    float imageAspectRatio = scene.width / (float)scene.height;
    Vector3f eye_pos(278, 273, -800);
    // int m = 0;

    // change the spp value to change sample ammount
    int spp = 128;
    std::cout << "SPP: " << spp << "\n";

    const int n_worker = 24;
    std::thread worker[n_worker];
    int block = scene.height / n_worker;
    auto task = [&](uint32_t b_row, u_int32_t t_row)
    {
        for (uint32_t j = b_row; j < t_row; ++j)
        {
            for (uint32_t i = 0; i < scene.width; ++i)
            {
                // generate primary ray direction
                float x = (2 * (i + 0.5) / (float)scene.width - 1) *
                          imageAspectRatio * scale;
                float y = (1 - 2 * (j + 0.5) / (float)scene.height) * scale;

                Vector3f dir = normalize(Vector3f(-x, y, 1));
                for (int k = 0; k < spp; k++)
                {
                    framebuffer[(int)(j * scene.width + i)] += scene.castRay(Ray(eye_pos, dir), 0) / spp;
                }
            }
            progress += 1;
            UpdateProgress(progress / (float)scene.height);
        }
    };
    for (int i = 0; i < n_worker; ++i)
        worker[i] = std::thread(task, i * block, (i + 1) * block);
    for (int i = 0; i < n_worker; ++i)
        worker[i].join();
       UpdateProgress(1.f);

    // save framebuffer to file
    FILE *fp = fopen("binary.ppm", "wb");
    (void)fprintf(fp, "P6\n%d %d\n255\n", scene.width, scene.height);
    for (auto i = 0; i < scene.height * scene.width; ++i)
    {
        static unsigned char color[3];
        color[0] = (unsigned char)(255 * std::pow(clamp(0, 1, framebuffer[i].x), 0.6f));
        color[1] = (unsigned char)(255 * std::pow(clamp(0, 1, framebuffer[i].y), 0.6f));
        color[2] = (unsigned char)(255 * std::pow(clamp(0, 1, framebuffer[i].z), 0.6f));
        fwrite(color, 1, 3, fp);
    }
    fclose(fp);
}
```

spp=512,24 线程，8 分钟跑完
![](/prr.png)

微表面，课上讲的东西完全不够我们实现，要像上节课学 SHA 一样找额外资料学。

这里我们最终的目标是取得微表面材质的漫反射项和镜面反射项:
$$f_r = k_df_d+k_sf_s$$
其中$k_d,k_s$是折射系数和反射系数，由菲涅尔函数决定，$f_d,f_s$是漫反射和镜面反射的 brdf。注意：这里的折射和漫反射不是笔误，而是在这个模型中，漫反射等于折射光射入物体后被物体内部的物质反射回来的光，因而折射系数和漫反射系数相同，折射当作漫反射。上文中给出的公式是 Torrance-Sparrow 模型，主要在于怎么求 F、D、G 三项。上面已经讲了如何得到 F，接下来将怎么求 D 和 G。

D 全称是法线分布函数,有 beckmann NDF 和 GGX NDF 两种实现，分别对应正态分布和对称长尾分布两种分布，考虑到 beckmann NDF 需要近似求解一个没有初等形式原函数的积分，出于方便实现以及资料中说过渡更好，我们采用 GGX NDF 的各项同形式实现。
$$D(h) = \frac{1}{\pi \alpha^2\cos^4\theta(1+\frac{\tan^2\theta}{\alpha^2})^2} = \frac{\alpha^2}{\pi (\alpha^2\cos^2\theta+ \sin^2\theta)^2}$$
其中$\alpha$是超参数粗糙系数，人为审美设定，$\theta$是视线和光线成的角的角平分线与边的夹角，也就是半程向量$h$和视线或光线的夹角。

G 是几何衰减函数，描述的是微表面间相互遮挡的现象，主要是遮挡和阴影。这里我们同样采用 GGX 的实现，并且使用更好的混合遮挡和阴影的模型：

各项同形式：
$$\Lambda(w) = \frac{-1+\sqrt{1+\alpha^2\tan^2\theta}}{2}$$

其中$\alpha$是超参数粗糙系数，$\theta$是光线$w$和微平面法向的夹角

混合模型
$$ G(w_i, w_o) = \frac{1}{1+\Lambda(w_i)+\Lambda(w_o)}$$

微表面下，采样(sample)和能量分布(pdf)不变，只需要在求值(eval)中实现微表面即可。

注意，要过滤掉点乘为负的东西，以及在采样时避免有某一步因子出现了除以 0 的效果导致异常值！！！

```c++
ase MICROFACET:
    {
        // calculate the contribution of diffuse   model
        float cosalpha = dotProduct(N, wo);
        if (cosalpha > 0.0f)
        {
            float F, G, D;
            fresnel(wi, N, ior, F);
            float alpha = 1.0f;

            float ai = std::acos(std::max(dotProduct(-wi, N), 0.0f)), ao = std::acos(std::max(dotProduct(wo, N), 0.0f));
            float Li = (-1 + sqrt(1 + alpha * alpha * std::tan(ai) * std::tan(ai))) / 2;
            float Lo = (-1 + sqrt(1 + alpha * alpha * std::tan(ao) * std::tan(ao))) / 2;
            float d = (1 + Li + Lo);
            if (d < 0.001)
                G = 1.f;
            else
                G = 1.0f / d;

            auto h = normalize(wo - wi);
            float cosa = std::max(dotProduct(h, N), 0.0f);
            d = M_PI * (1 + (alpha * alpha - 1) * cosa * cosa) * (1 + (alpha * alpha - 1) * cosa * cosa);
            if (d < 0.001)
                D = 1.f;
            else
                D = alpha * alpha / d;

            Vector3f diffuse = (Vector3f(1.0f) - F) * Kd / M_PI;
            Vector3f specular;
            float divisor = ((4 * (std::max(dotProduct(N, -wi), 0.0f)) * (std::max(dotProduct(N, wo), 0.0f))));
            if (divisor < 0.001)
                specular = Vector3f(1);
            else
                specular = F * G * D / divisor;
            return diffuse + specular;
        }
        else
            return Vector3f(0.0f);
        break;
    }
```

spp=512 下不同粗糙系数的结果,可以看到图中球上有很多黑色噪点，看论坛说是 getIntersection()中的浮点精度问题，具体是解出来的 t 要大于 0.5 才放行，这里我就不调了，有兴趣的可以自己调。
|![](/mfr0.png)|![](/mfr1.png)|
|--|--|
|$\alpha = 0$|$\alpha = 1$|
|![](/mfr25.png)|![](/mfr75.png)|
|$\alpha = 0.25$|$\alpha = 0.75$|
:::
