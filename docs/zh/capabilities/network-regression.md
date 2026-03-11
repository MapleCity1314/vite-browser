# Network Regression

## 这个能力块解决什么问题

当可见问题主要是请求、payload、认证、cookie、CORS 或 UI 数据错误时，用 `network-regression`。

典型问题：

- “数据不对”
- “响应是空的”
- “现在变成 401 了”
- “请求看起来没问题，但页面还是错的”

## 给人看的说明

它能更快地区分：到底是前端请求构造错了，还是后端响应本身有问题。

## 给 AI 的最佳实践

- 只要最强症状是坏数据或缺数据，就优先这个 pack。
- 要看具体失败请求，不要泛泛总结整个 network 列表。
- 把 request 证据和当前 UI 状态、日志一起对照。
- 如果请求失败只在热更新或 reload loop 后出现，就切到 `runtime-diagnostics`。

## 标准序列

```bash
vite-browser open <url>
vite-browser errors --mapped
vite-browser logs
vite-browser network
vite-browser network <idx>
vite-browser eval '<state-probe>'
vite-browser screenshot
```

## 分析清单

对每个可疑请求看：

1. URL 和 method 对不对
2. 状态码和响应体是否符合预期
3. 请求头或请求体是否完整
4. 有没有 CORS、auth 或 cookie 不匹配
5. UI 状态是否和响应一致

## 期望输出

返回：

1. 失败请求的索引和 endpoint
2. 具体不匹配点
3. 更可能归属前端请求构造还是后端响应
4. 置信度
5. 精确重测序列
