import { describe, it, expect } from "vitest";
import {
  formatRenderInfo,
  formatRenderTriggers,
  analyzeSlowRenders,
  type RenderInfo,
  type RenderTrigger,
} from "../../src/react/profiler.js";

describe("React profiler", () => {
  it("formats empty render list", () => {
    const output = formatRenderInfo([]);
    expect(output).toBe("No renders recorded");
  });

  it("formats render info with mount and update", () => {
    const renders: RenderInfo[] = [
      {
        componentId: 1,
        componentName: "App",
        phase: "mount",
        actualDuration: 5.2,
        baseDuration: 5.0,
        startTime: 1000,
        commitTime: 1005,
        interactions: new Set(),
      },
      {
        componentId: 2,
        componentName: "Counter",
        phase: "update",
        actualDuration: 2.1,
        baseDuration: 2.0,
        startTime: 2000,
        commitTime: 2002,
        interactions: new Set([{ id: 1, name: "click", timestamp: 2000 }]),
      },
    ];

    const output = formatRenderInfo(renders);
    expect(output).toContain("# React Renders");
    expect(output).toContain("[MOUNT] App (5.20ms)");
    expect(output).toContain("[UPDATE] Counter (2.10ms)");
    expect(output).toContain("Interactions: click");
  });

  it("marks slow renders with warning", () => {
    const renders: RenderInfo[] = [
      {
        componentId: 1,
        componentName: "SlowComponent",
        phase: "update",
        actualDuration: 25.5,
        baseDuration: 20.0,
        startTime: 1000,
        commitTime: 1025,
        interactions: new Set(),
      },
    ];

    const output = formatRenderInfo(renders);
    expect(output).toContain("⚠️ SLOW");
    expect(output).toContain("25.50ms");
  });

  it("formats empty render triggers", () => {
    const output = formatRenderTriggers([]);
    expect(output).toBe("No render triggers recorded");
  });

  it("formats render triggers with reasons", () => {
    const triggers: RenderTrigger[] = [
      {
        componentId: 1,
        componentName: "Counter",
        reason: "state",
        timestamp: 1000,
        details: "count changed",
      },
      {
        componentId: 2,
        componentName: "List",
        reason: "props",
        timestamp: 2000,
      },
    ];

    const output = formatRenderTriggers(triggers);
    expect(output).toContain("# Render Triggers");
    expect(output).toContain("[STATE] Counter - count changed");
    expect(output).toContain("[PROPS] List");
  });

  it("analyzes slow renders", () => {
    const renders: RenderInfo[] = [
      {
        componentId: 1,
        componentName: "FastComponent",
        phase: "update",
        actualDuration: 5.0,
        baseDuration: 5.0,
        startTime: 1000,
        commitTime: 1005,
        interactions: new Set(),
      },
      {
        componentId: 2,
        componentName: "SlowComponent",
        phase: "update",
        actualDuration: 20.0,
        baseDuration: 15.0,
        startTime: 2000,
        commitTime: 2020,
        interactions: new Set(),
      },
      {
        componentId: 2,
        componentName: "SlowComponent",
        phase: "update",
        actualDuration: 30.0,
        baseDuration: 15.0,
        startTime: 3000,
        commitTime: 3030,
        interactions: new Set(),
      },
    ];

    const output = analyzeSlowRenders(renders);
    expect(output).toContain("# Slow Renders Analysis");
    expect(output).toContain("Found 2 slow render(s)");
    expect(output).toContain("SlowComponent:");
    expect(output).toContain("Count: 2");
    expect(output).toContain("Total: 50.00ms");
    expect(output).toContain("Average: 25.00ms");
    expect(output).toContain("Max: 30.00ms");
    expect(output).not.toContain("FastComponent");
  });

  it("reports no slow renders when all are fast", () => {
    const renders: RenderInfo[] = [
      {
        componentId: 1,
        componentName: "FastComponent",
        phase: "update",
        actualDuration: 5.0,
        baseDuration: 5.0,
        startTime: 1000,
        commitTime: 1005,
        interactions: new Set(),
      },
    ];

    const output = analyzeSlowRenders(renders);
    expect(output).toContain("No slow renders detected");
  });

  it("sorts slow renders by total time", () => {
    const renders: RenderInfo[] = [
      {
        componentId: 1,
        componentName: "ComponentA",
        phase: "update",
        actualDuration: 20.0,
        baseDuration: 15.0,
        startTime: 1000,
        commitTime: 1020,
        interactions: new Set(),
      },
      {
        componentId: 2,
        componentName: "ComponentB",
        phase: "update",
        actualDuration: 50.0,
        baseDuration: 40.0,
        startTime: 2000,
        commitTime: 2050,
        interactions: new Set(),
      },
    ];

    const output = analyzeSlowRenders(renders);
    const lines = output.split("\n");
    const componentAIndex = lines.findIndex((l) => l.includes("ComponentA:"));
    const componentBIndex = lines.findIndex((l) => l.includes("ComponentB:"));

    // ComponentB should come first (higher total time)
    expect(componentBIndex).toBeLessThan(componentAIndex);
  });
});
