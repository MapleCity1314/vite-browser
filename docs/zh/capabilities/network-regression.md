# Network Regression

## 什么时候用

当问题主要和**请求、payload、认证或数据错误**相关时，用 `network-regression`：

- _"数据不对"_
- _"响应是空的"_
- _"现在变成 401 了"_
- _"请求看起来没问题，但页面还是错的"_

## 命令序列

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

对每个可疑请求，逐项检查：

1. **URL 和方法** —— 是正确的接口吗？
2. **状态码和响应体** —— 和预期一致吗？
3. **请求头/请求体** —— 完整且正确吗？
4. **CORS / 认证 / cookie** —— 有没有不匹配？
5. **UI 一致性** —— UI 展示的内容和响应对得上吗？

## 何时切换

如果请求失败只在热更新或 reload 之后出现，真正的问题可能是运行时不稳定。切到 [Runtime Diagnostics](/zh/capabilities/runtime-diagnostics)。

## 期望输出

1. 失败请求的索引和 endpoint
2. 具体不匹配描述
3. 更可能是前端请求构造问题还是后端响应问题
4. 置信度
5. 精确的重测序列
