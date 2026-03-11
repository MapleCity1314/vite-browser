# 关于

## 为什么做 vite-browser

大多数浏览器工具聚焦于自动化，大多数 DevTools 聚焦于图形化检查。但两者都没有提供从终端就能查询的、结构化的运行时诊断能力。

`vite-browser` 填补了这个空缺：它将 Vite 运行时行为 —— HMR 追踪、模块图变化、框架组件状态、映射错误和网络活动 —— 转化为结构化的 CLI 输出，开发者和 AI 编码助手都能直接使用。

## 设计原则

**零侵入。** 不需要安装插件，不需要修改项目配置。对着正在运行的 Vite dev server 直接查询。

**证据优先。** 每条诊断命令都会产出带有置信度等级的结构化输出。当证据不足时，工具宁可少说，也不会编造一个站不住的解释。

**终端原生。** 每条命令都是对长期运行的浏览器守护进程发起的无状态请求。不依赖 GUI，不需要每一步都管理浏览器生命周期。

**技能路由。** 不是一次性把所有命令都丢出来，而是让 skill 路由器根据症状选择正确的调试工作流。这对 AI 编码助手特别重要 —— 聚焦的工具集比全量命令清单更有效。

## 适合谁用

- **开发者**：在终端里调试热更新故障、store 驱动的渲染异常或网络回归。
- **AI 编码助手**（Claude Code、Codex、Cursor）：需要机器可读的运行时信号来逐步诊断 Vite 应用故障。
- **团队**：需要一套轻量、可重复的运行时诊断层，跨 Vue、React、Svelte 使用，无需项目级别的配置。

## 当前能力范围

`v0.3.3` 在以下方面表现可靠：

- 将运行时状态以结构化终端输出的形式呈现
- 将当前错误与最近的 HMR 和模块活动关联
- 检测常见 HMR 故障模式并标注置信度
- 在 Vue + Pinia 工作流中缩小 `store → render → error` 可能路径
- 即使 Vite 错误覆盖层不可用，也能捕获浏览器侧的运行时错误

`correlate renders` 和 `diagnose propagation` 是**高置信度缩小范围的工具**，不是严格因果证明引擎。当证据不完整时，输出会有意保持保守。

React store 检查（Zustand、Redux）和更深层的跨框架传播追踪在路线图中。

## 链接

- [GitHub 仓库](https://github.com/MapleCity1314/vite-browser)
- [npm 包](https://www.npmjs.com/package/@presto1314w/vite-devtools-browser)
- [快速开始](/zh/guide/getting-started)
- [版本说明](/release-notes-0.3.3)
