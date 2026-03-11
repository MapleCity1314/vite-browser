# 核心概念

## 产品模型

`vite-browser` 不是一个顺手带了几条 Vite 命令的浏览器自动化工具。它的核心是一个更窄、更直接的运行时诊断循环：

1. 连接到一个正在运行的 Vite 应用
2. 读取当前运行时状态
3. 把当前错误和最近的更新活动放到同一个时间窗口里比较
4. 用尽量保守的方式缩小可能原因

这个区别很重要，因为大多数调试痛点都发生在浏览器已经“出错了”之后。

## 什么算证据

这个工具会把平时分散在不同位置的信号拼起来：

- 最近的 HMR 活动
- 模块图变化
- 框架组件状态
- store 更新和 changed keys
- 当前运行时错误
- 浏览器日志和网络请求

输出会尽量保持结构化，方便你在一次真实复现中反复对比。

## 置信度语言

文档里对置信度的表述是有意区分的：

- `high confidence`：证据链足够强，可以作为下一步排查的主要方向
- `plausible`：适合缩小范围，但还不够强，不该直接当成根因定论
- `conservative output`：证据不足时宁愿少说，也不拼出一个看起来完整但站不住的故事

## 它不声称什么

`correlate renders` 和 `diagnose propagation` 应该被理解为“缩小范围工具”，不是“严格证明引擎”。

它们并不保证能完美重建这种深链路：

```text
store update -> component A -> component B -> async side effect -> current error
```

尤其是在跨框架、异步时序复杂或者证据缺失的时候。

## 为什么适合 Agent

Agent 对图形界面观察很弱，但对结构化、可重复执行的查询很强。

所以这类命令组合很适合：

```bash
vite-browser errors --mapped --inline-source
vite-browser correlate errors --mapped --window 5000
vite-browser diagnose hmr --limit 50
```

每一步都给模型一个明确可比较的结果，而不是让它从 DevTools 面板里猜状态。
