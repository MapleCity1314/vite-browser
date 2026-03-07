import { connect } from "node:net";
import { socketPath } from "./paths.js";

let id = 0;

export async function send(action: string, args?: Record<string, unknown>) {
  return new Promise<{ ok: boolean; data?: string; error?: string }>((resolve) => {
    const socket = connect(socketPath);
    const req = { id: String(++id), action, ...args };
    let buffer = "";

    socket.on("connect", () => socket.write(JSON.stringify(req) + "\n"));
    socket.on("data", (chunk) => {
      buffer += chunk;
      const newline = buffer.indexOf("\n");
      if (newline >= 0) {
        const line = buffer.slice(0, newline);
        const res = JSON.parse(line);
        socket.end();
        resolve(res);
      }
    });
    socket.on("error", (err) => {
      resolve({ ok: false, error: err.message });
    });
  });
}
