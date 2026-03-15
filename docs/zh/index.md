---
layout: home

hero:
  name: vite-browser
  text: 不只定位哪里坏了，还要搞清楚为什么坏了。
  tagline: Vite 应用的运行时诊断工具。连接正在运行的 dev server，从终端查询 HMR 追踪、错误关联、组件状态 —— 开发者和 AI 编码助手都能直接用。
  actions:
    - theme: brand
      text: 快速开始
      link: /zh/guide/getting-started
    - theme: alt
      text: 为什么用 Agent Skills？
      link: /zh/guide/agent-skills
    - theme: alt
      text: GitHub
      link: https://github.com/MapleCity1314/vite-browser

features:
  - title: 零配置接入
    details: 对着任何正在运行的 Vite dev server 直接工作。不装插件、不改配置、不侵入项目。Vue、React、Svelte 开箱即用。
  - title: 技能路由调试
    details: 作为 Agent Skill 安装后，AI 编码工具会自动选择正确的调试工作流 —— HMR 排查、网络回归还是发布前检查。
  - title: 从「页面坏了」到「原因在这」
    details: 将当前错误和最近的 HMR 更新关联起来，追踪 store → render → error 传播路径，用结构化证据取代猜测。
---

<div class="vb-home-shell">
  <div class="vb-home-band">
    <p class="vb-home-caption">调试的痛点</p>
    <p class="vb-home-lead">
      你保存了一个文件，Vite 热更新，页面坏了。错误覆盖层告诉你<em>什么</em>出错了 ——
      但没说<em>哪次更新导致了它</em>，变化是怎么沿组件树传播的，
      真正的根因到底是过期的 store、一个坏掉的 import，还是接口回归。
      <code>vite-browser</code> 就是来补上这个缺口的。
    </p>
    <div class="vb-home-statbar">
      <div class="vb-home-stat">
        <strong>零插件</strong>
        <span>连接任何正在运行的 Vite dev server，即装即用。</span>
      </div>
      <div class="vb-home-stat">
        <strong>Agent 原生</strong>
        <span>每条命令返回结构化输出，AI 编码工具可以直接推理使用。</span>
      </div>
      <div class="vb-home-stat">
        <strong>技能路由</strong>
        <span>根据当前症状自动选择正确的调试工作流。</span>
      </div>
    </div>
  </div>

  <div class="vb-home-grid">
    <div class="vb-home-card">
      <h3>追踪热更新故障</h3>
      <p>
        将当前错误和最近的热模块更新关联起来。获取基于规则的诊断结果（如
        <code>missing-module</code> 或 <code>hmr-websocket-closed</code>），快速缩小问题范围。
      </p>
    </div>
    <div class="vb-home-card">
      <h3>检查框架状态</h3>
      <p>
        查询 Vue 组件树、Pinia 状态、React 组件树、Zustand store、hook 诊断、commit 追踪、Svelte 状态 ——
        同时查看控制台日志、网络请求和源码映射后的错误 —— 全在一个终端里完成。
      </p>
    </div>
    <div class="vb-home-card">
      <h3>诊断传播路径</h3>
      <p>
        当一个 store 更新导致下游组件崩溃时，追踪
        <code>store → render → error</code> 路径，用高置信度证据取代手动逐步检查 DevTools。
      </p>
    </div>
  </div>

  <div class="vb-home-terminal">
    <p class="vb-home-terminal-title">一个典型的调试过程</p>
    <pre><code>vite-browser open http://localhost:5173
vite-browser errors --mapped --inline-source
vite-browser correlate errors --mapped --window 5000
vite-browser diagnose propagation --window 5000</code></pre>
  </div>

  <div class="vb-home-grid">
    <div class="vb-home-card">
      <h3>从这里开始</h3>
      <ul>
        <li><a href="/zh/guide/getting-started">快速开始</a></li>
        <li><a href="/zh/guide/agent-skills">Agent Skills</a></li>
        <li><a href="/zh/guide/ide-setup">AI IDE 配置</a></li>
      </ul>
    </div>
    <div class="vb-home-card">
      <h3>深入了解</h3>
      <ul>
        <li><a href="/zh/capabilities/runtime-diagnostics">Runtime Diagnostics</a></li>
        <li><a href="/zh/reference/signals">信号与置信度</a></li>
        <li><a href="/zh/reference/cli">CLI 参考</a></li>
      </ul>
    </div>
    <div class="vb-home-card">
      <h3>最新动态</h3>
      <ul>
        <li><a href="/release-notes-0.3.6">v0.3.6 发布说明</a></li>
        <li><a href="/release-gate-0.3">v0.3 传播能力详情</a></li>
        <li><a href="/zh/releases">版本总览</a></li>
      </ul>
    </div>
  </div>
</div>
