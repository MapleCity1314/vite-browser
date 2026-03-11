# Core Debug

## 这个能力块解决什么问题

当应用坏了，但你还说不清主要是 runtime、network 还是组件状态问题时，用 `core-debug`。

它是最宽的一层首轮排查，主要回答：

- 这是不是 runtime/HMR 问题
- 这是不是 network/data 问题
- 还是更像框架/组件状态问题

## 给人看的说明

它最适合处理这种模糊问题：

- “页面坏了”
- “组件状态不对”
- “改了点东西之后 UI 很怪”

它不负责证明根因，只负责把问题先分到正确类别。

## 给 AI 的最佳实践

- 只有在失败类型还很泛时才从这里开始。
- 先跑错误与 runtime 的入口命令，再决定要不要看组件树。
- 一旦证据明显指向 runtime 或 network，就立刻切出去。
- 不要在主故障类型已经明确后还继续停留在 `core-debug`。

## 标准序列

```bash
vite-browser open <url>
vite-browser detect
vite-browser vite runtime
vite-browser errors --mapped --inline-source
vite-browser logs
```

然后分支：

- Vue：`vue tree`、`vue pinia`、`vue router`
- React：`react tree`
- Svelte：`svelte tree`

需要时交叉验证：

```bash
vite-browser network
vite-browser screenshot
vite-browser eval '<script>'
```

## 路由规则

切到 `runtime-diagnostics`：

- 问题出现在最近编辑或热更新之后
- 日志提到了 HMR、reload、import 失败或 websocket 不稳定
- 页面意外刷新或 full reload

切到 `network-regression`：

- 主要症状是数据不对、缺数据或请求失败
- network 里出现 4xx、5xx、`FAIL`、auth 或 CORS 问题

## 期望输出

返回：

1. 已确认的症状
2. 最可能的故障类别
3. 证据命令和关键输出
4. 置信度
5. 最小下一步或下一能力块
