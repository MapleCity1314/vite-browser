# 核心概念

## 调试循环

`vite-browser` 围绕一个特定的循环构建：

1. **连接**到正在运行的 Vite 应用
2. **读取**当前运行时状态
3. **对比**当前故障与最近的更新活动
4. **缩小**可能的原因范围，产出可以反复查询的证据

这和通用的浏览器自动化不同。大多数调试的痛点发生在浏览器_已经渲染出错误结果之后_ —— `vite-browser` 专注于这个时刻。

## 证据类型

这个工具把平时分散在不同面板中的信号组合起来：

| 信号 | 来源 | 权重 |
|---|---|---|
| 当前错误 | 浏览器运行时 | 强锚点 |
| 最近 HMR 更新 | Vite WebSocket | 新鲜时很强 |
| 模块图变化 | Vite 内部 | 适合依赖问题 |
| 框架组件状态 | Vue/React/Svelte DevTools | 适合状态相关的 bug |
| Store 变化 & changed keys | 框架 store | 对时序敏感 |
| 控制台日志 & 网络请求 | 浏览器 API | 辅助证据 |

所有输出都保持结构化，方便在一次实际的调试过程中反复对比。

## 置信度等级

`vite-browser` 在输出中使用有意区分的置信度语言：

- **High confidence** —— 证据链足够强，可以据此行动。通常足以决定下一步应该看哪个文件。
- **Plausible** —— 适合缩小怀疑范围，但还不够作为根因结论。
- **Conservative output** —— 证据不足时，工具宁可少说，也不拼出一个站不住的解释。

## 它不声称什么

`correlate renders` 和 `diagnose propagation` 是**缩小范围的工具**，不是因果证明引擎。

它们不保证能重建这样的深层链路：

```
store update → component A → component B → async side effect → error
```

跨框架、跨异步时序的完整追踪超出当前能力。当证据不完整时，输出会有意保持保守。

## 为什么适合 AI 编码助手

AI 编码助手不擅长图形界面的视觉检查，但很擅长反复执行结构化查询。`vite-browser` 正好发挥这个优势：

```bash
vite-browser errors --mapped --inline-source   # 看看什么坏了
vite-browser correlate errors --mapped          # 最近改了什么
vite-browser diagnose hmr --limit 50            # 匹配到什么模式
```

每条命令都返回具体的、可比较的结果 —— 不需要解析截图，不需要导航 DevTools。
