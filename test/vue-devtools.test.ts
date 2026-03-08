import { describe, expect, it } from "vitest";
import {
  formatComponentDetails,
  formatComponentTree,
  formatPiniaStores,
  formatRouterInfo,
} from "../src/vue/devtools.js";

describe("vue devtools helpers", () => {
  it("formats component tree from app instances", () => {
    const apps = [
      {
        _component: { name: "App" },
        _instance: {
          uid: 1,
          type: { name: "App" },
          subTree: {
            component: {
              uid: 2,
              type: { name: "Child" },
            },
          },
        },
      },
    ];

    const out = formatComponentTree(apps);
    expect(out).toContain("# Vue Component Tree");
    expect(out).toContain("## App: App");
    expect(out).toContain("[1] App");
    expect(out).toContain("[2] Child");
  });

  it("formats component details with props, state, computed, and source", () => {
    const out = formatComponentDetails(
      {
        uid: 7,
        type: {
          name: "Counter",
          computed: { doubled: true },
          __file: "/src/Counter.vue",
        },
        props: { initial: 1 },
        data: { local: 2 },
        setupState: { count: 3, inc: () => null },
        proxy: { doubled: 6 },
      },
      "7",
    );

    expect(out).toContain("# Component: Counter");
    expect(out).toContain("initial: 1");
    expect(out).toContain("local: 2");
    expect(out).toContain("inc: [Function]");
    expect(out).toContain("doubled: 6");
    expect(out).toContain("/src/Counter.vue");
  });

  it("formats pinia stores from map registry and state fallback", () => {
    const pinia = {
      _s: new Map([
        [
          "counter",
          {
            $state: { count: 2, $internal: "skip" },
            _getters: ["double"],
            double: 4,
          },
        ],
      ]),
      state: { value: { counter: { count: 2 }, orphan: { ready: true } } },
    };

    expect(formatPiniaStores(pinia)).toContain("- counter");
    expect(formatPiniaStores(pinia)).toContain("- orphan");

    const detailed = formatPiniaStores(pinia, "counter");
    expect(detailed).toContain("# Pinia Store: counter");
    expect(detailed).toContain("count: 2");
    expect(detailed).not.toContain("$internal");
    expect(detailed).toContain("double: 4");
  });

  it("formats router info", () => {
    const out = formatRouterInfo({
      currentRoute: {
        value: {
          path: "/products/1",
          name: "product",
          params: { id: "1" },
          query: { tab: "reviews" },
        },
      },
      getRoutes: () => [{ path: "/", name: "home" }, { path: "/products/:id" }],
    });

    expect(out).toContain("# Vue Router");
    expect(out).toContain("Path: /products/1");
    expect(out).toContain('Params: {"id":"1"}');
    expect(out).toContain("/products/:id");
  });
});
