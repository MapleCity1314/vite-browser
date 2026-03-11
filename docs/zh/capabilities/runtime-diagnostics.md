# Runtime Diagnostics

## 这个能力块解决什么问题

当最近更新时间和当前故障强相关时，用 `runtime-diagnostics`。

它适合处理：

- HMR 不稳定
- 最近一次编辑后页面坏了
- import 或模块解析失败
- 意外 full reload
- “到底是哪次更新导致的”
- store 或 rerender 的传播线索

## 给人看的说明

如果应用之前还是好的，你改了一点东西，之后 runtime 行为开始混乱，这一页就是主入口。

它最擅长把最近的更新活动变成一个可执行的排查方向。

## 给 AI 的最佳实践

- 只要问题和最近更新强相关，就优先它，而不是先钻组件树。
- 把 `errors --mapped --inline-source` 当成 live failure 的第一读。
- 传播输出只能当高置信度缩小范围，不是严格因果证明。
- 证据链不完整时结论必须保守。

## 标准序列

```bash
vite-browser vite runtime
vite-browser errors --mapped --inline-source
vite-browser correlate errors --mapped --window 5000
vite-browser correlate renders --window 5000
vite-browser diagnose propagation --window 5000
vite-browser diagnose hmr --limit 50
vite-browser vite hmr trace --limit 50
vite-browser vite module-graph --limit 200
vite-browser vite module-graph trace --limit 200
```

## 最常见入口

### 最近更新导致当前错误

```bash
vite-browser correlate errors --mapped --window 5000
```

### store 或 rerender 传播

```bash
vite-browser correlate renders --window 5000
vite-browser diagnose propagation --window 5000
```

### HMR 传输层或 reload 不稳定

```bash
vite-browser diagnose hmr --limit 50
vite-browser vite hmr trace --limit 50
```

## 期望输出

返回：

1. runtime 状态摘要
2. 最可能的 runtime 原因
3. diagnosis 命中和置信度
4. error/HMR 关联结论
5. render/propagation 结论
6. 映射后的源码入口位置
