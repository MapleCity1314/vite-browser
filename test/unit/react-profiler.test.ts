import { describe, it, expect } from "vitest";
import {
  analyzeSlowRenders,
  formatDuration,
  formatRenderInfo,
  formatRenderTriggers,
  type RenderInfo,
  type RenderTrigger,
} from "../../src/react/profiler.js";

describe("React profiler", () => {
  it("formats empty render list", () => {
    expect(formatRenderInfo([])).toBe("No renders recorded");
  });

  it("formats commit info with measurable and unknown durations", () => {
    const renders: RenderInfo[] = [
      {
        rendererId: 1,
        rootName: "App",
        phase: "mount",
        actualDuration: 5.2,
        baseDuration: 5.0,
        startTime: 1000,
        commitTime: 1005,
        fiberCount: 8,
        interactions: [],
      },
      {
        rendererId: 2,
        rootName: "Counter",
        phase: "update",
        actualDuration: null,
        baseDuration: null,
        startTime: null,
        commitTime: 2002,
        fiberCount: 3,
        interactions: [{ id: 1, name: "click", timestamp: 2000 }],
      },
    ];

    const output = formatRenderInfo(renders);
    expect(output).toContain("# React Commits");
    expect(output).toContain("[MOUNT] App (5.20ms)");
    expect(output).toContain("Fibers: 8");
    expect(output).toContain("[UPDATE] Counter (n/a)");
    expect(output).toContain("Interactions: click");
  });

  it("formats duration helper", () => {
    expect(formatDuration(3.456)).toBe("3.46ms");
    expect(formatDuration(null)).toBe("n/a");
  });

  it("marks slow renders with warning", () => {
    const renders: RenderInfo[] = [
      {
        rendererId: 1,
        rootName: "SlowComponent",
        phase: "update",
        actualDuration: 25.5,
        baseDuration: 20.0,
        startTime: 1000,
        commitTime: 1025,
        fiberCount: 5,
        interactions: [],
      },
    ];

    const output = formatRenderInfo(renders);
    expect(output).toContain("⚠️ SLOW");
    expect(output).toContain("25.50ms");
  });

  it("formats empty render triggers", () => {
    expect(formatRenderTriggers([])).toBe("No render triggers recorded");
  });

  it("formats render triggers with reasons", () => {
    const triggers: RenderTrigger[] = [
      {
        rendererId: 1,
        rootName: "Counter",
        reason: "state",
        timestamp: 1000,
        details: "count changed",
      },
      {
        rendererId: 2,
        rootName: "List",
        reason: "props",
        timestamp: 2000,
      },
    ];

    const output = formatRenderTriggers(triggers);
    expect(output).toContain("# Render Triggers");
    expect(output).toContain("[STATE] Counter - count changed");
    expect(output).toContain("[PROPS] List");
  });

  it("analyzes slow renders and ignores unknown durations", () => {
    const renders: RenderInfo[] = [
      {
        rendererId: 1,
        rootName: "FastComponent",
        phase: "update",
        actualDuration: 5.0,
        baseDuration: 5.0,
        startTime: 1000,
        commitTime: 1005,
        fiberCount: 2,
        interactions: [],
      },
      {
        rendererId: 2,
        rootName: "SlowComponent",
        phase: "update",
        actualDuration: 20.0,
        baseDuration: 15.0,
        startTime: 2000,
        commitTime: 2020,
        fiberCount: 10,
        interactions: [],
      },
      {
        rendererId: 2,
        rootName: "SlowComponent",
        phase: "update",
        actualDuration: 30.0,
        baseDuration: 15.0,
        startTime: 3000,
        commitTime: 3030,
        fiberCount: 11,
        interactions: [],
      },
      {
        rendererId: 3,
        rootName: "UnknownDuration",
        phase: "update",
        actualDuration: null,
        baseDuration: null,
        startTime: null,
        commitTime: 4000,
        fiberCount: 1,
        interactions: [],
      },
    ];

    const output = analyzeSlowRenders(renders);
    expect(output).toContain("# Slow Renders Analysis");
    expect(output).toContain("Found 2 slow render(s)");
    expect(output).toContain("SlowComponent:");
    expect(output).toContain("Count: 2");
    expect(output).toContain("Total: 50.00ms");
    expect(output).not.toContain("UnknownDuration");
  });

  it("reports no slow renders when no measurable commit exceeds threshold", () => {
    const renders: RenderInfo[] = [
      {
        rendererId: 1,
        rootName: "FastComponent",
        phase: "update",
        actualDuration: 5.0,
        baseDuration: 5.0,
        startTime: 1000,
        commitTime: 1005,
        fiberCount: 2,
        interactions: [],
      },
      {
        rendererId: 2,
        rootName: "UnknownDuration",
        phase: "update",
        actualDuration: null,
        baseDuration: null,
        startTime: null,
        commitTime: 2000,
        fiberCount: 1,
        interactions: [],
      },
    ];

    expect(analyzeSlowRenders(renders)).toContain("No slow renders detected with measurable duration");
  });

  it("sorts slow renders by total time", () => {
    const renders: RenderInfo[] = [
      {
        rendererId: 1,
        rootName: "ComponentA",
        phase: "update",
        actualDuration: 20.0,
        baseDuration: 15.0,
        startTime: 1000,
        commitTime: 1020,
        fiberCount: 3,
        interactions: [],
      },
      {
        rendererId: 2,
        rootName: "ComponentB",
        phase: "update",
        actualDuration: 50.0,
        baseDuration: 40.0,
        startTime: 2000,
        commitTime: 2050,
        fiberCount: 4,
        interactions: [],
      },
    ];

    const output = analyzeSlowRenders(renders);
    const lines = output.split("\n");
    const componentAIndex = lines.findIndex((l) => l.includes("ComponentA:"));
    const componentBIndex = lines.findIndex((l) => l.includes("ComponentB:"));
    expect(componentBIndex).toBeLessThan(componentAIndex);
  });
});
