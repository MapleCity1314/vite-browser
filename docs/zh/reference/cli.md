# CLI 参考

`vite-browser` 完整命令参考。

## 浏览器控制

```bash
vite-browser open <url> [--cookies-json <file>]   # 启动浏览器并导航
vite-browser close                                 # 关闭浏览器和守护进程
vite-browser goto <url>                            # 导航到 URL
vite-browser back                                  # 后退
vite-browser reload                                # 刷新页面
```

## 框架检查

```bash
vite-browser detect                   # 自动检测 Vue/React/Svelte
vite-browser vue tree [id]            # Vue 组件树
vite-browser vue pinia [store]        # Pinia store 状态
vite-browser vue router               # Vue Router 状态
vite-browser react tree [id]          # React 组件树
vite-browser svelte tree [id]         # Svelte 组件树
```

## Vite 运行时

```bash
vite-browser vite restart                                    # 触发完整页面刷新
vite-browser vite runtime                                    # 运行时状态概要
vite-browser vite hmr                                        # HMR 概要
vite-browser vite hmr trace [--limit <n>]                    # HMR 事件时间线
vite-browser vite hmr clear                                  # 清除 HMR 历史
vite-browser vite module-graph [--filter <txt>] [--limit <n>]       # 模块图快照
vite-browser vite module-graph trace [--filter <txt>] [--limit <n>] # 模块图追踪
vite-browser vite module-graph clear                         # 清除模块图历史
```

## 错误与诊断

```bash
vite-browser errors                                          # 原始错误
vite-browser errors --mapped                                 # 源码映射后的错误
vite-browser errors --mapped --inline-source                 # 带内联源码片段
vite-browser correlate errors [--window <ms>]                # 错误 ↔ HMR 关联
vite-browser correlate renders [--window <ms>]               # 渲染 ↔ 状态关联
vite-browser diagnose hmr [--window <ms>] [--limit <n>]      # 基于规则的 HMR 诊断
vite-browser diagnose propagation [--window <ms>]            # store→render→error 诊断
```

## 工具命令

```bash
vite-browser logs                    # 控制台输出
vite-browser network [idx]           # 网络请求（按索引查看详情）
vite-browser screenshot              # 页面截图
vite-browser eval <script>           # 在页面上下文中执行 JavaScript
```

## 快速组合

### 快速运行时排查

```bash
vite-browser vite runtime
vite-browser errors --mapped --inline-source
vite-browser correlate errors --mapped --window 5000
vite-browser diagnose hmr --limit 50
```

### 传播路径排查

```bash
vite-browser correlate renders --window 5000
vite-browser diagnose propagation --window 5000
vite-browser vue pinia
vite-browser vue tree
```

### 网络调试

```bash
vite-browser logs
vite-browser network
vite-browser eval '<state probe>'
```

## 输出说明

- `errors --mapped --inline-source` 是需要源码上下文时的最佳起点。
- `correlate errors` 在指定时间窗口内比较当前错误和最近 HMR 事件的关联度。
- `diagnose propagation` 设计为保守输出 —— 只在证据足够强时才报告 `store → render → error` 路径。
