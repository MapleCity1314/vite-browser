# Skill Pack 说明

## Router

`skills/SKILL.md` 是顶层 router。对 agent 场景，它应该是第一入口。

它的职责是尽早选出一个更聚焦的 pack，而不是把所有工作流都一股脑跑一遍。

## Pack 矩阵

| Pack | 适用场景 | 首批信号 |
|---|---|---|
| `vite-browser-core-debug` | 页面坏了，但失败类型还很泛、说不清。 | `errors`、`logs`、`vite runtime`、框架组件树 |
| `vite-browser-runtime-diagnostics` | 问题发生在最近编辑、热更新、刷新、import 失败或 runtime 不稳定之后。 | `errors --mapped --inline-source`、`correlate errors`、`diagnose hmr`、`diagnose propagation` |
| `vite-browser-network-regression` | UI 数据错了、缺了、请求失败了，或 auth/CORS 看起来异常。 | `network`、`logs`、`errors --mapped`、`eval` |
| `vite-browser-release-smoke` | 合并或发布前做最终验证。 | `detect`、`errors`、`network`、`vite runtime`、smoke report |

## Router 策略

推荐路由规则是：

1. 只有在症状还很泛时才先走 `core-debug`
2. 只要最近更新时间和故障强相关，就立即切到 `runtime-diagnostics`
3. 只要主要症状是请求或数据不匹配，就切到 `network-regression`
4. `release-smoke` 只用于最终验证，不负责根因分析

## 为什么要这么拆

如果没有 router，agent 很容易：

- 一开始就跑太多命令
- 把 network 证据和 runtime 证据混在一起
- 过度解读证据很弱的输出
- 直接跳过第一步路由决策

pack 的拆分就是为了避免这些问题。
