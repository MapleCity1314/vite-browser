# 排查工作流

常见 Vite 故障场景的调试方法。

## HMR 排查

**场景：** 保存文件后页面坏了、错误覆盖层不对、或组件重渲染结果异常。

```bash
vite-browser vite runtime
vite-browser vite hmr trace --limit 50
vite-browser errors --mapped --inline-source
vite-browser correlate errors --mapped --window 5000
vite-browser diagnose hmr --limit 50
```

**要回答的问题：**
- HMR 有没有正常触发？
- 最近更新的是哪个模块？
- 当前错误和这次更新在时间窗口上吻合吗？

## 传播路径排查

**场景：** store 更新或状态变化似乎导致了下游组件的渲染异常。

```bash
vite-browser correlate renders --window 5000
vite-browser diagnose propagation --window 5000
vite-browser vue pinia
vite-browser vue tree
```

**最适合：** Vue + Pinia 工作流中 `store 变化 → 重渲染 → 组件崩溃` 这类问题。

## 网络排查

**场景：** 问题来自数据错误、请求失败或客户端状态丢失，而不是 HMR。

```bash
vite-browser errors --mapped
vite-browser logs
vite-browser network
vite-browser network 0
vite-browser eval '<state probe>'
```

**提示：** 如果网络故障只在热更新或 reload 之后出现，应该切到 [Runtime Diagnostics](/zh/capabilities/runtime-diagnostics)。

## Agent 循环

**场景：** AI 编码助手驱动调试会话。保持循环短、输出可对比：

```bash
vite-browser vite runtime
vite-browser errors --mapped
vite-browser correlate errors --mapped --window 5000
vite-browser diagnose hmr --limit 50
```

只有当上一步的结果明确指向需要时，才展开到 `correlate renders`、`network` 或框架专用命令。

## 实用建议

- **导航后重新查询。** reload 或导航之后，重新执行 `errors` 避免拿旧状态做判断。
- **从短时间窗开始。** 用 `--window 5000` 对应紧凑的复现步骤，只有在需要时才放宽。
- **跟着最强信号走。** 不要每次把所有命令都跑一遍 —— 让最明显的证据决定下一步。
