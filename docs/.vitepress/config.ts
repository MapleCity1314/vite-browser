import { defineConfig } from "vitepress";

const repoLink = "https://github.com/MapleCity1314/vite-browser";

const versionItems = [
  { text: "Latest release", link: "/release-notes-0.3.3" },
  { text: "Release archive", link: "/releases" },
  { text: "Release Gate v0.3", link: "/release-gate-0.3" },
  { text: "v0.3.2", link: "/release-notes-0.3.2" },
  { text: "v0.3.1", link: "/release-notes-0.3.1" },
  { text: "v0.3.0", link: "/release-notes-0.3.0" },
  { text: "v0.2.2", link: "/release-notes-0.2.2" },
];

const capabilityItems = [
  { text: "Core Debug", link: "/capabilities/core-debug" },
  { text: "Runtime Diagnostics", link: "/capabilities/runtime-diagnostics" },
  { text: "Network Regression", link: "/capabilities/network-regression" },
  { text: "Release Smoke", link: "/capabilities/release-smoke" },
];

const guideItems = [
  { text: "Getting Started", link: "/guide/getting-started" },
  { text: "Concepts", link: "/guide/concepts" },
  { text: "AI IDE Setup", link: "/guide/ide-setup" },
  { text: "Agent Skills", link: "/guide/agent-skills" },
  { text: "Workflows", link: "/guide/workflows" },
];

const referenceItems = [
  { text: "CLI", link: "/reference/cli" },
  { text: "Signals", link: "/reference/signals" },
  { text: "Skill Packs", link: "/reference/skill-packs" },
];

const zhGuideItems = [
  { text: "快速开始", link: "/zh/guide/getting-started" },
  { text: "核心概念", link: "/zh/guide/concepts" },
  { text: "AI IDE 配置", link: "/zh/guide/ide-setup" },
  { text: "Agent Skills", link: "/zh/guide/agent-skills" },
  { text: "工作流", link: "/zh/guide/workflows" },
];

const zhCapabilityItems = [
  { text: "Core Debug", link: "/zh/capabilities/core-debug" },
  { text: "Runtime Diagnostics", link: "/zh/capabilities/runtime-diagnostics" },
  { text: "Network Regression", link: "/zh/capabilities/network-regression" },
  { text: "Release Smoke", link: "/zh/capabilities/release-smoke" },
];

const zhReferenceItems = [
  { text: "CLI", link: "/zh/reference/cli" },
  { text: "Signals", link: "/zh/reference/signals" },
  { text: "Skill Packs", link: "/zh/reference/skill-packs" },
];

const englishThemeConfig = {
  nav: [
    { text: "Guide", items: guideItems },
    { text: "Capabilities", items: capabilityItems },
    { text: "Reference", items: referenceItems },
    { text: "Versions", items: versionItems },
    { text: "GitHub", link: repoLink },
  ],
  search: { provider: "local" },
  socialLinks: [{ icon: "github", link: repoLink }],
  outline: {
    label: "On this page",
  },
  editLink: {
    pattern: `${repoLink}/edit/master/docs/:path`,
    text: "Edit this page on GitHub",
  },
  footer: {
    message: "MIT Licensed",
    copyright: "Copyright 2026 vite-browser contributors",
  },
  sidebar: [
    {
      text: "Start",
      items: [
        { text: "Home", link: "/" },
        { text: "Overview", link: "/overview" },
        { text: "About", link: "/launch-kit" },
      ],
    },
    {
      text: "Guide",
      items: guideItems,
    },
    {
      text: "Capabilities",
      items: capabilityItems,
    },
    {
      text: "Reference",
      items: referenceItems,
    },
    {
      text: "Versions",
      items: [
        { text: "Latest release", link: "/release-notes-0.3.3" },
        { text: "Release Gate v0.3", link: "/release-gate-0.3" },
        { text: "v0.3.2", link: "/release-notes-0.3.2" },
        { text: "v0.3.1", link: "/release-notes-0.3.1" },
        { text: "v0.3.0", link: "/release-notes-0.3.0" },
        { text: "v0.2.2", link: "/release-notes-0.2.2" },
      ],
    },
  ],
};

const chineseThemeConfig = {
  nav: [
    { text: "指南", items: zhGuideItems },
    { text: "能力", items: zhCapabilityItems },
    { text: "参考", items: zhReferenceItems },
    {
      text: "版本",
      items: [
        { text: "版本总览", link: "/zh/releases" },
        { text: "最新发布", link: "/release-notes-0.3.3" },
        { text: "Release Gate v0.3", link: "/release-gate-0.3" },
      ],
    },
    { text: "GitHub", link: repoLink },
  ],
  search: { provider: "local" },
  socialLinks: [{ icon: "github", link: repoLink }],
  outline: {
    label: "本页内容",
  },
  editLink: {
    pattern: `${repoLink}/edit/master/docs/:path`,
    text: "在 GitHub 上编辑此页",
  },
  footer: {
    message: "MIT 协议",
    copyright: "Copyright 2026 vite-browser contributors",
  },
  sidebar: [
    {
      text: "开始",
      items: [
        { text: "首页", link: "/zh/" },
        { text: "概览", link: "/zh/overview" },
        { text: "关于", link: "/zh/launch-kit" },
      ],
    },
    {
      text: "指南",
      items: zhGuideItems,
    },
    {
      text: "能力",
      items: zhCapabilityItems,
    },
    {
      text: "参考",
      items: zhReferenceItems,
    },
    {
      text: "版本",
      items: [
        { text: "版本总览", link: "/zh/releases" },
        { text: "最新发布", link: "/release-notes-0.3.3" },
        { text: "Release Gate v0.3", link: "/release-gate-0.3" },
      ],
    },
  ],
};

export default defineConfig({
  title: "vite-browser",
  description:
    "Know why your Vite app broke — not just where. Runtime diagnostics for developers and AI agents.",
  base: "/vite-browser/",
  cleanUrls: true,
  lastUpdated: true,
  head: [
    ["meta", { name: "theme-color", content: "#000000" }],
    ["meta", { property: "og:title", content: "vite-browser" }],
    [
      "meta",
      {
        property: "og:description",
        content:
          "Know why your Vite app broke — not just where. Structured HMR traces, error correlation, and propagation diagnosis from the terminal.",
      },
    ],
  ],
  locales: {
    root: {
      label: "English",
      lang: "en-US",
      title: "vite-browser",
      description:
        "Know why your Vite app broke — not just where. Runtime diagnostics for developers and AI agents.",
      themeConfig: englishThemeConfig,
    },
    zh: {
      label: "简体中文",
      lang: "zh-CN",
      link: "/zh/",
      title: "vite-browser",
      description:
        "Vite 应用运行时诊断工具 —— 从终端定位热更新故障、错误关联和传播路径。",
      themeConfig: chineseThemeConfig,
    },
  },
});
