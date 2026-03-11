# Skill Pack 说明

`vite-browser` 技能路由系统参考。

## 路由器

`skills/SKILL.md` 是顶层路由器。对 agent 场景来说，它应该始终是第一入口。

它的职责：尽早选出一个聚焦的能力包，而不是一次把所有工作流都跑一遍。

## 能力包矩阵

| 能力包 | 适用场景 | 首选命令 |
|---|---|---|
| `core-debug` | 应用坏了，故障类型还不清楚 | `errors`、`logs`、`vite runtime`、框架组件树 |
| `runtime-diagnostics` | 问题出现在编辑、热更新、刷新、import 失败或运行时不稳定之后 | `errors --mapped`、`correlate errors`、`diagnose hmr`、`diagnose propagation` |
| `network-regression` | 数据错了/缺了、请求失败、auth/CORS 异常 | `network`、`logs`、`errors --mapped`、`eval` |
| `release-smoke` | 合并或发布前做最终验证 | `detect`、`errors`、`network`、`vite runtime`、smoke 报告 |

## 路由策略

1. 只有在症状还很泛时才走 `core-debug`
2. 只要时间和最近更新相关，就切到 `runtime-diagnostics`
3. 只要主要症状是请求或数据不匹配，就切到 `network-regression`
4. `release-smoke` 只用于最终签核，不做根因分析

## 为什么要这么拆

没有路由器时，agent 容易：

- 一开始就跑太多命令
- 把网络证据和运行时证据混在一起
- 过度解读薄弱的证据
- 直接跳过路由决策

能力包的拆分，就是把第一步决策编码进工作流里，防止这些问题发生。
