import { EventEmitter } from "node:events";
import { describe, expect, it, beforeEach } from "vitest";
import { attach, clear, detail, format } from "../src/network.js";

class FakePage extends EventEmitter {
  frameRef = { id: "main" };

  mainFrame() {
    return this.frameRef;
  }
}

class FakeRequest {
  constructor(
    private readonly data: {
      url: string;
      method: string;
      type: string;
      frame: unknown;
      headers?: Record<string, string>;
      postData?: string;
      failure?: string;
    },
  ) {}

  url() {
    return this.data.url;
  }

  method() {
    return this.data.method;
  }

  resourceType() {
    return this.data.type;
  }

  frame() {
    return this.data.frame;
  }

  headers() {
    return this.data.headers ?? {};
  }

  allHeaders() {
    return Promise.resolve(this.data.headers ?? {});
  }

  postData() {
    return this.data.postData ?? null;
  }

  failure() {
    return this.data.failure ? { errorText: this.data.failure } : null;
  }
}

class FakeResponse {
  constructor(
    private readonly req: FakeRequest,
    private readonly data: {
      status: number;
      statusText: string;
      headers?: Record<string, string>;
      body?: string;
    },
  ) {}

  request() {
    return this.req;
  }

  status() {
    return this.data.status;
  }

  statusText() {
    return this.data.statusText;
  }

  headers() {
    return this.data.headers ?? {};
  }

  allHeaders() {
    return Promise.resolve(this.data.headers ?? {});
  }

  text() {
    return Promise.resolve(this.data.body ?? "");
  }
}

describe("network logging", () => {
  beforeEach(() => {
    clear();
  });

  it("formats request list and detailed request/response payload", async () => {
    const page = new FakePage();
    attach(page as never);

    const req = new FakeRequest({
      url: "http://localhost:5173/api/users",
      method: "POST",
      type: "fetch",
      frame: page.mainFrame(),
      headers: { "content-type": "application/json" },
      postData: '{"name":"Alice"}',
    });

    const res = new FakeResponse(req, {
      status: 201,
      statusText: "Created",
      headers: { "content-type": "application/json" },
      body: '{"id":1,"name":"Alice"}',
    });

    page.emit("request", req);
    page.emit("response", res);

    const list = format();
    expect(list).toContain("# Network requests since last navigation");
    expect(list).toContain("0 201 POST fetch");
    expect(list).toContain("http://localhost:5173/api/users");

    const one = await detail(0);
    expect(one).toContain("POST http://localhost:5173/api/users");
    expect(one).toContain("request headers:");
    expect(one).toContain("request body:");
    expect(one).toContain("response: 201 Created");
    expect(one).toContain("response body:");
  });

  it("records failed requests", async () => {
    const page = new FakePage();
    attach(page as never);

    const req = new FakeRequest({
      url: "http://localhost:5173/api/fail",
      method: "GET",
      type: "xhr",
      frame: page.mainFrame(),
      failure: "net::ERR_CONNECTION_REFUSED",
    });

    page.emit("request", req);
    page.emit("requestfailed", req);

    const list = format();
    expect(list).toContain("0 FAIL GET xhr");

    const one = await detail(0);
    expect(one).toContain("FAILED: net::ERR_CONNECTION_REFUSED");
  });
});