# 快速开始

## 环境要求

- Node.js `>=20`
- 通过 Playwright 安装的 Chromium
- 一个正在运行的 Vite dev server

## 安装

### 方式一：Agent Skill（推荐）

安装 skill 路由器，AI 编码工具会自动选择正确的调试工作流：

```bash
# Claude Code
npx skills add MapleCity1314/vite-browser
```

Codex 或 Cursor 的配置方式见 [AI IDE 配置](/zh/guide/ide-setup)。

### 方式二：仅 CLI

```bash
npm install -g @presto1314w/vite-devtools-browser
npx playwright install chromium
```

也可以不全局安装，直接运行：

```bash
npx @presto1314w/vite-devtools-browser open http://localhost:5173
```

## 第一次使用

在一个终端启动你的应用：

```bash
cd my-app && npm run dev
```

在另一个终端连接 `vite-browser`：

```bash
# 1. 打开浏览器，导航到应用
vite-browser open http://localhost:5173

# 2. 检测正在运行的框架
vite-browser detect

# 3. 查看 Vite 运行时状态
vite-browser vite runtime

# 4. 查看当前错误（带源码上下文）
vite-browser errors --mapped --inline-source

# 5. 与最近的 HMR 活动关联
vite-browser correlate errors --mapped --window 5000

# 6. 完成 — 关闭浏览器
vite-browser close
```

## 常见排查路径

### 保存文件后 HMR 触发，页面坏了

```bash
vite-browser vite hmr trace --limit 50
vite-browser correlate errors --mapped --window 5000
vite-browser diagnose hmr --limit 50
```

### 怀疑是 store 驱动的渲染问题（Vue）

```bash
vite-browser correlate renders --window 5000
vite-browser diagnose propagation --window 5000
vite-browser vue pinia
```

### 怀疑是 store 驱动的渲染问题（React）

```bash
vite-browser correlate renders --window 5000
vite-browser diagnose propagation --window 5000
vite-browser react store list
vite-browser react store inspect <name>
```

### 接口或数据问题

```bash
vite-browser errors --mapped
vite-browser logs
vite-browser network
```

## 接下来

- [核心概念](/zh/guide/concepts) —— 了解产品模型和置信度体系
- [Agent Skills](/zh/guide/agent-skills) —— 了解 skill-first 调试方式
- [排查工作流](/zh/guide/workflows) —— 详细的调试流程
