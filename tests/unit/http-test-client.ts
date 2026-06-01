import http from "node:http";
import { Duplex } from "node:stream";

type HeaderValue = string | string[] | undefined;

export type TestRequest = {
  method: string;
  path: string;
  headers?: Record<string, HeaderValue>;
  body?: string;
};

export type TestResponse = {
  status: number;
  headers: Record<string, string>;
  text: string;
  json<T = unknown>(): Promise<T>;
};

class MockSocket extends Duplex {
  public readonly remoteAddress = "127.0.0.1";
  public readonly remotePort = 12345;
  public readonly chunks: Buffer[] = [];

  constructor() {
    // Keep the writable side open even if the readable side ends; and don't
    // auto-destroy because the HTTP server may write a response after the
    // request body is fully read.
    super({ allowHalfOpen: true, autoDestroy: false });
  }

  _read() {}

  _write(chunk: Buffer, _enc: BufferEncoding, cb: (error?: Error | null) => void) {
    this.chunks.push(Buffer.from(chunk));
    cb();
  }

  // Some middleware expects socket helpers to exist.
  setTimeout() {
    return this;
  }
  setNoDelay() {
    return this;
  }
  setKeepAlive() {
    return this;
  }
}

function normalizeHeaderValue(value: HeaderValue): string | undefined {
  if (Array.isArray(value)) {
    return value.join(", ");
  }
  if (typeof value === "string") {
    return value;
  }
  return undefined;
}

function parseHeaders(headerLines: string[]): Record<string, string> {
  const headers: Record<string, string> = {};
  for (const line of headerLines) {
    const idx = line.indexOf(":");
    if (idx < 0) continue;
    const name = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();
    if (!name) continue;
    headers[name] = headers[name] ? `${headers[name]}, ${value}` : value;
  }
  return headers;
}

function decodeChunkedBody(body: string): string {
  // Minimal chunked-transfer decoder for tests. Assumes UTF-8 content.
  let i = 0;
  let out = "";
  while (i < body.length) {
    const lineEnd = body.indexOf("\r\n", i);
    if (lineEnd === -1) break;
    const sizeHex = body.slice(i, lineEnd).trim();
    const size = Number.parseInt(sizeHex, 16);
    if (!Number.isFinite(size)) break;
    i = lineEnd + 2;
    if (size === 0) break;
    out += body.slice(i, i + size);
    i += size;
    if (body.slice(i, i + 2) === "\r\n") i += 2;
  }
  return out;
}

function parseRawHttp(raw: string): { status: number; headers: Record<string, string>; body: string } {
  const headerEnd = raw.indexOf("\r\n\r\n");
  if (headerEnd === -1) {
    return { status: 0, headers: {}, body: raw };
  }

  const headerText = raw.slice(0, headerEnd);
  const body = raw.slice(headerEnd + 4);

  const lines = headerText.split("\r\n");
  const statusLine = lines.shift() || "";
  const status = Number.parseInt(statusLine.split(" ")[1] || "0", 10) || 0;
  const headers = parseHeaders(lines);

  if ((headers["transfer-encoding"] || "").toLowerCase().includes("chunked")) {
    return { status, headers, body: decodeChunkedBody(body) };
  }

  return { status, headers, body };
}

export async function requestHttp(server: http.Server, req: TestRequest): Promise<TestResponse> {
  // Use the server's real HTTP connection listener without binding a TCP port.
  // This avoids sandbox restrictions around `listen()` while preserving Node's
  // internal request/response lifecycle (async handlers included).
  const socket = new MockSocket();

  const responseFinished = new Promise<void>((resolve, reject) => {
    const onRequest = (_req: http.IncomingMessage, res: http.ServerResponse) => {
      res.on("finish", resolve);
      res.on("error", reject);
    };

    server.once("request", onRequest);
    socket.on("error", reject);
  });

  // Attach the socket so Node can create IncomingMessage/ServerResponse normally.
  server.emit("connection", socket as any);

  const method = req.method.toUpperCase();
  const normalizedHeaders: Record<string, string> = {};
  for (const [key, value] of Object.entries(req.headers || {})) {
    const normalized = normalizeHeaderValue(value);
    if (typeof normalized === "string") {
      normalizedHeaders[key.toLowerCase()] = normalized;
    }
  }

  const body = req.body ?? "";
  if (body && typeof normalizedHeaders["content-length"] === "undefined") {
    normalizedHeaders["content-length"] = String(Buffer.byteLength(body));
  }

  // Force deterministic connection teardown so we can treat `finish/close`
  // as "response is complete" in tests.
  if (typeof normalizedHeaders["connection"] === "undefined") {
    normalizedHeaders["connection"] = "close";
  }
  if (typeof normalizedHeaders["host"] === "undefined") {
    normalizedHeaders["host"] = "localhost";
  }

  const headerLines = Object.entries(normalizedHeaders).map(([k, v]) => `${k}: ${v}`);
  const rawRequest =
    `${method} ${req.path} HTTP/1.1\r\n` +
    `${headerLines.join("\r\n")}\r\n\r\n` +
    body;

  socket.push(rawRequest);

  await responseFinished;

  // Close the connection after the response is generated so tests don't leave
  // sockets hanging in the event loop.
  socket.end();

  const raw = Buffer.concat(socket.chunks).toString("utf8");
  const parsed = parseRawHttp(raw);

  return {
    status: parsed.status,
    headers: parsed.headers,
    text: parsed.body,
    async json<T = unknown>() {
      return JSON.parse(parsed.body) as T;
    },
  };
}
