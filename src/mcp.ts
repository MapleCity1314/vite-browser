import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { send } from "./client.js";

const TOOLS: Tool[] = [
  // Browser control
  {
    name: "browser_open",
    description: "Launch the browser and navigate to a URL",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string", description: "URL to open (e.g. http://localhost:5173)" },
      },
      required: ["url"],
    },
  },
  {
    name: "browser_close",
    description: "Close the browser and stop the daemon",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "browser_goto",
    description: "Navigate to a URL in the currently open browser",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string", description: "URL to navigate to" },
      },
      required: ["url"],
    },
  },
  {
    name: "browser_back",
    description: "Go back in browser history",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "browser_reload",
    description: "Reload the current page",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "browser_screenshot",
    description: "Take a screenshot of the current page and return it as an image",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "browser_eval",
    description: "Evaluate JavaScript in the current page context and return the result",
    inputSchema: {
      type: "object",
      properties: {
        script: { type: "string", description: "JavaScript expression or statement to evaluate" },
      },
      required: ["script"],
    },
  },

  // Framework detection
  {
    name: "detect_framework",
    description: "Detect the frontend framework running on the current page (vue/react/svelte)",
    inputSchema: { type: "object", properties: {} },
  },

  // Vue
  {
    name: "vue_tree",
    description: "Show the Vue component tree. Optionally inspect a specific component by id.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Component id to inspect (omit for full tree)" },
      },
    },
  },
  {
    name: "vue_pinia",
    description: "Show all Pinia stores or inspect a specific store by name",
    inputSchema: {
      type: "object",
      properties: {
        store: { type: "string", description: "Store name to inspect (omit for all stores)" },
      },
    },
  },
  {
    name: "vue_router",
    description: "Show Vue Router state — current route, history, and registered routes",
    inputSchema: { type: "object", properties: {} },
  },

  // React
  {
    name: "react_tree",
    description: "Show the React component tree. Optionally inspect a specific fiber by id.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Fiber id to inspect (omit for full tree)" },
      },
    },
  },
  {
    name: "react_store_list",
    description: "List all detected Zustand stores on the current page",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "react_store_inspect",
    description: "Inspect the state and actions of a specific Zustand store",
    inputSchema: {
      type: "object",
      properties: {
        store: { type: "string", description: "Store name to inspect" },
      },
      required: ["store"],
    },
  },
  {
    name: "react_hook_health",
    description: "Show the health status of the bundled React DevTools hook",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "react_hook_inject",
    description: "Inject the bundled React DevTools hook into the current page",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "react_commits",
    description: "Show recent React commit records captured by the DevTools hook",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Maximum number of commits to show (default 20)" },
      },
    },
  },
  {
    name: "react_commits_clear",
    description: "Clear the recorded React commit history",
    inputSchema: { type: "object", properties: {} },
  },

  // Svelte
  {
    name: "svelte_tree",
    description: "Show the Svelte component tree. Optionally inspect a component by id.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Component id to inspect (omit for full tree)" },
      },
    },
  },

  // Vite
  {
    name: "vite_restart",
    description: "Restart the Vite dev server",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "vite_hmr",
    description: "Show HMR activity. Use mode='summary' (default), 'trace' for full timeline, or 'clear' to reset.",
    inputSchema: {
      type: "object",
      properties: {
        mode: {
          type: "string",
          enum: ["summary", "trace", "clear"],
          description: "Output mode (default: summary)",
        },
        limit: { type: "number", description: "Max HMR entries to return (default 20)" },
      },
    },
  },
  {
    name: "vite_runtime",
    description: "Show Vite runtime status — connected clients, server state, and plugin info",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "vite_module_graph",
    description: "Inspect the Vite module graph. Use mode='snapshot' (default), 'trace' for changes, or 'clear' to reset baseline.",
    inputSchema: {
      type: "object",
      properties: {
        mode: {
          type: "string",
          enum: ["snapshot", "trace", "clear"],
          description: "Output mode (default: snapshot)",
        },
        filter: { type: "string", description: "Filter modules by path substring" },
        limit: { type: "number", description: "Max modules to return (default 200)" },
      },
    },
  },

  // Diagnostics
  {
    name: "get_errors",
    description: "Get current build and runtime errors from the page",
    inputSchema: {
      type: "object",
      properties: {
        mapped: { type: "boolean", description: "Resolve stack traces via source maps (default false)" },
        inlineSource: { type: "boolean", description: "Include source snippets in mapped output (default false)" },
      },
    },
  },
  {
    name: "correlate_errors",
    description: "Correlate current errors with recent HMR events to identify the likely cause",
    inputSchema: {
      type: "object",
      properties: {
        mapped: { type: "boolean", description: "Use source-mapped errors (default false)" },
        inlineSource: { type: "boolean", description: "Include source snippets (default false)" },
        windowMs: { type: "number", description: "Time window in ms to look back (default 5000)" },
      },
    },
  },
  {
    name: "correlate_renders",
    description: "Summarize recent store-update → render propagation evidence",
    inputSchema: {
      type: "object",
      properties: {
        windowMs: { type: "number", description: "Time window in ms (default 5000)" },
      },
    },
  },
  {
    name: "diagnose_hmr",
    description: "Diagnose HMR failures using runtime status, errors, and trace data",
    inputSchema: {
      type: "object",
      properties: {
        mapped: { type: "boolean", description: "Use source-mapped errors (default false)" },
        inlineSource: { type: "boolean", description: "Include source snippets (default false)" },
        windowMs: { type: "number", description: "Time window in ms (default 5000)" },
        limit: { type: "number", description: "Max HMR trace entries to inspect (default 50)" },
      },
    },
  },
  {
    name: "diagnose_propagation",
    description: "Diagnose likely update → render → error propagation path",
    inputSchema: {
      type: "object",
      properties: {
        windowMs: { type: "number", description: "Time window in ms (default 5000)" },
      },
    },
  },

  // Utilities
  {
    name: "get_logs",
    description: "Get the last 50 console log entries from the page",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "get_network",
    description: "List recent network requests or inspect a specific request by index",
    inputSchema: {
      type: "object",
      properties: {
        idx: { type: "number", description: "Request index to inspect (omit for full list)" },
      },
    },
  },
];

