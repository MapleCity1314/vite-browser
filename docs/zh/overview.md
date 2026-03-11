# 总览

## 安装

主安装路径只有一个 skill 命令：

```bash
npx skills add MapleCity1314/vite-browser
```

它会安装 router skill 以及 router 会路由到的各个能力块。

底层真正执行的是 `vite-browser` CLI，但推荐的产品入口是 skill router，而不是手写命令序列。

## vite-browser 做什么

`vite-browser` 是一套面向 Vite 应用的 skill-first 运行时诊断表面。

它主要帮你：

- 把当前错误和最近 HMR 活动连起来
- 检查框架运行时状态
- 把 runtime 故障和 network/data 故障分开
- 在 merge 或 release 之前产出 smoke 检查证据

## 能力地图

### Core Debug

当应用坏了，但主故障类型还很泛时使用。

### Runtime Diagnostics

当问题和最近编辑、热更新、reload、import 失败或 rerender 传播强相关时使用。

### Network Regression

当症状是数据错误、请求失败、认证异常或响应不匹配时使用。

### Release Smoke

当你需要在 merge 或 release 前做一轮结构化 go/no-go 检查时使用。

## 给 AI 的最佳实践

- 从 router 开始，而不是一上来把所有 packs 都跑一遍。
- 面对 live failure，优先读取 `errors --mapped --inline-source`。
- 由最强症状决定应该进入哪个能力块。
- 传播输出只能当高置信度缩小范围，不是严格因果证明。
- 当证据链不完整时，结论必须保守。

## 接下来读什么

- [Core Debug](/zh/capabilities/core-debug)
- [Runtime Diagnostics](/zh/capabilities/runtime-diagnostics)
- [Network Regression](/zh/capabilities/network-regression)
- [Release Smoke](/zh/capabilities/release-smoke)
- [v0.3.3 版本说明](/release-notes-0.3.3)
