# Quick Start Guide

## 快速开始

### 1. 安装依赖

```bash
cd vite-browser
pnpm install
pnpm exec playwright install chromium
```

### 2. 构建项目

```bash
pnpm build
```

### 3. 创建测试 Vue 应用

```bash
# 在另一个目录创建测试应用
pnpm create vite my-vue-app --template vue
cd my-vue-app
pnpm install
pnpm dev
```

### 4. 测试 vite-browser

```bash
# 回到 vite-browser 目录
cd ../vite-browser

# 打开浏览器
node dist/cli.js open http://localhost:5173

# 检测框架
node dist/cli.js detect

# 截图
node dist/cli.js screenshot

# 查看日志
node dist/cli.js logs

# 查看网络请求
node dist/cli.js network

# 关闭浏览器
node dist/cli.js close
```

## 开发模式

使用 tsx 直接运行源码：

```bash
pnpm dev open http://localhost:5173
pnpm dev detect
pnpm dev close
```

## 当前可用命令

✅ **已实现**：
- `open <url>` - 打开浏览器
- `close` - 关闭浏览器
- `goto <url>` - 导航到 URL
- `back` - 后退
- `reload` - 重新加载
- `detect` - 检测框架
- `screenshot` - 截图
- `eval <script>` - 执行 JavaScript
- `network [idx]` - 查看网络请求
- `logs` - 查看控制台日志
- `errors` - 查看 Vite 错误

⏳ **待实现**：
- `vue tree` - Vue 组件树
- `vue pinia` - Pinia stores
- `vue router` - Vue Router 信息
- `react tree` - React 组件树
- `vite restart` - 重启 Vite server
- `vite hmr` - HMR 状态

## 下一步

1. 实现 Vue DevTools 集成
2. 实现 Pinia store 检查
3. 从 next-browser 复制 React 支持
4. 添加测试
