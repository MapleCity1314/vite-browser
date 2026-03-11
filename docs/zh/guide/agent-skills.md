# Agent Skills

## 为什么文档现在先讲 Skill

`vite-browser` 现在推荐的使用方式，不再是“先背 CLI 命令，再手动组合”。

主路径应该是：

1. 先安装或接入 `vite-browser` skill router
2. 让 agent 根据问题类型路由到对应 skill pack
3. 只有在你需要更细粒度控制时，才直接落到原始 CLI

这样更符合真实 coding agent 的工作方式，因为第一个关键决策已经被编码进 router 里了：

- 症状还很泛 -> `core-debug`
- 最近编辑或 HMR 后坏了 -> `runtime-diagnostics`
- 数据错了或请求失败 -> `network-regression`
- 发版前做最终验证 -> `release-smoke`

## 安装 Skill Router

对支持打包 skill 安装的工具，直接执行：

```bash
npx skills add MapleCity1314/vite-browser
```

它会提供 router skill 以及它预期的 skill pack 布局。

## 会接入哪些 Skill

router 在这里：

```text
skills/SKILL.md
```

它会路由到四个 pack：

```text
skills/vite-browser-core-debug/SKILL.md
skills/vite-browser-runtime-diagnostics/SKILL.md
skills/vite-browser-network-regression/SKILL.md
skills/vite-browser-release-smoke/SKILL.md
```

## 推荐的 Agent 流程

当用户说这些话时：

- “热更新后页面坏了”
- “最近哪次更新导致了这个错误”
- “UI 数据不对”
- “发版前帮我做一次 smoke check”

agent 应该先从 router skill 开始，而不是临时拼一套随意的排查流程。

## 什么时候直接用 CLI

CLI 仍然重要，但它现在是底层接口。

这些情况可以直接用它：

- 你只想人工检查某一个信号
- 你在验证单条命令输出
- 你的环境还不支持 skill 安装，需要先用纯终端方式跑通

下一步看：[AI IDE 配置](/zh/guide/ide-setup)
