# 版本说明

## 当前版本

### v0.3.6

`v0.3.6` 是 `v0.3` 版本线上的当前稳定版本。它保留了 `v0.3.5` 的增强 React 支持，同时强化了浏览器启动、框架检测和发布验证，使所有命令在真实环境中表现一致。

主要改进：

- React 检测稳定性修复：hook 恢复、renderer 选择、fiber root 追踪
- 系统 Chrome/Chromium 回退支持，加上 headless 验证模式
- 修复跨平台 E2E 发布门控，使用仓库内 Vue fixture
- 增强 Vue / Pinia 在 devtools 全局变量缺失时的回退检测
- 191 个测试通过（从 v0.3.3 的 154 个增长）

### v0.3.5

`v0.3.5` 交付了增强 React 支持里程碑：Zustand store 检查、内置 hook 诊断、轻量级 React commit 追踪，以及无需外部扩展的内置 DevTools hook。

## 版本线

| 版本 | 定位 |
|---|---|
| `v0.2.x` | 从"观察"走向"诊断" —— 引入错误关联和规则化诊断 |
| `v0.3.0–0.3.3` | 传播线索和实时复现可靠性持续增强 |
| `v0.3.5` | React 支持扩展到与 Vue/Pinia 诊断深度对齐 |
| `v0.3.6` | 强化已发布的 React/Vue 检查能力和发布门控 |

Patch 版本的重点通常不是改产品模型，而是让真实复现中的证据链更稳定、更可信。

## 详细发布记录

- [v0.3.6](/release-notes-0.3.6)
- [v0.3.5](/release-notes-0.3.5)
- [v0.3.3](/release-notes-0.3.3)
- [v0.3.2](/release-notes-0.3.2)
- [v0.3.1](/release-notes-0.3.1)
- [v0.3.0](/release-notes-0.3.0)
- [v0.2.2](/release-notes-0.2.2)
