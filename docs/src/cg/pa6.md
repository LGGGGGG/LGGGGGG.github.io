# 加速光追

简单想想都知道，模型多了以后，模型面数上去以后如果再对每个三角面片判交的话效率会有多低，因此先判定光线穿越哪些物体进行第一轮过滤，再判定模型哪些面片会和光线相交进行第二轮过滤。

## 用 AABB 进行判定

这里主要介绍了 AABB 包围盒（Axis-Aligned Bounding Box），它是轴对齐的，也就是其平面与 xOy、yOz 或 zOx 平面平行。通常在判断物体相交情况的时候，可以先检测光线是否与 物体的 AABB 相交，如果相交再进行面片的判断。

想法很简单：判断平面上两个物体是否相交可以用它们在 x 轴 y 轴上的投影是否有重叠判断，这里类似的，可以用在光线方向上，进入与离开两对面的线段的投影是否有重叠判断。
![](/AABB1.png)![](/AABB2.png)

需要记住的关键概念是：

1. 光进入了所有对面（slab，一对平行的平面），才算进入 Box

2. 光离开任意一对面，就算离开了包围盒

3. 什么时候有交点：$t_{enter} < t_{exit}$时有交点

4. 考虑负的情况$t_{exit} < 0$说明 Box 在光背后

5. $t_{enter}< 0 \&\& t_{exit} \ge 0$说明光线起点在 Box 内 $\to$ 有交点

6. 对于三维包围盒来说，有如下公式成立：$t_{enter} = \max(t_{min}),t_{exit} = \min(t_{max})$

总之，当且仅当$t_{enter} < t_{exit}\&\&t_{exit} \ge 0$时，光线与 AABB 相交。

## 用分割空间的方法进行判定

模型的哪些三角面片需要做判断呢？以下通过空间划分的方式判断，如果模型的某部分所处子空间与上一步中标定的 AABB 相交，则遍历该子空间中的面片。

### 空间均匀切割

该方法指的是将给定 AABB 划分为若干小的 AABB，并且将那些与物体表面相交的小 AABB 打上标记。在光线传播过程中，如果与某个打上标记的小 AABB 有交点，则认为可能与物体表面相交，需要进一步判断。
![](/usp.png)
缺点在于面片分布很离散时还要进一步划分，并且如何确定划分份数是一个难点。

### 空间划分

通常有八叉树、KD 树、BSP 树三种方案。
![](/sp.png)

- 八叉树：每次迭代都将区域重新切分为均匀四块，按一定规则停止切分（如切分得到的四块区域中，三块都没有物体；或四块区域都还有物体，但是此时的区域已经较小）

- KD 树：总是沿某个轴进行切分，每次划分总会在原来的区域上生成两块新的区域（这里沿轴的次序是由交替进行的，如二维中总是按着 x y 的次序进行交替切分）
- BSP 树：每次都是沿着一定方向进行切分（非水平或竖直）

下面介绍 ICPC 第 65536 喜欢的 KD 树：
![](/kdt.png)

1. 划分思路

   取方差最大的轴，取中位数作为根，小于根的放在左子树，大于根的放在右子树。重复过程直至无法划分。

2. 数据结构

   中间节点（A，B，C，D）存储了：

- 划分后的轴

- 划分后的切分平面

- 子节点的指针

叶子节点（1，2，3，4，5）存储了：区域中包含的物体的列表（obj 只会存在于叶子节点）

3. 与光线追踪结合

1）发射光线从根节点出发，分别判断光线与左右节点是否相交，若相交则进入 2）；否则，则与节点不相交

2）递归判断相交直至叶子节点，若与叶子节点相交，进入 3）

3） 挨个判断叶子节点存储物体与光线的相交情况

八叉树和 KD 树的问题在于，一是物体可能存在于多个子空间中，比如一条光线可能经过多个子空间，而这些子空间都与同一个物体相交，那就需要对该物体进行多次交点求解。二是很难判定 AABB 是否和物体存在交集。

