import type { Page } from "playwright";

export async function getComponentTree(page: Page): Promise<string> {
  return page.evaluate(() => {
    const output: string[] = [
      "# Svelte component tree",
      "# Use `svelte tree <id>` to inspect component details.",
      "",
    ];

    const nodes = collectSvelteNodes();
    if (nodes.length === 0) {
      output.push("Svelte app detected, but no DevTools component graph is available.");
      output.push("Tip: install/enable Svelte DevTools, then run `svelte tree` again.");
      return output.join("\n");
    }

    const children = new Map<number, typeof nodes>();
    for (const n of nodes) {
      const list = children.get(n.parent) ?? [];
      list.push(n);
      children.set(n.parent, list);
    }

    for (const root of children.get(0) ?? []) walk(root, 0);
    return output.join("\n");

    function walk(node: (typeof nodes)[number], depth: number) {
      const indent = "  ".repeat(depth);
      output.push(`${indent}[${node.id}] ${node.name}`);
      for (const c of children.get(node.id) ?? []) walk(c, depth + 1);
    }

    function collectSvelteNodes(): { id: number; parent: number; name: string; props?: unknown }[] {
      const out: { id: number; parent: number; name: string; props?: unknown }[] = [];
      const seen = new WeakSet<object>();
      let seq = 1;

      const globalCandidates = [
        (window as any).__SVELTE_DEVTOOLS_GLOBAL_HOOK__,
        (window as any).__SVELTE_DEVTOOLS__,
        (window as any).__svelte,
      ].filter(Boolean);

      for (const candidate of globalCandidates) {
        visit(candidate, 0, 0);
      }

      return out;

      function visit(value: any, parent: number, depth: number) {
        if (!value || typeof value !== "object") return;
        if (seen.has(value)) return;
        if (depth > 6) return;
        seen.add(value);

        const maybeComponent =
          !!value.$$ ||
          typeof value.$set === "function" ||
          typeof value.$destroy === "function" ||
          value.type === "component";

        let currentParent = parent;
        if (maybeComponent) {
          const id = Number.isFinite(Number(value.id)) ? Number(value.id) : seq++;
          const name =
            value.name ||
            value.$$?.component?.name ||
            value.constructor?.name ||
            value.$$?.tag ||
            "AnonymousSvelteComponent";
          const props = value.$capture_state?.() ?? value.props ?? value.$$?.props;
          out.push({ id, parent, name: String(name), props });
          currentParent = id;
        }

        const children = [
          value.children,
          value.$$?.children,
          value.$$.fragment?.children,
          value.components,
          value.apps,
          value.instances,
          value.roots,
        ].filter(Boolean);

        for (const child of children) {
          if (Array.isArray(child)) {
            for (const c of child) visit(c, currentParent, depth + 1);
          } else if (typeof child === "object") {
            for (const c of Object.values(child)) visit(c, currentParent, depth + 1);
          }
        }
      }
    }
  });
}

export async function getComponentDetails(page: Page, id: string): Promise<string> {
  return page.evaluate((targetId) => {
    const nodes = collectSvelteNodes();
    const match = nodes.find((n) => String(n.id) === targetId);

    if (!match) {
      return `Component ${targetId} not found. Run \'svelte tree\' to get fresh IDs.`;
    }

    const output: string[] = [`# Svelte component`, `# ID: ${match.id}`, `# Name: ${match.name}`, ""];

    if (match.props && typeof match.props === "object") {
      output.push("## Props/State");
      for (const [k, v] of Object.entries(match.props as Record<string, unknown>)) {
        output.push(`  ${k}: ${safe(v)}`);
      }
      output.push("");
    }

    if (match.file) {
      output.push("## Source");
      output.push(`  ${match.file}`);
    }

    return output.join("\n");

    function safe(v: unknown): string {
      try {
        return JSON.stringify(v);
      } catch {
        return String(v);
      }
    }

    function collectSvelteNodes(): {
      id: number;
      parent: number;
      name: string;
      props?: unknown;
      file?: string;
    }[] {
      const out: { id: number; parent: number; name: string; props?: unknown; file?: string }[] = [];
      const seen = new WeakSet<object>();
      let seq = 1;

      const globalCandidates = [
        (window as any).__SVELTE_DEVTOOLS_GLOBAL_HOOK__,
        (window as any).__SVELTE_DEVTOOLS__,
        (window as any).__svelte,
      ].filter(Boolean);

      for (const candidate of globalCandidates) {
        visit(candidate, 0, 0);
      }

      return out;

      function visit(value: any, parent: number, depth: number) {
        if (!value || typeof value !== "object") return;
        if (seen.has(value)) return;
        if (depth > 6) return;
        seen.add(value);

        const maybeComponent =
          !!value.$$ ||
          typeof value.$set === "function" ||
          typeof value.$destroy === "function" ||
          value.type === "component";

        let currentParent = parent;
        if (maybeComponent) {
          const id = Number.isFinite(Number(value.id)) ? Number(value.id) : seq++;
          const name =
            value.name ||
            value.$$?.component?.name ||
            value.constructor?.name ||
            value.$$?.tag ||
            "AnonymousSvelteComponent";
          const props = value.$capture_state?.() ?? value.props ?? value.$$?.props;
          const file = value.$$?.component?.__file || value.file;
          out.push({ id, parent, name: String(name), props, file });
          currentParent = id;
        }

        const children = [
          value.children,
          value.$$?.children,
          value.$$.fragment?.children,
          value.components,
          value.apps,
          value.instances,
          value.roots,
        ].filter(Boolean);

        for (const child of children) {
          if (Array.isArray(child)) {
            for (const c of child) visit(c, currentParent, depth + 1);
          } else if (typeof child === "object") {
            for (const c of Object.values(child)) visit(c, currentParent, depth + 1);
          }
        }
      }
    }
  }, id);
}