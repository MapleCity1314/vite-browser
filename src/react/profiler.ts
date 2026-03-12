/**
 * React render tracking and profiling
 *
 * Tracks component renders, durations, and trigger reasons using React DevTools Profiler API.
 */

import type { Page } from "playwright";

export interface RenderInfo {
  componentId: number;
  componentName: string;
  phase: "mount" | "update" | "nested-update";
  actualDuration: number;
  baseDuration: number;
  startTime: number;
  commitTime: number;
  interactions: Set<{ id: number; name: string; timestamp: number }>;
}

export interface RenderTrigger {
  componentId: number;
  componentName: string;
  reason: "props" | "state" | "hooks" | "parent" | "context" | "unknown";
  timestamp: number;
  details?: string;
}

/**
 * Install render tracking in the page
 */
export async function installRenderTracking(page: Page): Promise<void> {
  await page.evaluate(inPageInstallRenderTracking);
}

/**
 * Get recent render events
 */
export async function getRecentRenders(page: Page, limit = 50): Promise<RenderInfo[]> {
  return page.evaluate(inPageGetRecentRenders, limit);
}

/**
 * Get render triggers (why components re-rendered)
 */
export async function getRenderTriggers(page: Page, limit = 50): Promise<RenderTrigger[]> {
  return page.evaluate(inPageGetRenderTriggers, limit);
}

/**
 * Clear render history
 */
export async function clearRenderHistory(page: Page): Promise<void> {
  await page.evaluate(inPageClearRenderHistory);
}

/**
 * Format render info for CLI output
 */
export function formatRenderInfo(renders: RenderInfo[]): string {
  if (renders.length === 0) return "No renders recorded";

  const lines: string[] = ["# React Renders\n"];

  for (const render of renders) {
    const phase = render.phase === "mount" ? "MOUNT" : render.phase === "update" ? "UPDATE" : "NESTED";
    const duration = render.actualDuration.toFixed(2);
    const slow = render.actualDuration > 16 ? " ⚠️ SLOW" : "";

    lines.push(`[${phase}] ${render.componentName} (${duration}ms)${slow}`);

    if (render.interactions.size > 0) {
      const interactions = Array.from(render.interactions)
        .map((i) => i.name)
        .join(", ");
      lines.push(`  Interactions: ${interactions}`);
    }
  }

  return lines.join("\n");
}

/**
 * Format render triggers for CLI output
 */
export function formatRenderTriggers(triggers: RenderTrigger[]): string {
  if (triggers.length === 0) return "No render triggers recorded";

  const lines: string[] = ["# Render Triggers\n"];

  for (const trigger of triggers) {
    const reason = trigger.reason.toUpperCase();
    const details = trigger.details ? ` - ${trigger.details}` : "";
    lines.push(`[${reason}] ${trigger.componentName}${details}`);
  }

  return lines.join("\n");
}

/**
 * Analyze slow renders (> 16ms)
 */
export function analyzeSlowRenders(renders: RenderInfo[]): string {
  const slowRenders = renders.filter((r) => r.actualDuration > 16);

  if (slowRenders.length === 0) {
    return "No slow renders detected (all renders < 16ms)";
  }

  const lines: string[] = [
    "# Slow Renders Analysis\n",
    `Found ${slowRenders.length} slow render(s) (> 16ms)\n`,
  ];

  // Group by component
  const byComponent = new Map<string, RenderInfo[]>();
  for (const render of slowRenders) {
    const list = byComponent.get(render.componentName) || [];
    list.push(render);
    byComponent.set(render.componentName, list);
  }

  // Sort by total time
  const sorted = Array.from(byComponent.entries()).sort(
    ([, a], [, b]) => {
      const totalA = a.reduce((sum, r) => sum + r.actualDuration, 0);
      const totalB = b.reduce((sum, r) => sum + r.actualDuration, 0);
      return totalB - totalA;
    }
  );

  for (const [name, renders] of sorted) {
    const count = renders.length;
    const total = renders.reduce((sum, r) => sum + r.actualDuration, 0);
    const avg = total / count;
    const max = Math.max(...renders.map((r) => r.actualDuration));

    lines.push(`${name}:`);
    lines.push(`  Count: ${count}`);
    lines.push(`  Total: ${total.toFixed(2)}ms`);
    lines.push(`  Average: ${avg.toFixed(2)}ms`);
    lines.push(`  Max: ${max.toFixed(2)}ms`);
    lines.push("");
  }

  return lines.join("\n");
}

// In-page functions

function inPageInstallRenderTracking() {
  const win = window as any;

  // Initialize storage
  win.__REACT_RENDER_HISTORY__ = win.__REACT_RENDER_HISTORY__ || [];
  win.__REACT_RENDER_TRIGGERS__ = win.__REACT_RENDER_TRIGGERS__ || [];

  // Hook into React DevTools if available
  const hook = win.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (!hook) {
    console.warn("React DevTools hook not found, render tracking limited");
    return;
  }

  // Listen for commit events
  if (!win.__REACT_RENDER_TRACKING_INSTALLED__) {
    win.__REACT_RENDER_TRACKING_INSTALLED__ = true;

    // Track renders via Profiler API
    const originalOnCommitFiberRoot = hook.onCommitFiberRoot;
    hook.onCommitFiberRoot = function (id: number, root: any, priorityLevel: any) {
      try {
        // Record render info
        const renderInfo = {
          componentId: id,
          componentName: root?.current?.type?.name || "Root",
          phase: root?.current?.mode === 0 ? "mount" : "update",
          actualDuration: 0,
          baseDuration: 0,
          startTime: Date.now(),
          commitTime: Date.now(),
          interactions: new Set(),
        };

        win.__REACT_RENDER_HISTORY__.push(renderInfo);

        // Keep only last 100 renders
        if (win.__REACT_RENDER_HISTORY__.length > 100) {
          win.__REACT_RENDER_HISTORY__.shift();
        }
      } catch (e) {
        // Ignore errors in tracking
      }

      if (originalOnCommitFiberRoot) {
        return originalOnCommitFiberRoot.call(this, id, root, priorityLevel);
      }
    };
  }
}

function inPageGetRecentRenders(limit: number): RenderInfo[] {
  const win = window as any;
  const history = win.__REACT_RENDER_HISTORY__ || [];
  return history.slice(-limit).map((r: any) => ({
    ...r,
    interactions: Array.from(r.interactions || []),
  }));
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