async function dispatch(name: string, args: Record<string, unknown>) {
  switch (name) {
    case "browser_open":
      return send("open", { url: args.url });
    case "browser_close":
      return send("close");
    case "browser_goto":
      return send("goto", { url: args.url });
    case "browser_back":
      return send("back");
    case "browser_reload":
      return send("reload");
    case "browser_eval":
      return send("eval", { script: args.script });
    case "detect_framework":
      return send("detect");
    case "vue_tree":
      return send("vue-tree", { id: args.id });
    case "vue_pinia":
      return send("vue-pinia", { store: args.store });
    case "vue_router":
      return send("vue-router");
    case "react_tree":
      return send("react-tree", { id: args.id });
    case "react_store_list":
      return send("react-store-list");
    case "react_store_inspect":
      return send("react-store-inspect", { store: args.store });
    case "react_hook_health":
      return send("react-hook-health");
    case "react_hook_inject":
      return send("react-hook-inject");
    case "react_commits":
      return send("react-commits", { limit: args.limit ?? 20 });
    case "react_commits_clear":
      return send("react-commits-clear");
    case "svelte_tree":
      return send("svelte-tree", { id: args.id });
    case "vite_restart":
      return send("vite-restart");
    case "vite_hmr":
      return send("vite-hmr", { mode: args.mode ?? "summary", limit: args.limit ?? 20 });
    case "vite_runtime":
      return send("vite-runtime");
    case "vite_module_graph":
      return send("vite-module-graph", { mode: args.mode ?? "snapshot", filter: args.filter, limit: args.limit ?? 200 });
    case "get_errors":
      return send("errors", { mapped: args.mapped ?? false, inlineSource: args.inlineSource ?? false });
    case "correlate_errors":
      return send("correlate-errors", { mapped: args.mapped ?? false, inlineSource: args.inlineSource ?? false, windowMs: args.windowMs ?? 5000 });
    case "correlate_renders":
      return send("correlate-renders", { windowMs: args.windowMs ?? 5000 });
    case "diagnose_hmr":
      return send("diagnose-hmr", { mapped: args.mapped ?? false, inlineSource: args.inlineSource ?? false, windowMs: args.windowMs ?? 5000, limit: args.limit ?? 50 });
    case "diagnose_propagation":
      return send("diagnose-propagation", { windowMs: args.windowMs ?? 5000 });
    case "get_logs":
      return send("logs");
    case "get_network":
      return send("network", { idx: args.idx });
    default:
      return { ok: false as const, error: `unknown tool: ${name}` };
  }
}

export function createMcpServer() {
  const server = new Server(
    { name: "vite-browser", version: "0.3.6" },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args = {} } = request.params;

    if (name === "browser_screenshot") {
      const res = await send("screenshot");
      if (!res.ok) {
        return { content: [{ type: "text" as const, text: `Error: ${res.error}` }], isError: true };
      }
      const path = String(res.data);
      try {
        const imageData = readFileSync(path);
        return {
          content: [
            {
              type: "image" as const,
              data: imageData.toString("base64"),
              mimeType: "image/png",
            },
          ],
        };
      } catch {
        return { content: [{ type: "text" as const, text: `Screenshot saved to: ${path}` }] };
      }
    }

    const res = await dispatch(name, args as Record<string, unknown>);
    if (!res.ok) {
      return {
        content: [{ type: "text" as const, text: `Error: ${res.error}` }],
        isError: true,
      };
    }
    const text = res.data != null ? String(res.data) : "ok";
    return { content: [{ type: "text" as const, text }] };
  });

  return server;
}

export async function startMcpServer() {
  const server = createMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === process.argv[1]
) {
  startMcpServer().catch((err) => {
    process.stderr.write(`vite-browser mcp: ${err instanceof Error ? err.message : err}\n`);
    process.exit(1);
  });
}
