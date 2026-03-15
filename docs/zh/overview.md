# 概览

## vite-browser 是什么？

`vite-browser` 是一个面向 Vite 应用的运行时诊断 CLI。它连接到正在运行的 Vite dev server，将框架状态、HMR 活动、错误关联和传播线索以结构化终端输出的形式呈现。

它服务于两类用户：

- **开发者**：希望从终端获得运行时故障的诊断信息，而不是在 DevTools 面板之间来回切换。
- **AI 编码助手**：需要机器可读的信号来逐步调试 Vite 应用。

## 安装

**作为 Agent Skill 安装**（推荐）：

```bash
npx skills add MapleCity1314/vite-browser
```

这会安装 skill 路由器和它所路由到的四个能力包。你的 AI 编码工具会自动选择正确的调试工作流。

**作为 CLI 工具安装**：

```bash
npm install -g @presto1314w/vite-devtools-browser
npx playwright install chromium
```

## 它能做什么

当 Vite 应用在热更新后出错时，错误覆盖层告诉你_出了什么问题_，`vite-browser` 则告诉你_为什么_：

- **错误关联** —— 将当前错误与最近 HMR 更新的模块在可配置的时间窗口内匹配。
- **传播诊断** —— 当一个状态变化导致下游组件崩溃时，追踪 `store → render → error` 路径。
- **HMR 诊断** —— 检测 `missing-module`、`circular-dependency`、`hmr-websocket-closed` 等模式，并标注置信度。
- **框架检查** —— 查询 Vue 组件树、Pinia 状态、Vue Router；React 组件树、Zustand store 状态、hook 诊断、commit 追踪；或 Svelte 组件树。
- **映射错误** —— 经过 sourcemap 解析的错误栈，支持内联源码片段。

## 能力地图

`vite-browser` 将功能组织为四个聚焦的能力包，skill 路由器会根据症状自动选择：

| 能力包 | 适用场景 | 首选命令 |
|---|---|---|
| [Core Debug](/zh/capabilities/core-debug) | 应用坏了但故障类型还不清楚 | `errors`、`logs`、`vite runtime` |
| [Runtime Diagnostics](/zh/capabilities/runtime-diagnostics) | 问题出现在编辑、热更新或刷新之后 | `correlate errors`、`diagnose hmr`、`diagnose propagation` |
| [Network Regression](/zh/capabilities/network-regression) | 数据错误、请求失败或 auth/CORS 问题 | `network`、`logs`、`errors --mapped` |
| [Release Smoke](/zh/capabilities/release-smoke) | 合并或发布前的最终验证 | `detect`、`errors`、`network`、`vite runtime` |

## 与其他工具对比

| 工具 | 擅长 | 区别 |
|---|---|---|
| `agent-browser` | 通用浏览器自动化 | 不了解 Vite 运行时 |
| `next-browser` | Next.js + React DevTools | 不是 Vite 工具 |
| `vite-plugin-vue-mcp` | Vue MCP 集成 | 需要安装插件，仅 Vue |
| **`vite-browser`** | **Vite 运行时诊断** | 零配置、多框架、Agent 原生 |

## 接下来

- [快速开始](/zh/guide/getting-started) —— 安装并运行第一次会话
- [Agent Skills](/zh/guide/agent-skills) —— 了解 skill-first 的调试模式
- [排查工作流](/zh/guide/workflows) —— 常见调试场景
