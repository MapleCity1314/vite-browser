# 快速开始

## 推荐顺序

对大多数用户，正确顺序应该是：

1. 先安装或接入 `vite-browser` skill router
2. 给 AI IDE 补一层很薄的路由配置
3. 把原始 CLI 作为底层执行层保留

如果你还没做第 1 步，先看：

- [Agent Skills](/zh/guide/agent-skills)
- [AI IDE 配置](/zh/guide/ide-setup)

## 环境要求

- Node.js `>=20`
- 已通过 Playwright 安装 Chromium
- 一个正在运行的 Vite dev server

## Skill First 快速接入

### Claude Code

```bash
npx skills add MapleCity1314/vite-browser
```

然后把 [AI IDE 配置](/zh/guide/ide-setup#claude-code) 里的 `CLAUDE.md` 提示加进去。

### Codex 或 Cursor

把 `skills/` 提交进仓库，再加上 [AI IDE 配置](/zh/guide/ide-setup) 里的路由片段。

## CLI 层

skills 底层依赖的 CLI 安装方式：

```bash
npm install -g @presto1314w/vite-devtools-browser
npx playwright install chromium
```

如果你不想全局安装，也可以直接跑：

```bash
npx @presto1314w/vite-devtools-browser open http://localhost:5173
```

## 第一次手动会话

先在一个终端启动你的应用：

```bash
cd my-app
npm run dev
```

再在另一个终端连接 `vite-browser`：

```bash
vite-browser open http://localhost:5173
vite-browser detect
vite-browser vite runtime
vite-browser errors --mapped --inline-source
vite-browser correlate errors --mapped --window 5000
vite-browser close
```

## 推荐排查路径

### 保存文件后 HMR 触发，页面坏了

```bash
vite-browser vite hmr trace --limit 50
vite-browser correlate errors --mapped --window 5000
vite-browser diagnose hmr --limit 50
```

### 怀疑是 store 驱动的重渲染问题

```bash
vite-browser correlate renders --window 5000
vite-browser diagnose propagation --window 5000
vite-browser vue pinia
vite-browser vue tree
```

### 怀疑是运行时或接口问题

```bash
vite-browser logs
vite-browser network
vite-browser errors --mapped
```

## 说明

- `correlate renders` 和 `diagnose propagation` 更适合看作高置信度缩小范围，而不是严格因果证明。
- 目前 Vue 运行时排查路径最完整；React 和 Svelte 也支持检查，但跨框架传播分析还在继续扩展。
