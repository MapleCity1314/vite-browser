# Agent Skills

## 什么是 Agent Skills？

Agent Skills 是打包好的调试工作流，AI 编码工具（Claude Code、Codex、Cursor）可以自动遵循。不需要 agent 每次都临时发明一套调试流程 —— skill 已经编码了正确的步骤、正确的顺序和正确的路由逻辑。

`vite-browser` 采用 skill-first 的设计 —— CLI 提供原始命令，而 skill 路由器提供智能层，决定_运行哪些命令_以及_什么时候运行_。

## 为什么这很重要

没有 skill 路由器时，AI agent 在调试 Vite 应用故障时通常会：

- 一开始就跑太多命令
- 把网络证据和运行时证据混在一起
- 过度解读薄弱的证据
- 完全跳过第一步的路由决策

Skill 路由器通过编码一棵决策树来解决这些问题：

| 症状 | 路由到 |
|---|---|
| 故障类型还不清楚 | `core-debug` |
| 最近编辑或 HMR 后出问题 | `runtime-diagnostics` |
| 数据错误或请求失败 | `network-regression` |
| 合并/发布前验证 | `release-smoke` |

## 安装

```bash
# Claude Code
npx skills add MapleCity1314/vite-browser
```

这会安装路由器和四个聚焦的能力包：

```
skills/SKILL.md                              ← 路由器
skills/vite-browser-core-debug/SKILL.md
skills/vite-browser-runtime-diagnostics/SKILL.md
skills/vite-browser-network-regression/SKILL.md
skills/vite-browser-release-smoke/SKILL.md
```

## Agent 的使用方式

当用户这样说时：

- _"热更新后页面坏了"_
- _"最近哪次改动导致了这个错误？"_
- _"UI 显示的数据不对"_
- _"发版前帮我跑一下 smoke check"_

agent 会读取路由器 skill，选择匹配的能力包，然后按照结构化的工作流执行 —— 而不是凭猜测。

## 什么时候直接用 CLI

CLI 是更底层的接口，适合以下情况：

- 你想手动检查某一个信号
- 你在验证某一条命令的输出
- 你的环境不支持打包 skill 安装

其他情况下，从 skill 路由器开始。

## 接下来

- [AI IDE 配置](/zh/guide/ide-setup) —— 配置 Claude Code、Codex 或 Cursor
- [Skill Pack 说明](/zh/reference/skill-packs) —— 详细的能力包参考
