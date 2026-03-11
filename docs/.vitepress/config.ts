import { defineConfig } from "vitepress";

const repoLink = "https://github.com/MapleCity1314/vite-browser";

const versionItems = [
  { text: "v0.3.3", link: "/release-notes-0.3.3" },
  { text: "v0.3.2", link: "/release-notes-0.3.2" },
  { text: "v0.3.1", link: "/release-notes-0.3.1" },
  { text: "v0.3.0", link: "/release-notes-0.3.0" },
  { text: "v0.2.2", link: "/release-notes-0.2.2" },
  { text: "Release Gate v0.3", link: "/release-gate-0.3" },
];

const capabilityItems = [
  { text: "Core Debug", link: "/capabilities/core-debug" },
  { text: "Runtime Diagnostics", link: "/capabilities/runtime-diagnostics" },
  { text: "Network Regression", link: "/capabilities/network-regression" },
  { text: "Release Smoke", link: "/capabilities/release-smoke" },
];

const zhCapabilityItems = [
  { text: "Core Debug", link: "/zh/capabilities/core-debug" },
  { text: "Runtime Diagnostics", link: "/zh/capabilities/runtime-diagnostics" },
  { text: "Network Regression", link: "/zh/capabilities/network-regression" },
  { text: "Release Smoke", link: "/zh/capabilities/release-smoke" },
];

const englishThemeConfig = {
  nav: [
    { text: "Capabilities", items: capabilityItems },
    { text: "Versions", items: versionItems },
    { text: "GitHub", link: repoLink },
  ],
  search: { provider: "local" },
  socialLinks: [{ icon: "github", link: repoLink }],
  footer: {
    message: "MIT Licensed",
    copyright: "Copyright 2026 vite-browser contributors",
  },
  sidebar: [
    {
      text: "Home",
      items: [
        { text: "Home", link: "/" },
        { text: "Overview", link: "/overview" },
      ],
    },
    {
      text: "Capabilities",
      items: capabilityItems,
    },
    {
      text: "Versions",
      items: versionItems,
    },
  ],
};

const chineseThemeConfig = {
  nav: [
    { text: "能力块", items: zhCapabilityItems },
    {
      text: "版本文档",
      items: [
        { text: "v0.3.3", link: "/release-notes-0.3.3" },
        { text: "v0.3.2", link: "/release-notes-0.3.2" },
        { text: "v0.3.1", link: "/release-notes-0.3.1" },
        { text: "v0.3.0", link: "/release-notes-0.3.0" },
        { text: "v0.2.2", link: "/release-notes-0.2.2" },
        { text: "Release Gate v0.3", link: "/release-gate-0.3" },
      ],
    },
    { text: "GitHub", link: repoLink },
  ],
  search: { provider: "local" },
  socialLinks: [{ icon: "github", link: repoLink }],
  footer: {
    message: "MIT 协议",
    copyright: "Copyright 2026 vite-browser contributors",
  },
  sidebar: [
    {
      text: "首页",
      items: [
        { text: "首页", link: "/zh/" },
        { text: "总览", link: "/zh/overview" },
      ],
    },
    {
      text: "能力块",
      items: zhCapabilityItems,
    },
    {
      text: "版本文档",
      items: [
        { text: "v0.3.3", link: "/release-notes-0.3.3" },
        { text: "v0.3.2", link: "/release-notes-0.3.2" },
        { text: "v0.3.1", link: "/release-notes-0.3.1" },
        { text: "v0.3.0", link: "/release-notes-0.3.0" },
        { text: "v0.2.2", link: "/release-notes-0.2.2" },
        { text: "Release Gate v0.3", link: "/release-gate-0.3" },
      ],
    },
  ],
};

export default defineConfig({
  title: "vite-browser",
  description:
    "Skill-first runtime diagnostics for Vite apps, built for humans and AI agents.",
  base: "/vite-browser/",
  cleanUrls: true,
  lastUpdated: true,
  locales: {
    root: {
      label: "English",
      lang: "en-US",
      title: "vite-browser",
      description:
        "Skill-first runtime diagnostics for Vite apps, built for humans and AI agents.",
      themeConfig: englishThemeConfig,
    },
    zh: {
      label: "简体中文",
      lang: "zh-CN",
      link: "/zh/",
      title: "vite-browser",
      description:
        "面向人和 AI 的 Vite 运行时诊断文档，强调以 skill 为主的工作方式。",
      themeConfig: chineseThemeConfig,
    },
  },
  head: [
    ["meta", { name: "theme-color", content: "#0f4c5c" }],
    ["meta", { property: "og:title", content: "vite-browser" }],
    [
      "meta",
      {
        property: "og:description",
        content:
          "Skill-first runtime diagnostics for Vite apps, with routed capability packs and release docs.",
      },
    ],
  ],
});