BSP 树问题在于没有划分为轴平行包围盒，不便于计算。

### BVH 划分

本质是将一个场景用一个包围盒包住，然后按照一定划分方案将盒子划分成不同的子区域，不同子区域都需要包含三角形，最终划分到叶子节点时，每个叶子节点就包含了一些三角形，即包含了对应的一些物体。
![](/bvh.png)

1. 划分思路

- 按轴次序划分(XYXYXYX...或者 YXYXYX...)
- 按最长轴划分(每次取中点)
- 在物体三角形数目的最中间对物体进行划分（这里的最中间指的是划分后，两边的三角形数目基本一致，轴中点未必能使轴两侧数目一致）

当包围盒中物体个数小于一个定值时停止划分。

2. 数据结构

- 中间节点（Internal nodes）：该节点对应的包围盒和子节点的指针

- 叶子节点（Leaf nodes）：该节点对应的包围盒和包围盒里面的物体列表

3. 与光追结合
   ![](/bvhcode.png)

4. 对比
   ![](/cmp.png)

## 作业

SAH 实际就是桶排序。简单来说，BVH 是用中位数来定划分哪些东西在左边，哪些东西在右边。然而 SAH 用桶先将平面划分成一个个桶，然后从左到右合并桶，左边的桶就是左子树，右边的桶就是右子树。
![](/SAHB.png)
合并的依据不再是简单的物体数量，而是下面给出的代价：
![](/SAH.png)
其中$C_{trav}$是遍历树节点的代价，这里固定为一个常数 0.125，这是因为若我们将光线求交的代价$C_{isect}$设置为 1，遍历效率大概是求交的 1/8，重要的是它们之间的相对关系，而不是数值。

$N_{A},N_{B},$具体设置为每个区域内图元的数目。

$\frac{S_x}{S_N}$代表着光线穿过子节点的概率,使用 x 的 boundingbox 面积 与 总 boundingbox 面积的比值来确定

具体流程概括如下：

1. 首先我们和之前的划分算法一样,找出最长的维度
2. 这里我们定义一定数目的 bucket 在整体的 boundingbox 上进行划分 计算出每个物体在哪个 bucket 的索引
3. 每个 bucket 都代表着一种划分方法 我们遍历计算各方法的代价 然后找出最小代价对应的 bucket 索引

:::details
如果方向某个维度是负的 会和 pMax 对应维度上的面上先相交。注意到下面我没有使用框架给的原始定义，我将它反过来更符合命名直觉。

```c++
inline bool Bounds3::IntersectP(const Ray &ray, const Vector3f &invDir,
                                const std::array<int, 3> &dirIsNeg) const
{
    // invDir: ray direction(x,y,z), invDir=(1.0/x,1.0/y,1.0/z), use this because Multiply is faster that Division
    // dirIsNeg: ray direction(x,y,z), dirIsNeg=[int(x>0),int(y>0),int(z>0)], use this to simplify your logic
    // TODO test if ray bound intersects
    auto t_min = (pMin - ray.origin) * invDir;
    auto t_max = (pMax - ray.origin) * invDir;
    if (dirIsNeg[0])
        std::swap(t_min.x, t_max.x);
    if (dirIsNeg[1])
        std::swap(t_min.y, t_max.y);
    if (dirIsNeg[2])
        std::swap(t_min.z, t_max.z);
    auto t_enter = std::max({t_min.x, t_min.y, t_min.z});
    auto t_exit = std::min({t_max.x, t_max.y, t_max.z});
    return t_enter <= t_exit && t_exit >= 0;
}
```

为了统一描述，下面的 dirIsNeg 也要修改。照着 PPT 翻译即可。

