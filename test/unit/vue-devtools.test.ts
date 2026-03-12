import { describe, expect, it } from "vitest";
import {
  formatComponentDetails,
  formatComponentTree,
  formatPiniaStores,
  formatRouterInfo,
} from "../../src/vue/devtools.js";

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

  it("includes source file path in component tree", () => {
    const apps = [
      {
        _component: { name: "App" },
        _instance: {
          uid: 1,
          type: { name: "App", __file: "/src/App.vue" },
          subTree: {
            component: {
              uid: 2,
              type: { name: "NavBar", __file: "/src/components/NavBar.vue" },
            },
          },
        },
      },
    ];

    const out = formatComponentTree(apps);
    expect(out).toContain("[1] App [/src/App.vue]");
    expect(out).toContain("[2] NavBar [/src/components/NavBar.vue]");
  });

  it("omits file path when __file is not set", () => {
    const apps = [
      {
        _component: { name: "App" },
        _instance: {
          uid: 1,
          type: { name: "App" },
        },
      },
    ];

    const out = formatComponentTree(apps);
    expect(out).toContain("[1] App");
    expect(out).not.toContain("[1] App [");
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

  it("lists actions in pinia store output", () => {
    const pinia = {
      _s: new Map([
        [
          "cart",
          {
            $state: { items: [] },
            _getters: ["totalItems"],
            totalItems: 0,
            addItem: () => {},
            removeItem: () => {},
            clear: () => {},
            $subscribe: () => {},  // $ prefixed — should be excluded
            _internal: () => {},   // _ prefixed — should be excluded
          },
        ],
      ]),
      state: { value: {} },
    };

    const out = formatPiniaStores(pinia, "cart");
    expect(out).toContain("## Actions");
    expect(out).toContain("addItem()");
    expect(out).toContain("removeItem()");
    expect(out).toContain("clear()");
    // Should not list getters as actions
    expect(out).not.toMatch(/^\s+totalItems\(\)/m);
    // Should not list $ or _ prefixed
    expect(out).not.toContain("$subscribe()");
    expect(out).not.toContain("_internal()");
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

  it("includes hash and meta in router output", () => {
    const out = formatRouterInfo({
      currentRoute: {
        value: {
          path: "/admin/settings",
          name: "admin-settings",
          params: {},
          query: {},
          hash: "#general",
          meta: { requiresAuth: true },
        },
      },
      getRoutes: () => [
        { path: "/admin/settings", name: "admin-settings", meta: { requiresAuth: true } },
        { path: "/public", name: "public", meta: {} },
      ],
    });

    expect(out).toContain("Hash: #general");
    expect(out).toContain('Meta: {"requiresAuth":true}');
    // Route listing includes meta
    expect(out).toContain('meta={"requiresAuth":true}');
    // Routes with empty meta should not show meta
    expect(out).not.toContain("(public) meta=");
  });

  it("shows matched route chain for nested routes", () => {
    const out = formatRouterInfo({
      currentRoute: {
        value: {
          path: "/admin/users/42",
          name: "user-detail",
          params: { id: "42" },
          query: {},
          matched: [
            { path: "/admin", name: "admin" },
            { path: "/admin/users", name: "users" },
            { path: "/admin/users/:id", name: "user-detail" },
          ],
        },
      },
      getRoutes: () => [],
    });

    expect(out).toContain("Matched: /admin > /admin/users > /admin/users/:id");
  });
});
