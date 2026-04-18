# vite-browser v0.4.0

`v0.4.0` introduces **MCP (Model Context Protocol) support**, making vite-browser a first-class MCP server that AI agents and IDE assistants can invoke directly — no shell wrappers needed.

## What's new

### MCP server (`vite-browser mcp`)

vite-browser now ships a built-in MCP stdio server. Start it with:

```bash
vite-browser mcp
# or via the dedicated binary
vite-browser-mcp
```

The server exposes **27 MCP tools** that map 1-to-1 to the existing daemon commands:

| Category | Tools |
|---|---|
| Browser control | `browser_open`, `browser_close`, `browser_goto`, `browser_back`, `browser_reload`, `browser_screenshot`, `browser_eval` |
| Framework detection | `detect_framework` |
| Vue | `vue_tree`, `vue_pinia`, `vue_router` |
| React | `react_tree`, `react_store_list`, `react_store_inspect`, `react_hook_health`, `react_hook_inject`, `react_commits`, `react_commits_clear` |
| Svelte | `svelte_tree` |
| Vite | `vite_restart`, `vite_hmr`, `vite_runtime`, `vite_module_graph` |
| Diagnostics | `get_errors`, `correlate_errors`, `correlate_renders`, `diagnose_hmr`, `diagnose_propagation` |
| Utilities | `get_logs`, `get_network` |

`browser_screenshot` returns the page screenshot as **inline image content** via the MCP image content type — no file paths to resolve.

### `vite-browser-mcp` bin entry

A dedicated `vite-browser-mcp` binary is now included in the package so MCP clients can reference the server directly without knowing the `mcp` subcommand:

```json
{
  "mcpServers": {
    "vite-browser": {
      "command": "vite-browser-mcp"
    }
  }
}
```

## Configuring Claude Code

Add to your project `.claude/settings.json` (or global `~/.claude/settings.json`):

```json
{
  "mcpServers": {
    "vite-browser": {
      "command": "vite-browser-mcp"
    }
  }
}
```

Restart Claude Code and the vite-browser tools will appear automatically. The daemon starts on first use and is shared across all tool calls in the session.

## Validation

Verified with:

- `pnpm typecheck`
- `pnpm test` (191 / 191 pass)
- `pnpm build`

## Upgrade

```bash
npm install @presto1314w/vite-devtools-browser@0.4.0
```

No configuration changes are required for existing CLI users. The MCP server is an additive entry point — all existing commands and behavior are unchanged.
