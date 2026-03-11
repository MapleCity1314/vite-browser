# Release Smoke

## 这个能力块解决什么问题

发布前或合并前做最终验证时，用 `release-smoke`。

它不是根因分析工作流，而是一套结构化的 go/no-go 检查。

## 给人看的说明

它会检查：

- 应用能不能正常启动
- 关键路径能不能加载
- runtime 状态是否健康
- network 是否有阻塞级失败
- 一次编辑循环后是否暴露明显发布阻塞

## 给 AI 的最佳实践

- 只在 sign-off 阶段用它，不要拿它做第一次诊断。
- 浏览器 runtime failure 和恢复后仍残留的旧错误都应该视为 blocker。
- 如果问题和 store 驱动 UI 相关，要同时跑 correlation 和 propagation。
- 最终必须明确给出 `go` 或 `no-go`，而不是模糊总结。

## 命令模板

```bash
vite-browser open <url>
vite-browser detect
vite-browser errors --mapped --inline-source
vite-browser logs
vite-browser network
vite-browser vite runtime
vite-browser screenshot
```

runtime 健康检查：

```bash
vite-browser correlate errors --mapped --window 5000
vite-browser correlate renders --window 5000
vite-browser diagnose propagation --window 5000
vite-browser diagnose hmr --limit 50
vite-browser vite hmr trace --limit 20
vite-browser vite module-graph trace --limit 50
```

恢复性检查：

```bash
vite-browser reload
vite-browser errors
```

## 期望输出

返回：

1. 每个检查项的 `PASS` 或 `FAIL`
2. 阻塞问题列表
3. diagnosis 命中和置信度
4. 证据命令
5. 最终建议：`go` 或 `no-go`
