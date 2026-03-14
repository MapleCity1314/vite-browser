/**
 * React commit tracking groundwork.
 *
 * This module records real commit metadata that can be observed from the
 * React DevTools hook without pretending to expose a full Profiler surface.
 */

import type { Page } from "playwright";

export interface RenderInteraction {
  id: number;
  name: string;
  timestamp: number;
}

export interface RenderInfo {
  rendererId: number;
  rootName: string;
  phase: "mount" | "update" | "nested-update";
  actualDuration: number | null;
  baseDuration: number | null;
  startTime: number | null;
  commitTime: number;
  fiberCount: number;
  interactions: RenderInteraction[];
}

export interface RenderTrigger {
  rendererId: number;
  rootName: string;
  reason: "props" | "state" | "hooks" | "parent" | "context" | "unknown";
  timestamp: number;
  details?: string;
}

export async function installRenderTracking(page: Page): Promise<void> {
  await page.evaluate(inPageInstallRenderTracking);
}

export async function getRecentRenders(page: Page, limit = 50): Promise<RenderInfo[]> {
  return page.evaluate(inPageGetRecentRenders, limit);
}

export async function getRenderTriggers(page: Page, limit = 50): Promise<RenderTrigger[]> {
  return page.evaluate(inPageGetRenderTriggers, limit);
}

export async function clearRenderHistory(page: Page): Promise<void> {
  await page.evaluate(inPageClearRenderHistory);
}

export function formatDuration(duration: number | null): string {
  return duration == null ? "n/a" : `${duration.toFixed(2)}ms`;
}

export function formatRenderInfo(renders: RenderInfo[]): string {
  if (renders.length === 0) return "No renders recorded";

  const lines: string[] = ["# React Commits\n"];

  for (const render of renders) {
    const phase = render.phase === "mount" ? "MOUNT" : render.phase === "update" ? "UPDATE" : "NESTED";
    const duration = formatDuration(render.actualDuration);
    const slow = render.actualDuration != null && render.actualDuration > 16 ? " ⚠️ SLOW" : "";

    lines.push(`[${phase}] ${render.rootName} (${duration})${slow}`);
    lines.push(`  Fibers: ${render.fiberCount}`);

    if (render.baseDuration != null) {
      lines.push(`  Base duration: ${render.baseDuration.toFixed(2)}ms`);
    }

    if (render.interactions.length > 0) {
      const interactions = render.interactions.map((i) => i.name).join(", ");
      lines.push(`  Interactions: ${interactions}`);
    }
  }

  return lines.join("\n");
}

export function formatRenderTriggers(triggers: RenderTrigger[]): string {
  if (triggers.length === 0) return "No render triggers recorded";

  const lines: string[] = ["# Render Triggers\n"];

  for (const trigger of triggers) {
    const reason = trigger.reason.toUpperCase();
    const details = trigger.details ? ` - ${trigger.details}` : "";
    lines.push(`[${reason}] ${trigger.rootName}${details}`);
  }

  return lines.join("\n");
}

export function analyzeSlowRenders(renders: RenderInfo[]): string {
  const slowRenders = renders.filter((r) => r.actualDuration != null && r.actualDuration > 16);

  if (slowRenders.length === 0) {
    return "No slow renders detected with measurable duration (> 16ms)";
  }

  const lines: string[] = [
    "# Slow Renders Analysis\n",
    `Found ${slowRenders.length} slow render(s) (> 16ms)\n`,
  ];

  const byRoot = new Map<string, RenderInfo[]>();
  for (const render of slowRenders) {
    const list = byRoot.get(render.rootName) || [];
    list.push(render);
    byRoot.set(render.rootName, list);
  }

  const sorted = Array.from(byRoot.entries()).sort(([, a], [, b]) => {
    const totalA = a.reduce((sum, r) => sum + (r.actualDuration ?? 0), 0);
    const totalB = b.reduce((sum, r) => sum + (r.actualDuration ?? 0), 0);
    return totalB - totalA;
  });

  for (const [name, commits] of sorted) {
    const durations = commits.map((r) => r.actualDuration ?? 0);
    const total = durations.reduce((sum, value) => sum + value, 0);
    const count = commits.length;
    const avg = total / count;
    const max = Math.max(...durations);

    lines.push(`${name}:`);
    lines.push(`  Count: ${count}`);
    lines.push(`  Total: ${total.toFixed(2)}ms`);
    lines.push(`  Average: ${avg.toFixed(2)}ms`);
    lines.push(`  Max: ${max.toFixed(2)}ms`);
    lines.push("");
  }

  return lines.join("\n");
}

