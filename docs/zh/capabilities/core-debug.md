# Core Debug

## 什么时候用

当应用坏了，但你还不确定问题到底是 runtime/HMR 问题、网络/数据问题，还是框架状态问题时，用 `core-debug`。

这是**最宽的首轮排查**能力。它负责分类故障、然后路由到正确的下一步。

## 典型症状

- _"页面坏了"_
- _"组件状态不对"_
- _"改了点东西后 UI 很奇怪"_

## 命令序列

```bash
vite-browser open <url>
vite-browser detect
vite-browser vite runtime
vite-browser errors --mapped --inline-source
vite-browser logs
```

根据 `detect` 的结果检查框架状态：

- **Vue：** `vue tree`、`vue pinia`、`vue router`
- **React：** `react tree`
- **Svelte：** `svelte tree`

需要时交叉验证：

```bash
vite-browser network
vite-browser screenshot
vite-browser eval '<script>'
```

## 何时切出

切到 **[Runtime Diagnostics](/zh/capabilities/runtime-diagnostics)**：
- 问题出现在最近编辑或热更新之后
- 日志提到 HMR、reload、import 失败或 WebSocket 不稳定
- 页面意外 full-reload

切到 **[Network Regression](/zh/capabilities/network-regression)**：
- 主要症状是数据错了或缺了
- 网络请求出现 4xx、5xx、auth 或 CORS 问题

## 期望输出

1. 已确认的症状
2. 最可能的故障类别（runtime / 网络 / 状态）
3. 证据命令和关键输出
4. 置信度
5. 推荐的下一个能力包
