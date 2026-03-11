# Runtime Diagnostics

## 什么时候用

当问题和**时间与最近更新**强相关时，用 `runtime-diagnostics`：

- 保存文件后 HMR 不稳定
- 一次编辑导致页面崩溃
- import 或模块解析失败
- 意外 full-reload
- _"到底是哪次更新导致的？"_
- store 或 rerender 传播线索

## 命令序列

```bash
vite-browser vite runtime
vite-browser errors --mapped --inline-source
vite-browser correlate errors --mapped --window 5000
vite-browser correlate renders --window 5000
vite-browser diagnose propagation --window 5000
vite-browser diagnose hmr --limit 50
vite-browser vite hmr trace --limit 50
vite-browser vite module-graph trace --limit 200
```

## 入口选择

### 最近更新导致了当前错误

当错误刚好出现在保存文件之后：

```bash
vite-browser correlate errors --mapped --window 5000
```

### Store 或渲染传播

当 store 变化似乎导致了下游组件崩溃：

```bash
vite-browser correlate renders --window 5000
vite-browser diagnose propagation --window 5000
```

### HMR 连接或 reload 不稳定

当问题出在 HMR 连接本身：

```bash
vite-browser diagnose hmr --limit 50
vite-browser vite hmr trace --limit 50
```

## 置信度说明

传播输出（`correlate renders`、`diagnose propagation`）提供**高置信度的范围缩小**，不是严格的因果证明。当证据链不完整时，输出会有意保持保守。

## 期望输出

1. 运行时状态摘要
2. 最可能的运行时原因
3. 诊断命中和置信度
4. 错误 / HMR 关联结论
5. 渲染 / 传播结论
6. 映射后的源码入口
