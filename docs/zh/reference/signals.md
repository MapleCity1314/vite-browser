# 信号与置信度

如何解读 `vite-browser` 的诊断输出。

## 信号类型

`vite-browser` 组合了多种运行时证据：

| 信号 | 典型命令 | 权重 |
|---|---|---|
| 当前错误 | `errors --mapped` | 强锚点 |
| 最近 HMR 更新 | `vite hmr trace` | 新鲜时很强 |
| 模块图变化 | `vite module-graph trace` | 适合依赖问题 |
| 框架状态 | `vue tree`、`react tree` | 适合状态 bug |
| Store 变化 | `vue pinia` | 对时序敏感 |
| 日志和网络 | `logs`、`network` | 辅助证据 |

当前错误和最近 HMR 更新通常是最强的锚点。渲染路径和 store 传播线索有价值，但更依赖时序。

## 如何读关联输出

### `correlate errors`

回答：_现在看到的错误，最可能和哪次最近更新有关？_

在以下条件下最强：
- 刚刚完成复现
- 当前错误栈还在
- 更新时间窗口较窄

### `correlate renders`

回答：_最近的状态或模块变化，是否沿某条渲染路径传播到了当前问题？_

应该作为缩小范围的证据来读，不是框架内部的严格回放。

### `diagnose propagation`

基于现有的 store、render、error 证据提供规则化总结。

如果证据链不完整，会有意保持保守。

## 置信度等级

### High confidence

强排查线索。不是数学证明，但通常足以决定下一步优先看哪个文件。

### Medium / plausible

方向性指引 —— 适合收缩怀疑范围，不适合直接当根因结论。

### Weak or absent

通常意味着需要重新复现、缩短时间窗口，或检查日志、网络等相邻信号。

## 最佳实践

- 需要源码上下文时，从 `errors --mapped --inline-source` 开始
- 实时复现时用短时间窗（如 `5000` ms）
- reload 或导航后重新执行命令，保持运行时视图最新
- 跟着最强信号走，不要机械地把所有命令跑一遍
