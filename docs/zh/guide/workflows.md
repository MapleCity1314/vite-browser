# 排查工作流

## HMR Runtime Triage

当你遇到“保存文件之后页面坏了”、“覆盖层不对劲”或“组件重渲染后结果异常”时，先走这条路径。

```bash
vite-browser vite runtime
vite-browser vite hmr trace --limit 50
vite-browser errors --mapped --inline-source
vite-browser correlate errors --mapped --window 5000
vite-browser diagnose hmr --limit 50
```

这组命令主要回答三个问题：

- HMR 有没有正常触发
- 最近更新的是哪个模块
- 当前错误是否和这次更新时间窗高度相关

## Propagation Rerender Triage

当你怀疑是 store 更新或状态传播一路带坏了下游组件时，走这条路径。

```bash
vite-browser correlate renders --window 5000
vite-browser diagnose propagation --window 5000
vite-browser vue pinia
vite-browser vue tree
```

这一条在 Vue + Pinia 的真实复现里最强，适合这种问题模型：

```text
changed store module -> rerender -> broken component
```

## Network And Runtime Triage

当你怀疑真正的问题来自接口、浏览器异常或客户端状态错误，而不是 HMR 本身时，走这条路径。

```bash
vite-browser errors --mapped
vite-browser logs
vite-browser network
vite-browser network 0
vite-browser eval '<state probe>'
```

## Agent Loop Pattern

如果是给 Agent 用，尽量先保持循环短、输出好比较：

```bash
vite-browser vite runtime
vite-browser errors --mapped
vite-browser correlate errors --mapped --window 5000
vite-browser diagnose hmr --limit 50
```

只有当上一步真的提示需要时，再展开到 `correlate renders`、`network` 或框架专用命令。

## Session Hygiene

- reload 或导航后重新跑一次 `errors`，避免拿旧状态做判断
- 复现稳定时先用短时间窗，比如 `5000` ms
- 不要一上来就把所有命令都跑完，先看当前最强的信号是什么
