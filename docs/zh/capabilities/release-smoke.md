# Release Smoke

## 什么时候用

在**合并或发布前做最终验证**时，用 `release-smoke`。这是结构化的 go/no-go 检查 —— 不是根因分析工作流。

## 检查内容

- 应用能不能正常启动？
- 关键路径能不能加载？
- 运行时状态是否健康？
- 有没有阻塞级的网络故障？
- 一次编辑循环后有没有暴露明显的发布阻塞？

## 命令序列

**基础检查：**

```bash
vite-browser open <url>
vite-browser detect
vite-browser errors --mapped --inline-source
vite-browser logs
vite-browser network
vite-browser vite runtime
vite-browser screenshot
```

**运行时健康度：**

```bash
vite-browser correlate errors --mapped --window 5000
vite-browser correlate renders --window 5000
vite-browser diagnose propagation --window 5000
vite-browser diagnose hmr --limit 50
vite-browser vite hmr trace --limit 20
vite-browser vite module-graph trace --limit 50
```

**恢复性检查：**

```bash
vite-browser reload
vite-browser errors
```

## 期望输出

1. 每个检查项的 `PASS` 或 `FAIL`
2. 阻塞问题列表
3. 诊断命中和置信度
4. 证据命令
5. 最终建议：**go** 或 **no-go**
