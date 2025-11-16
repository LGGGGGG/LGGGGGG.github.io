# 动画

## 质量弹簧系统

这是哥们毕设的一部分啊，物理模拟，也够简单了，隐式欧拉、显式欧拉、数值模拟，唉~

质量弹簧系统很简单，主要是用来进行布料、头发以及非刚体模拟，将模型的顶点视作有质量的点，应用重力，模型的边视作弹簧，应用弹力。弹力由胡克定律和简谐运动约束。
![](/masspring.png)

## 粒子系统

粒子系统指的是模拟大量粒子集合的运动，在其中每个粒子的运动又会受到不同力的影响，如碰撞、引力等，我们只需要把这些力正确的模拟出来即可。譬如可以模拟水流、星系、鸟群。本科图形学这里做的太阳系动画。

## 运动学

- 正向运动学（forward kinematics）：已知初始的关键点位置和相对旋转，计算最终的关键点位置。唯一解

- 反向运动学（inverse kinematics）：根据初始的关键点位置和最终关键点位置，计算相对旋转的数学过程。无解或无穷多解（ill-posed problem）。

## 刚体模拟

不会发生形变，即刚体的内部都会以一种方式（趋势）进行运动，所以也可以把刚体模拟看成是粒子的扩充进行模拟。哥们毕设就做的这个，用有限元模拟。
![](/rigid.png)

## 流体模拟

张宇师兄用的粒子系统来模拟，很强！

关键想法：

- 水是由无数小的刚体球体组成

- 水无法被压缩，即任意处水的密度相等

- 当某处的密度改变了，需要其他位置的球来补充

- 需要知道各处的密度梯度，使用梯度下降更新

![](/way.png)

## 作业

重走来时路！！！

:::details

```c++
Rope::Rope(Vector2D start, Vector2D end, int num_nodes, float node_mass, float k, vector<int> pinned_nodes)
    {
        // TODO (Part 1): Create a rope starting at `start`, ending at `end`, and containing `num_nodes` nodes.
        for (int i = 0; i < num_nodes; ++i)
        {
            auto pos = start + (end - start) * (double)i / (double)num_nodes;
            masses.push_back(new Mass(pos, node_mass, 0));
        }
        for (int i = 0; i < num_nodes - 1; ++i)
            springs.push_back(new Spring(masses[i], masses[i + 1], k));

        //        Comment-in this part when you implement the constructor
        for (auto &i : pinned_nodes)
        {
            masses[i]->pinned = true;
        }
    }

    void Rope::simulateEuler(float delta_t, Vector2D gravity)
    {
        for (auto &s : springs)
        {
            // TODO (Part 2): Use Hooke's law to calculate the force on a node
            auto len = (s->m1->position - s->m2->position).norm(); // 长度
            s->m1->forces += -s->k * (s->m1->position - s->m2->position) / len * (len - s->rest_length);
            s->m2->forces += -s->k * (s->m2->position - s->m1->position) / len * (len - s->rest_length);
        }

        float kd = 0.005;
        for (auto &m : masses)
        {
            if (!m->pinned)
            {
                // TODO (Part 2): Add the force due to gravity, then compute the new velocity and position
                // 显示欧拉   下一个位置用当前速度计算得到
                // auto a = m->forces / m->mass + gravity; //加速度
                // m->position += m->velocity * delta_t;
                // m->velocity += a*delta_t;

                // 半隐式欧拉  使用下一时间的速度计算下一时间的位置

                // auto a = m->forces / m->mass + gravity;
                auto a = m->forces / m->mass + gravity - kd * m->velocity / m->mass; // 带阻尼版本

                m->velocity += a * delta_t;
                m->position += m->velocity * delta_t;
                // TODO (Part 2): Add global damping
            }

            // Reset all forces on each mass
            m->forces = Vector2D(0, 0);
        }
    }

    void Rope::simulateVerlet(float delta_t, Vector2D gravity)
    {
        for (auto &s : springs)
        {
            // TODO (Part 3): Simulate one timestep of the rope using explicit Verlet （solving constraints)
            auto len = (s->m1->position - s->m2->position).norm();
            s->m1->forces += -s->k * (s->m1->position - s->m2->position) / len * (len - s->rest_length);
            s->m2->forces += -s->k * (s->m2->position - s->m1->position) / len * (len - s->rest_length);
        }

        float damping_factor = 0.00005;
        for (auto &m : masses)
        {
            if (!m->pinned)
            {
                Vector2D temp_position = m->position;
                // TODO (Part 3.1): Set the new position of the rope mass
                auto a = m->forces / m->mass + gravity;
                // TODO (Part 4): Add global Verlet damping
                // m->position = temp_position + (temp_position - m->last_position) + a * delta_t * delta_t;
                m->position = temp_position + (1 - damping_factor) * (temp_position - m->last_position) + a * delta_t * delta_t; // 带阻尼版本

                m->last_position = temp_position;
            }
            m->forces = Vector2D(0, 0);
        }
    }
}

```

:::
