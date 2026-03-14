---
layout: home

hero:
  name: vite-browser
  text: Know why your Vite app broke — not just where.
  tagline: Runtime diagnostics for Vite, from the terminal. Connect to a running dev server, query HMR traces, mapped errors, and component state as structured output — built for developers and AI agents alike.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: Why Agent Skills?
      link: /guide/agent-skills
    - theme: alt
      text: GitHub
      link: https://github.com/MapleCity1314/vite-browser

features:
  - title: Zero-Config Inspection
    details: Point at any running Vite dev server. No plugins, no config changes, no project modifications. Works with Vue, React, and Svelte out of the box.
  - title: Skill-Routed Debugging
    details: Install as an Agent Skill and let your AI coding tool pick the right debugging workflow automatically — HMR triage, network regression, or release smoke.
  - title: From "It Broke" to "Here's Why"
    details: Correlate errors with recent HMR updates, trace store-to-render propagation paths, and get structured evidence instead of guesswork.
---

<div class="vb-home-shell">
  <div class="vb-home-band">
    <p class="vb-home-caption">The debugging gap</p>
    <p class="vb-home-lead">
      You save a file. Vite hot-updates. The page breaks. The error overlay tells you
      <em>what</em> failed — but not <em>which update caused it</em>, how the change
      propagated through your component tree, or whether the real problem is a stale store,
      a broken import, or a network regression. <code>vite-browser</code> fills that gap.
    </p>
    <div class="vb-home-statbar">
      <div class="vb-home-stat">
        <strong>0 Plugins</strong>
        <span>Connects to any running Vite dev server with zero setup.</span>
      </div>
      <div class="vb-home-stat">
        <strong>Agent-Native</strong>
        <span>Every command returns structured output that AI coding tools can reason about.</span>
      </div>
      <div class="vb-home-stat">
        <strong>Skill Router</strong>
        <span>Automatically picks the right debugging workflow for the current symptom.</span>
      </div>
    </div>
  </div>

  <div class="vb-home-grid">
    <div class="vb-home-card">
      <h3>Trace HMR breakage</h3>
      <p>
        Correlate the current error with recent hot-module updates. Get rule-based
        diagnoses like <code>missing-module</code> or <code>hmr-websocket-closed</code>
        to narrow the problem fast.
      </p>
    </div>
    <div class="vb-home-card">
      <h3>Inspect framework state</h3>
      <p>
        Query Vue component trees, Pinia stores, React props and hooks, or Svelte state —
        alongside console logs, network traces, and source-mapped errors — all from one terminal.
      </p>
    </div>
    <div class="vb-home-card">
      <h3>Diagnose propagation</h3>
      <p>
        When a store update breaks a downstream component, trace the
        <code>store → render → error</code> path with high-confidence evidence
        instead of manually stepping through DevTools.
      </p>
    </div>
  </div>

  <div class="vb-home-terminal">
    <p class="vb-home-terminal-title">A typical debugging session</p>
    <pre><code>vite-browser open http://localhost:5173
vite-browser errors --mapped --inline-source
vite-browser correlate errors --mapped --window 5000
vite-browser diagnose propagation --window 5000</code></pre>
  </div>

  <div class="vb-home-grid">
    <div class="vb-home-card">
      <h3>Start here</h3>
      <ul>
        <li><a href="/guide/getting-started">Getting Started</a></li>
        <li><a href="/guide/agent-skills">Agent Skills</a></li>
        <li><a href="/guide/ide-setup">AI IDE Setup</a></li>
      </ul>
    </div>
    <div class="vb-home-card">
      <h3>Go deeper</h3>
      <ul>
        <li><a href="/capabilities/runtime-diagnostics">Runtime Diagnostics</a></li>
        <li><a href="/reference/signals">Signals & Confidence</a></li>
        <li><a href="/reference/cli">CLI Reference</a></li>
      </ul>
    </div>
    <div class="vb-home-card">
      <h3>What's new</h3>
      <ul>
        <li><a href="/release-notes-0.3.6">v0.3.6 Release Notes</a></li>
        <li><a href="/release-gate-0.3">v0.3 Propagation Details</a></li>
        <li><a href="/releases">All Releases</a></li>
      </ul>
    </div>
  </div>
</div>