function inPageInstallRenderTracking() {
  const win = window as any;

  win.__REACT_RENDER_HISTORY__ = win.__REACT_RENDER_HISTORY__ || [];
  win.__REACT_RENDER_TRIGGERS__ = win.__REACT_RENDER_TRIGGERS__ || [];

  const hook = win.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (!hook) {
    console.warn("React DevTools hook not found, render tracking limited");
    return;
  }

  if (win.__REACT_RENDER_TRACKING_INSTALLED__) return;
  win.__REACT_RENDER_TRACKING_INSTALLED__ = true;

  const originalOnCommitFiberRoot = hook.onCommitFiberRoot;
  hook.onCommitFiberRoot = function (rendererId: number, root: any, priorityLevel: any) {
    try {
      const renderInfo = toRenderInfo(rendererId, root);
      win.__REACT_RENDER_HISTORY__.push(renderInfo);
      if (win.__REACT_RENDER_HISTORY__.length > 100) {
        win.__REACT_RENDER_HISTORY__.shift();
      }
    } catch {
      // Ignore tracking errors to avoid breaking the inspected app.
    }

    if (originalOnCommitFiberRoot) {
      return originalOnCommitFiberRoot.call(this, rendererId, root, priorityLevel);
    }
  };
}

function inPageGetRecentRenders(limit: number): RenderInfo[] {
  const win = window as any;
  const history = win.__REACT_RENDER_HISTORY__ || [];
  return history.slice(-limit);
}

function inPageGetRenderTriggers(limit: number): RenderTrigger[] {
  const win = window as any;
  const triggers = win.__REACT_RENDER_TRIGGERS__ || [];
  return triggers.slice(-limit);
}

function inPageClearRenderHistory() {
  const win = window as any;
  win.__REACT_RENDER_HISTORY__ = [];
  win.__REACT_RENDER_TRIGGERS__ = [];
}

function toRenderInfo(rendererId: number, root: any): RenderInfo {
  const current = root?.current ?? null;
  const rootChild = current?.child ?? null;

  return {
    rendererId,
    rootName: getFiberName(rootChild || current),
    phase: inferPhase(current),
    actualDuration: numberOrNull(current?.actualDuration),
    baseDuration: numberOrNull(current?.treeBaseDuration ?? current?.baseDuration),
    startTime: numberOrNull(current?.actualStartTime),
    commitTime: Date.now(),
    fiberCount: countFibers(current),
    interactions: normalizeInteractions(root?.memoizedInteractions),
  };
}

function inferPhase(current: any): RenderInfo["phase"] {
  if (!current?.alternate) return "mount";
  return current.flags && (current.flags & 1024) !== 0 ? "nested-update" : "update";
}

function getFiberName(fiber: any): string {
  if (!fiber) return "Root";
  if (typeof fiber.type === "string") return fiber.type;
  if (fiber.type?.displayName) return fiber.type.displayName;
  if (fiber.type?.name) return fiber.type.name;
  if (fiber.elementType?.displayName) return fiber.elementType.displayName;
  if (fiber.elementType?.name) return fiber.elementType.name;
  return "Anonymous";
}

function countFibers(fiber: any): number {
  let count = 0;
  const stack = fiber ? [fiber] : [];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;
    count++;
    if (current.sibling) stack.push(current.sibling);
    if (current.child) stack.push(current.child);
  }

  return count;
}

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalizeInteractions(interactions: unknown): RenderInteraction[] {
  if (!(interactions instanceof Set)) return [];

  return Array.from(interactions)
    .map((interaction: any) => ({
      id: typeof interaction?.id === "number" ? interaction.id : 0,
      name: typeof interaction?.name === "string" ? interaction.name : "interaction",
      timestamp: typeof interaction?.timestamp === "number" ? interaction.timestamp : 0,
    }))
    .filter((interaction) => interaction.name.length > 0);
}
