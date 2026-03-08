import type { Page } from "playwright";

export type ReactNode = {
  id: number;
  type: number;
  name: string | null;
  key: string | null;
  parent: number;
};

export type ReactInspection = {
  text: string;
  source: [file: string, line: number, column: number] | null;
};

export async function snapshot(page: Page): Promise<ReactNode[]> {
  return page.evaluate(inPageSnapshot);
}

export async function inspect(page: Page, id: number): Promise<ReactInspection> {
  return page.evaluate(inPageInspect, id);
}

export function format(nodes: ReactNode[]): string {
  const children = new Map<number, ReactNode[]>();
  for (const n of nodes) {
    const list = children.get(n.parent) ?? [];
    list.push(n);
    children.set(n.parent, list);
  }

  const lines: string[] = [
    "# React component tree",
    "# Columns: depth id parent name [key=...]",
    "# Use `react tree <id>` for props/hooks/state.",
    "",
  ];

  for (const root of children.get(0) ?? []) walk(root, 0);
  return lines.join("\n");

  function walk(node: ReactNode, depth: number) {
    const name = node.name ?? typeName(node.type);
    const key = node.key ? ` key=${JSON.stringify(node.key)}` : "";
    const parent = node.parent || "-";
    lines.push(`${depth} ${node.id} ${parent} ${name}${key}`);
    for (const c of children.get(node.id) ?? []) walk(c, depth + 1);
  }
}

export function path(nodes: ReactNode[], id: number): string {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const names: string[] = [];
  for (let n = byId.get(id); n; n = byId.get(n.parent)) {
    names.push(n.name ?? typeName(n.type));
  }
  return names.reverse().join(" > ");
}

export function typeName(type: number): string {
  const names: Record<number, string> = {
    11: "Root",
    12: "Suspense",
    13: "SuspenseList",
  };
  return names[type] ?? `(${type})`;
}

export function decodeOperations(ops: number[]): ReactNode[] {
  let i = 2;

  const strings: (string | null)[] = [null];
  const tableEnd = ++i + ops[i - 1];
  while (i < tableEnd) {
    const len = ops[i++];
    strings.push(String.fromCodePoint(...ops.slice(i, i + len)));
    i += len;
  }

  const nodes: ReactNode[] = [];
  while (i < ops.length) {
    const op = ops[i];
    if (op === 1) {
      const id = ops[i + 1];
      const type = ops[i + 2];
      i += 3;
      if (type === 11) {
        nodes.push({ id, type, name: null, key: null, parent: 0 });
        i += 4;
      } else {
        nodes.push({
          id,
          type,
          name: strings[ops[i + 2]] ?? null,
          key: strings[ops[i + 3]] ?? null,
          parent: ops[i],
        });
        i += 5;
      }
    } else {
      i += skipOperation(op, ops, i);
    }
  }

  return nodes;
}

export function skipOperation(op: number, ops: number[], i: number): number {
  if (op === 2) return 2 + ops[i + 1];
  if (op === 3) return 3 + ops[i + 2];
  if (op === 4) return 3;
  if (op === 5) return 4;
  if (op === 6) return 1;
  if (op === 7) return 3;
  if (op === 8) return 6 + rectCount(ops[i + 5]);
  if (op === 9) return 2 + ops[i + 1];
  if (op === 10) return 3 + ops[i + 2];
  if (op === 11) return 3 + rectCount(ops[i + 2]);
  if (op === 12) return suspenseSkip(ops, i);
  if (op === 13) return 2;
  return 1;
}

export function rectCount(n: number) {
  return n === -1 ? 0 : n * 4;
}

export function suspenseSkip(ops: number[], i: number) {
  let j = i + 2;
  for (let c = 0; c < ops[i + 1]; c++) j += 5 + ops[j + 4];
  return j - i;
}

export function previewValue(v: unknown): string {
  if (v == null) return String(v);
  if (typeof v !== "object") return JSON.stringify(v);

  const d = v as { type?: string; preview_long?: string; preview_short?: string };
  if (d.type === "undefined") return "undefined";
  if (d.preview_long) return d.preview_long;
  if (d.preview_short) return d.preview_short;
  if (Array.isArray(v)) return `[${v.map(previewValue).join(", ")}]`;

  const entries = Object.entries(v).map(([k, val]) => `${k}: ${previewValue(val)}`);
  return `{${entries.join(", ")}}`;
}

export function formatHookLine(h: {
  id: number | null;
  name: string;
  value: unknown;
  subHooks?: unknown[];
}) {
  const idx = h.id != null ? `[${h.id}] ` : "";
  const sub = h.subHooks?.length ? ` (${h.subHooks.length} sub)` : "";
  return `${idx}${h.name}: ${previewValue(h.value)}${sub}`;
}

export function formatInspectionResult(name: string, id: number, value: any): ReactInspection {
  const lines: string[] = [`${name} #${id}`];

  if (value.key != null) lines.push(`key: ${JSON.stringify(value.key)}`);

  section("props", value.props);
  section("hooks", value.hooks);
  section("state", value.state);
  section("context", value.context);

  if (value.owners?.length) {
    const chain = value.owners.map((o: { displayName: string }) => o.displayName).join(" > ");
    lines.push(`rendered by: ${chain}`);
  }

  const source = Array.isArray(value.source)
    ? ([value.source[1], value.source[2], value.source[3]] as [string, number, number])
    : null;

  return { text: lines.join("\n"), source };

  function section(label: string, payload: unknown) {
    const data = (payload as { data?: unknown })?.data ?? payload;
    if (data == null) return;

    if (Array.isArray(data)) {
      if (data.length === 0) return;
      lines.push(`${label}:`);
      for (const item of data) lines.push(`  ${formatHookLine(item as never)}`);
      return;
    }

    if (typeof data === "object") {
      const entries = Object.entries(data);
      if (entries.length === 0) return;
      lines.push(`${label}:`);
      for (const [k, v] of entries) lines.push(`  ${k}: ${previewValue(v)}`);
    }
  }
}

async function inPageSnapshot(): Promise<ReactNode[]> {
  const hook = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (!hook) throw new Error("React DevTools hook not installed");

  const ri = hook.rendererInterfaces?.get?.(1);
  if (!ri) throw new Error("no React renderer attached");

  const batches = await collect(ri);
  return batches.flatMap(decodeOperations);

  function collect(ri: { flushInitialOperations: () => void }) {
    return new Promise<number[][]>((resolve) => {
      const out: number[][] = [];
      const listener = (e: MessageEvent) => {
        const payload = e.data?.payload;
        if (e.data?.source === "react-devtools-bridge" && payload?.event === "operations") {
          out.push(payload.payload);
        }
      };

      window.addEventListener("message", listener);
      ri.flushInitialOperations();

      setTimeout(() => {
        window.removeEventListener("message", listener);
        resolve(out);
      }, 80);
    });
  }
}

function inPageInspect(id: number): ReactInspection {
  const hook = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
  const ri = hook?.rendererInterfaces?.get?.(1);
  if (!ri) throw new Error("no React renderer attached");
  if (!ri.hasElementWithId(id)) throw new Error(`element ${id} not found (page reloaded?)`);

  const result = ri.inspectElement(1, id, null, true);
  if (result?.type !== "full-data") throw new Error(`inspect failed: ${result?.type}`);

  const name = ri.getDisplayNameForElementID(id);
  return formatInspectionResult(name, id, result.value);
}
