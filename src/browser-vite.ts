import type { Page } from "playwright";
import type { HmrEvent } from "./browser-session.js";

export type RuntimeSnapshot = {
  url: string;
  hasViteClient: boolean;
  wsState: string;
  hasErrorOverlay: boolean;
  timestamp: number;
};

export type ModuleRow = { url: string; initiator: string; durationMs: number };

export function normalizeLimit(limit: number, fallback: number, max: number): number {
  if (!Number.isFinite(limit) || limit <= 0) return fallback;
  return Math.min(limit, max);
}

export function formatRuntimeStatus(
  runtime: RuntimeSnapshot,
  currentFramework: string,
  events: HmrEvent[],
): string {
  const output: string[] = [];
  output.push("# Vite Runtime");
  output.push(`URL: ${runtime.url}`);
  output.push(`Framework: ${currentFramework}`);
  output.push(`Vite Client: ${runtime.hasViteClient ? "loaded" : "not detected"}`);
  output.push(`HMR Socket: ${runtime.wsState}`);
  output.push(`Error Overlay: ${runtime.hasErrorOverlay ? "present" : "none"}`);
  output.push(`Tracked HMR Events: ${events.length}`);

  const last = events[events.length - 1];
  if (last) {
    output.push(
      `Last HMR Event: ${new Date(last.timestamp).toLocaleTimeString()} [${last.type}] ${last.message}`,
    );
  }

  return output.join("\n");
}

export function formatHmrTrace(
  mode: "summary" | "trace",
  events: HmrEvent[],
  limit: number,
): string {
  if (events.length === 0) return "No HMR updates";

  const safeLimit = normalizeLimit(limit, 20, 200);
  const recent = events.slice(-safeLimit);

  if (mode === "summary") {
    const counts = recent.reduce<Record<string, number>>((acc, event) => {
      acc[event.type] = (acc[event.type] ?? 0) + 1;
      return acc;
    }, {});

    const lines: string[] = ["# HMR Summary"];
    lines.push(`Events considered: ${recent.length}`);
    lines.push(
      `Counts: ${Object.entries(counts)
        .map(([k, v]) => `${k}=${v}`)
        .join(", ")}`,
    );
    const last = recent[recent.length - 1];
    lines.push(
      `Last: ${new Date(last.timestamp).toLocaleTimeString()} [${last.type}] ${last.path ?? last.message}`,
    );
    lines.push("\nUse `vite-browser vite hmr trace --limit <n>` for timeline details.");
    return lines.join("\n");
  }

  return [
    "# HMR Trace",
    ...recent.map((event) => {
      const detail = event.path ? `${event.path}` : event.message;
      return `[${new Date(event.timestamp).toLocaleTimeString()}] ${event.type} ${detail}`;
    }),
  ].join("\n");
}

export function formatModuleGraphSnapshot(rows: ModuleRow[], filter?: string, limit = 200): string {
  const normalizedFilter = filter?.trim().toLowerCase();
  const safeLimit = normalizeLimit(limit, 200, 500);
  const filtered = rows.filter((row) =>
    normalizedFilter ? row.url.toLowerCase().includes(normalizedFilter) : true,
  );
  const limited = filtered.slice(0, safeLimit);

  if (limited.length === 0) return "No module resources found";

  const lines: string[] = [];
  lines.push("# Vite Module Graph (loaded resources)");
  lines.push(`Total: ${filtered.length}${filtered.length > limited.length ? ` (showing ${limited.length})` : ""}`);
  lines.push("# idx initiator ms url");
  lines.push("");
  limited.forEach((row, idx) => {
    lines.push(`${idx} ${row.initiator} ${row.durationMs}ms ${row.url}`);
  });

  return lines.join("\n");
}

