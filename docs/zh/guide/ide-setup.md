# AI IDE 配置

这个页面给常见 coding agent 环境提供 `vite-browser` 的推荐接入方式。

## Claude Code

`vite-browser` 支持直接安装打包 skill：

```bash
npx skills add MapleCity1314/vite-browser
```

然后在仓库级 `CLAUDE.md` 里加一小段提示：

```md
## vite-browser

When the task is about debugging a Vite app, recent HMR breakage, runtime errors
after a hot update, wrong UI data, or release smoke validation, use the installed
`vite-browser` skill router before inventing a generic debugging flow.

Start from the router skill and follow the routed pack.
```

示例文件：

- [examples/ai-ide/CLAUDE.md](https://github.com/MapleCity1314/vite-browser/blob/master/examples/ai-ide/CLAUDE.md)

## Codex

基于当前 OpenAI Codex 文档，我这里采用的落地方式是：把 agent 指令放在 `AGENTS.md`，把可复用的 skill 内容直接随仓库一起提供，而不是依赖 Claude 专用的安装器。

推荐目录：

```text
AGENTS.md
skills/
  SKILL.md
  vite-browser-core-debug/
  vite-browser-runtime-diagnostics/
  vite-browser-network-regression/
  vite-browser-release-smoke/
```

在 `AGENTS.md` 里加入：

```md
## vite-browser

When the task is about debugging a Vite app, runtime behavior after a recent edit,
HMR or reload regressions, wrong data from the UI, or release smoke checks, use
the checked-in `vite-browser` skills in `skills/`.

Routing:
- Start with `skills/SKILL.md`
- Use `vite-browser-runtime-diagnostics` for HMR, reload, module, or import failures
- Use `vite-browser-network-regression` for request, auth, CORS, or payload issues
- Use `vite-browser-release-smoke` for pre-merge or pre-release checks
- Use `vite-browser-core-debug` only for broad first-pass triage
```

示例文件：

- [examples/ai-ide/AGENTS.codex.md](https://github.com/MapleCity1314/vite-browser/blob/master/examples/ai-ide/AGENTS.codex.md)

## Cursor

基于当前 Cursor 文档，Cursor 可以读 `AGENTS.md`，也支持 `.cursor/rules`。对 `vite-browser` 来说，最稳妥的方式仍然是把 `skills/` 一起放进仓库，再用一层轻量规则做路由。

如果你已经在用 `AGENTS.md`，可以直接复用 Codex 那段配置。如果团队更偏向 Cursor Rules，可以加：

```mdc
---
description: Route Vite debugging tasks into vite-browser skill packs.
globs:
alwaysApply: false
---

When the task is about debugging a Vite app, recent hot-update breakage, runtime
errors after a save, wrong UI data, auth failures, or release smoke validation,
consult the repository's `skills/` directory and start with `skills/SKILL.md`.

Routing:
- `vite-browser-runtime-diagnostics` for HMR, reload, module, import, or websocket issues
- `vite-browser-network-regression` for API, payload, auth, cookie, or CORS issues
- `vite-browser-release-smoke` for final validation
- `vite-browser-core-debug` for broad first-pass diagnosis
```

示例文件：

- [examples/ai-ide/cursor-vite-browser.mdc](https://github.com/MapleCity1314/vite-browser/blob/master/examples/ai-ide/cursor-vite-browser.mdc)

## 实际建议

- Claude Code：直接用打包安装命令
- Codex：把 `skills/` 提交进仓库，并通过 `AGENTS.md` 路由
- Cursor：把 `skills/` 提交进仓库，并通过 `AGENTS.md` 或 `.cursor/rules` 路由

这样你只需要维护一份 skill 内容，工具差异只留在最外层配置。
