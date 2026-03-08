import { EventEmitter } from "node:events";
import { describe, expect, it, vi } from "vitest";
import {
  daemonAlive,
  ensureDaemon,
  no,
  ok,
  readLine,
  removeSocketFile,
  type ClientDeps,
} from "../src/client.js";

class FakeSocket extends EventEmitter {
  destroyed = false;

  destroy() {
    this.destroyed = true;
  }
}

function createDeps(overrides: Partial<ClientDeps> = {}): ClientDeps {
  const child = { unref: vi.fn() };
  return {
    socketPath: "/tmp/vite.sock",
    pidFile: "/tmp/vite.pid",
    existsSync: vi.fn(() => false),
    readFileSync: vi.fn(() => "123"),
    rmSync: vi.fn(),
    processKill: vi.fn(),
    spawn: vi.fn(() => child as never),
    connect: vi.fn(async () => {
      throw new Error("offline");
    }),
    sleep: vi.fn(async () => undefined) as never,
    daemonPath: "/tmp/daemon.js",
    ...overrides,
  };
}

describe("client core helpers", () => {
  it("reads line from socket stream", async () => {
    const socket = new FakeSocket();
    const pending = readLine(socket as never);
    socket.emit("data", "hello");
    socket.emit("data", " world\nnext");
    await expect(pending).resolves.toBe("hello world");
  });

  it("marks connected socket as ok and no() as false", () => {
    const socket = new FakeSocket();
    expect(ok(socket as never)).toBe(true);
    expect(socket.destroyed).toBe(true);
    expect(no()).toBe(false);
  });

  it("detects stale daemon and cleans pid file", () => {
    const deps = createDeps({
      existsSync: vi.fn(() => true),
      processKill: vi.fn(() => {
        throw new Error("dead");
      }),
    });

    expect(daemonAlive(deps)).toBe(false);
    expect(deps.rmSync).toHaveBeenCalledWith(deps.pidFile, { force: true });
  });

  it("returns true for live daemon", () => {
    const deps = createDeps({
      existsSync: vi.fn(() => true),
      processKill: vi.fn(),
    });

    expect(daemonAlive(deps)).toBe(true);
  });
});

describe("ensureDaemon", () => {
  it("skips spawn when daemon is already reachable", async () => {
    const socket = new FakeSocket();
    const deps = createDeps({
      existsSync: vi.fn(() => true),
      processKill: vi.fn(),
      connect: vi.fn(async () => socket as never),
    });

    await ensureDaemon(deps);
    expect(deps.spawn).not.toHaveBeenCalled();
  });

  it("spawns and waits until daemon becomes reachable", async () => {
    const socket = new FakeSocket();
    const connect = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(socket as never);
    const deps = createDeps({ connect });

    await ensureDaemon(deps);
    expect(deps.spawn).toHaveBeenCalledTimes(1);
    expect(connect).toHaveBeenCalledTimes(2);
  });

  it("throws when daemon never becomes reachable", async () => {
    const deps = createDeps();
    await expect(ensureDaemon(deps)).rejects.toThrow("daemon failed to start");
    expect(deps.spawn).toHaveBeenCalledTimes(1);
  });
});

describe("removeSocketFile", () => {
  it("removes socket on non-windows platforms", () => {
    const rm = vi.fn();
    removeSocketFile("/tmp/vite.sock", rm as never);
    if (process.platform !== "win32") {
      expect(rm).toHaveBeenCalledWith("/tmp/vite.sock", { force: true });
    }
  });
});