export function formatModuleGraphTrace(
  currentUrls: string[],
  previousUrls: Set<string> | null,
  filter?: string,
  limit = 200,
): string {
  if (!previousUrls) {
    return "No module-graph baseline. Captured current snapshot; run `vite module-graph trace` again.";
  }

  const currentSet = new Set(currentUrls);
  const added = currentUrls.filter((url) => !previousUrls.has(url));
  const removed = [...previousUrls].filter((url) => !currentSet.has(url));
  const normalizedFilter = filter?.trim().toLowerCase();
  const safeLimit = normalizeLimit(limit, 200, 500);

  const addedFiltered = normalizedFilter
    ? added.filter((url) => url.toLowerCase().includes(normalizedFilter))
    : added;
  const removedFiltered = normalizedFilter
    ? removed.filter((url) => url.toLowerCase().includes(normalizedFilter))
    : removed;

  const lines: string[] = [];
  lines.push("# Vite Module Graph Trace");
  lines.push(`Added: ${addedFiltered.length}, Removed: ${removedFiltered.length}`);
  lines.push("");
  lines.push("## Added");
  if (addedFiltered.length === 0) lines.push("(none)");
  else addedFiltered.slice(0, safeLimit).forEach((url) => lines.push(`+ ${url}`));
  lines.push("");
  lines.push("## Removed");
  if (removedFiltered.length === 0) lines.push("(none)");
  else removedFiltered.slice(0, safeLimit).forEach((url) => lines.push(`- ${url}`));
  return lines.join("\n");
}

export async function readRuntimeSnapshot(page: Page): Promise<RuntimeSnapshot> {
  return page.evaluate((): RuntimeSnapshot => {
    const findViteClient = () => {
      const scripts = Array.from(document.querySelectorAll("script[src]"));
      return scripts.some((script) => script.getAttribute("src")?.includes("/@vite/client"));
    };

    const wsStateName = (wsState: number | undefined) => {
      if (wsState == null) return "unknown";
      if (wsState === 0) return "connecting";
      if (wsState === 1) return "open";
      if (wsState === 2) return "closing";
      if (wsState === 3) return "closed";
      return "unknown";
    };

    const hot = (window as any).__vite_hot;
    const ws = hot?.ws || hot?.socket;

    return {
      url: location.href,
      hasViteClient: findViteClient(),
      wsState: wsStateName(ws?.readyState),
      hasErrorOverlay: Boolean(document.querySelector("vite-error-overlay")),
      timestamp: Date.now(),
    };
  });
}

export async function collectModuleRows(page: Page): Promise<ModuleRow[]> {
  return page.evaluate(() => {
    const isLikelyModuleUrl = (url: string) => {
      if (!url) return false;
      if (url.includes("/@vite/")) return true;
      if (url.includes("/@id/")) return true;
      if (url.includes("/src/")) return true;
      if (url.includes("/node_modules/")) return true;
      return /\.(mjs|cjs|js|jsx|ts|tsx|vue|css)(\?|$)/.test(url);
    };

    const scripts = Array.from(document.querySelectorAll("script[src]")).map(
      (node) => (node as HTMLScriptElement).src,
    );
    const resources = performance
      .getEntriesByType("resource")
      .map((entry) => {
        const item = entry as PerformanceResourceTiming;
        return {
          url: item.name,
          initiator: item.initiatorType || "unknown",
          durationMs: Number(item.duration.toFixed(1)),
        };
      })
      .filter((entry) => isLikelyModuleUrl(entry.url));

    const all = [
      ...scripts
        .filter((url) => isLikelyModuleUrl(url))
        .map((url) => ({ url, initiator: "script-tag", durationMs: 0 })),
      ...resources,
    ];

    const seen = new Set<string>();
    const unique: ModuleRow[] = [];
    for (const row of all) {
      if (seen.has(row.url)) continue;
      seen.add(row.url);
      unique.push(row);
    }
    return unique;
  });
}

export async function readOverlayError(page: Page): Promise<{ message?: string; stack?: string } | null> {
  return page.evaluate(() => {
    const overlay = document.querySelector("vite-error-overlay");
    if (!overlay || !overlay.shadowRoot) return null;

    const message = overlay.shadowRoot.querySelector(".message")?.textContent?.trim();
    const stack = overlay.shadowRoot.querySelector(".stack")?.textContent?.trim();

    return { message, stack };
  });
}
