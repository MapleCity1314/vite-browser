# AI IDE 配置

在你的 AI 编码环境中配置 `vite-browser`。

## Claude Code

直接安装 skill：

```bash
npx skills add MapleCity1314/vite-browser
```

然后在 `CLAUDE.md` 中加一段简短提示：

```md
## vite-browser

调试 Vite 应用时 —— HMR 故障、热更新后的运行时错误、UI 数据异常或发布前验证 ——
请使用已安装的 `vite-browser` skill 路由器。从路由器开始，按路由到的能力包执行。
```

## Codex

将 skills 提交进仓库，通过 `AGENTS.md` 路由：

```
AGENTS.md
skills/
  SKILL.md
  vite-browser-core-debug/
  vite-browser-runtime-diagnostics/
  vite-browser-network-regression/
  vite-browser-release-smoke/
```

在 `AGENTS.md` 中添加：

```md
## vite-browser

For Vite debugging tasks — runtime errors, HMR regressions, wrong UI data,
or release smoke — use the `vite-browser` skills in `skills/`.

Routing:
- Start with `skills/SKILL.md`
- `vite-browser-runtime-diagnostics` for HMR, reload, module, or import failures
- `vite-browser-network-regression` for request, auth, CORS, or payload issues
- `vite-browser-release-smoke` for pre-merge or pre-release checks
- `vite-browser-core-debug` for broad first-pass triage
```

## Cursor

Cursor 同时支持 `AGENTS.md` 和 `.cursor/rules`。最简单的方式是把 `skills/` 提交进仓库，再加一条路由规则。

如果已经在用 `AGENTS.md`，直接复用上面 Codex 的配置。如果用 Cursor Rules：

```mdc
---
description: Route Vite debugging tasks into vite-browser skill packs.
globs:
alwaysApply: false
---

For Vite debugging tasks — HMR breakage, runtime errors, wrong UI data,
auth failures, or release smoke — start with `skills/SKILL.md`.

Routing:
- `vite-browser-runtime-diagnostics` for HMR, reload, module, import, or websocket issues
- `vite-browser-network-regression` for API, payload, auth, cookie, or CORS issues
- `vite-browser-release-smoke` for final validation
- `vite-browser-core-debug` for broad first-pass diagnosis
```

## 总结

| 工具 | 配置方式 |
|---|---|
| Claude Code | `npx skills add` + `CLAUDE.md` 提示 |
| Codex | 提交 `skills/` + `AGENTS.md` 路由 |
| Cursor | 提交 `skills/` + `AGENTS.md` 或 `.cursor/rules` |

一套 skill 布局、一层路由指令、一条终端执行链路。
