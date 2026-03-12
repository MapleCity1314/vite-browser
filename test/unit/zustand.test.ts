import { describe, it, expect } from "vitest";
import {
  formatStoreList,
  formatStoreInspection,
  type ZustandStore,
} from "../../src/react/zustand.js";

describe("Zustand integration", () => {
  it("formats empty store list", () => {
    const output = formatStoreList([]);
    expect(output).toBe("No Zustand stores found");
  });

  it("formats store list with multiple stores", () => {
    const output = formatStoreList(["cart", "user", "settings"]);
    expect(output).toContain("# Zustand Stores");
    expect(output).toContain("- cart");
    expect(output).toContain("- user");
    expect(output).toContain("- settings");
    expect(output).toContain("vite-browser react store inspect");
  });

  it("formats store inspection with state and actions", () => {
    const store: ZustandStore = {
      name: "cart",
      state: {
        items: [{ id: "1", name: "Laptop", price: 999, quantity: 1 }],
      },
      actions: ["addItem", "removeItem", "clear"],
    };

    const output = formatStoreInspection(store);
    expect(output).toContain("# Zustand Store: cart");
    expect(output).toContain("## State");
    expect(output).toContain('items: [{"id":"1","name":"Laptop","price":999,"quantity":1}]');
    expect(output).toContain("## Actions");
    expect(output).toContain("addItem()");
    expect(output).toContain("removeItem()");
    expect(output).toContain("clear()");
  });

  it("formats store with empty state", () => {
    const store: ZustandStore = {
      name: "empty",
      state: {},
      actions: ["init"],
    };

    const output = formatStoreInspection(store);
    expect(output).toContain("# Zustand Store: empty");
    expect(output).toContain("## Actions");
    expect(output).toContain("init()");
  });

  it("formats store with no actions", () => {
    const store: ZustandStore = {
      name: "readonly",
      state: { count: 42 },
      actions: [],
    };

    const output = formatStoreInspection(store);
    expect(output).toContain("# Zustand Store: readonly");
    expect(output).toContain("## State");
    expect(output).toContain("count: 42");
    expect(output).not.toContain("## Actions");
  });

  it("handles circular references in state", () => {
    const circular: any = { name: "test" };
    circular.self = circular;

    const store: ZustandStore = {
      name: "circular",
      state: { data: circular },
      actions: [],
    };

    const output = formatStoreInspection(store);
    expect(output).toContain("# Zustand Store: circular");
    expect(output).toContain("[Circular]");
  });
});