```c++
Intersection BVHAccel::getIntersection(BVHBuildNode *node, const Ray &ray) const
{
    // TODO Traverse the BVH to find intersection
    std::array<int, 3> dirIsNeg{ray.direction.x < 0, ray.direction.y < 0, ray.direction.z < 0};
    Intersection isect;
    if (!node->bounds.IntersectP(ray, ray.direction_inv, dirIsNeg))
        return isect;
    if (!node->left && !node->right)
    {
        isect = node->object->getIntersection(ray);
        return isect;
    }
    auto hit1 = getIntersection(node->left, ray);
    auto hit2 = getIntersection(node->right, ray);
    return hit1.distance < hit2.distance ? hit1 : hit2;
}
```

最后是 SAH 实际上并没有比 BVH 快，可能要面数更多才有用。

```c++
BVHBuildNode *BVHAccel::SAHrecursiveBuild(std::vector<Object *> objects)
{
    BVHBuildNode *node = new BVHBuildNode();

    Bounds3 bounds;
    for (int i = 0; i < objects.size(); ++i)
        bounds = Union(bounds, objects[i]->getBounds());

    if (objects.size() <= 2)
    {
        node = recursiveBuild(objects);
        return node;
    }
    else
    {
        Bounds3 centroidBounds;
        for (int i = 0; i < objects.size(); ++i)
            centroidBounds =
                Union(centroidBounds, objects[i]->getBounds().Centroid());
        int dim = centroidBounds.maxExtent();
        constexpr int nBuckets = 8;
        struct BucketInfo
        {
            int count = 0;
            Bounds3 bounds;
        };
        BucketInfo buckets[nBuckets];
        for (int i = 0; i < objects.size(); ++i)
        {
            int b = nBuckets *
                    centroidBounds.Offset(
                                      objects[i]->getBounds().Centroid())
                        .get_(dim);
            if (b == nBuckets)
                b = nBuckets - 1;
            buckets[b].count++;
            buckets[b].bounds =
                Union(buckets[b].bounds, objects[i]->getBounds());
        }
        float cost[nBuckets - 1];
        for (int i = 0; i < nBuckets - 1; ++i)
        {
            Bounds3 b0, b1;
            int count0 = 0, count1 = 0;
            for (int j = 0; j <= i; ++j)
            {
                b0 = Union(b0, buckets[j].bounds);
                count0 += buckets[j].count;
            }
            for (int j = i + 1; j < nBuckets; ++j)
            {
                b1 = Union(b1, buckets[j].bounds);
                count1 += buckets[j].count;
            }
            cost[i] = 0.125f +
                      (count0 * b0.SurfaceArea() +
                       count1 * b1.SurfaceArea()) /
                          bounds.SurfaceArea();
        }

        float minCost = cost[0];
        int minCostSplitBucket = 0;
        for (int i = 1; i < nBuckets - 1; ++i)
        {
            if (cost[i] < minCost)
            {
                minCost = cost[i];
                minCostSplitBucket = i;
            }
        }
        float leafCost = objects.size();
        int mid = 0;

        if (objects.size() > maxPrimsInNode || minCost < leafCost)
        {
            for (int i = 0; i < objects.size(); ++i)
            {
                int b = nBuckets *
                        centroidBounds.Offset(
                                          objects[i]->getBounds().Centroid())
                            .get_(dim);
                if (b == nBuckets)
                    b = nBuckets - 1;

                if (b <= minCostSplitBucket)
                {
                    std::swap(objects[i], objects[mid]);
                    mid++;
                }
            }
        }

        auto beginning = objects.begin();
        auto middling = objects.begin() + mid;
        auto ending = objects.end();

        auto leftshapes = std::vector<Object *>(beginning, middling);
        auto rightshapes = std::vector<Object *>(middling, ending);

        assert(objects.size() == (leftshapes.size() + rightshapes.size()));

        node->left = SAHrecursiveBuild(leftshapes);
        node->right = SAHrecursiveBuild(rightshapes);

        node->bounds = Union(node->left->bounds, node->right->bounds);
    }

    return node;
}
```

效果：
![](/bvho.png)

实验对比

- BVH
  ![](/tt1.png)
- SAH
  ![](/tt2.png)

:::
