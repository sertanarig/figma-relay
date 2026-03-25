import { createServer } from "node:http";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PORT = Number(process.env.CODEX_FIGMA_BRIDGE_PORT || 3210);
const RUNTIME_STALE_MS = Number(process.env.CODEX_FIGMA_RUNTIME_STALE_MS || 30000);
const BRIDGE_INFO = {
  name: "figma-runtime-mcp",
  version: "0.2.0"
};
const clients = new Map();
const pending = new Map();
let activeRuntime = null;
const runtimesBySessionId = new Map();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const buildMetaPath = path.join(rootDir, "dist", "build-meta.json");
const stateDir = path.join(rootDir, ".figma-runtime-mcp");
const activeRuntimeStatePath = path.join(stateDir, "active-runtime.json");

async function ensureStateDir() {
  await mkdir(stateDir, { recursive: true });
}

async function writeActiveRuntimeState(runtime) {
  await ensureStateDir();
  await writeFile(
    activeRuntimeStatePath,
    JSON.stringify(
      {
        bridge: {
          url: `http://127.0.0.1:${PORT}`,
          name: BRIDGE_INFO.name,
          version: BRIDGE_INFO.version
        },
        runtime
      },
      null,
      2
    ),
    "utf8"
  );
}

async function clearActiveRuntimeState() {
  await rm(activeRuntimeStatePath, { force: true });
}

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("access-control-allow-origin", "*");
  res.end(JSON.stringify(body));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk.toString("utf8");
      if (data.length > 512000) {
        reject(new Error("Payload too large"));
      }
    });
    req.on("end", () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

function broadcast(event) {
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  for (const client of clients.values()) {
    client.write(payload);
  }
}

function newId() {
  return `req-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

function normalizeRuntimePayload(body) {
  const runtimeSessionId = String(body.runtimeSessionId || "").trim();
  if (!runtimeSessionId) {
    return null;
  }

  const runtime = {
    runtimeSessionId,
    clientId: body.clientId ? String(body.clientId) : null,
    editorType: String(body.editorType || "figma"),
    fileKey: String(body.fileKey || "local-file"),
    fileName: String(body.fileName || "Unknown"),
    pageName: String(body.pageName || "Unknown"),
    updatedAt: new Date().toISOString()
  };

  if (Array.isArray(body.capabilities)) {
    runtime.capabilities = body.capabilities.map((value) => String(value));
  }

  if (body.buildStamp) {
    runtime.buildStamp = String(body.buildStamp);
  }

  return runtime;
}

function isRuntimeStale(runtime) {
  if (!runtime?.updatedAt) {
    return true;
  }

  return Date.now() - new Date(runtime.updatedAt).getTime() > RUNTIME_STALE_MS;
}

function getActiveRuntimeSnapshot() {
  if (!activeRuntime) {
    return null;
  }

  if (clients.size === 0 || isRuntimeStale(activeRuntime)) {
    activeRuntime = null;
    clearActiveRuntimeState().catch(() => {});
    return null;
  }

  return activeRuntime;
}

function getRuntimeBySessionId(runtimeSessionId) {
  const runtime = runtimesBySessionId.get(runtimeSessionId) || null;
  if (!runtime) {
    return null;
  }

  if (isRuntimeStale(runtime)) {
    runtimesBySessionId.delete(runtimeSessionId);
    return null;
  }

  return runtime;
}

function listRuntimeSnapshots() {
  const runtimes = [];
  for (const [sessionId, runtime] of runtimesBySessionId.entries()) {
    if (isRuntimeStale(runtime)) {
      runtimesBySessionId.delete(sessionId);
      continue;
    }
    runtimes.push(runtime);
  }

  if (
    activeRuntime &&
    !runtimes.some((runtime) => runtime.runtimeSessionId === activeRuntime.runtimeSessionId) &&
    !isRuntimeStale(activeRuntime)
  ) {
    runtimes.push(activeRuntime);
  }

  return runtimes.sort((left, right) => new Date(right.updatedAt || 0).getTime() - new Date(left.updatedAt || 0).getTime());
}

function createWaiter(id) {
  const timeoutMs = Number(process.env.CODEX_FIGMA_BRIDGE_TIMEOUT_MS || 45000);
  const timeout = setTimeout(() => {
    const waiter = pending.get(id);
    if (waiter) {
      pending.delete(id);
      waiter.resolve({
        ok: false,
        message: `Timed out after ${timeoutMs}ms waiting plugin response`
      });
    }
  }, timeoutMs);

  return new Promise((resolve) => {
    pending.set(id, { resolve, timeout });
  });
}

async function readBuildMeta() {
  try {
    const content = await readFile(buildMetaPath, "utf8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.setHeader("access-control-allow-origin", "*");
    res.setHeader("access-control-allow-methods", "GET,POST,OPTIONS");
    res.setHeader("access-control-allow-headers", "content-type");
    res.end();
    return;
  }

  if (req.method === "GET" && url.pathname === "/health") {
    const runtime = getActiveRuntimeSnapshot();
    sendJson(res, 200, {
      ok: true,
      bridge: BRIDGE_INFO,
      listeners: clients.size,
      pending: pending.size,
      activeRuntime: runtime
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/runtime/active") {
    const runtime = getActiveRuntimeSnapshot();
    sendJson(res, 200, {
      ok: true,
      bridge: BRIDGE_INFO,
      runtime,
      listeners: clients.size
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/runtimes") {
    sendJson(res, 200, {
      ok: true,
      bridge: BRIDGE_INFO,
      runtimes: listRuntimeSnapshots(),
      listeners: clients.size
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/dev/build") {
    const build = await readBuildMeta();
    sendJson(res, 200, {
      ok: true,
      bridge: BRIDGE_INFO,
      build
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/events") {
    const clientId = newId();
    res.writeHead(200, {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      "access-control-allow-origin": "*"
    });
    res.write(`data: ${JSON.stringify({ type: "hello", clientId, listeners: clients.size + 1 })}\n\n`);
    clients.set(clientId, res);
    req.on("close", () => {
      clients.delete(clientId);
      for (const [sessionId, runtime] of runtimesBySessionId.entries()) {
        if (runtime?.clientId === clientId) {
          runtimesBySessionId.delete(sessionId);
          if (activeRuntime?.runtimeSessionId === sessionId) {
            activeRuntime = null;
          }
        }
      }
      if (clients.size === 0) {
        activeRuntime = null;
        clearActiveRuntimeState().catch(() => {});
      }
    });
    return;
  }

  if (req.method === "POST" && url.pathname === "/prompt") {
    if (clients.size === 0) {
      sendJson(res, 409, {
        ok: false,
        message: "No Figma plugin client connected. Open plugin UI first."
      });
      return;
    }

    let body;
    try {
      body = await readJson(req);
    } catch (error) {
      sendJson(res, 400, { ok: false, message: error.message });
      return;
    }

    const text = String(body.text || "").trim();
    if (!text) {
      sendJson(res, 400, { ok: false, message: "text is required" });
      return;
    }

    const id = newId();
    broadcast({ type: "prompt", id, text });
    const result = await createWaiter(id);
    sendJson(res, 200, { ok: true, id, result });
    return;
  }

  if (req.method === "POST" && url.pathname === "/command") {
    if (clients.size === 0) {
      sendJson(res, 409, {
        ok: false,
        message: "No Figma plugin client connected. Open plugin UI first."
      });
      return;
    }

    let body;
    try {
      body = await readJson(req);
    } catch (error) {
      sendJson(res, 400, { ok: false, message: error.message });
      return;
    }

    const command = String(body.command || "").trim();
    const requestId = String(body.requestId || newId());
    const sessionId = String(body.sessionId || getActiveRuntimeSnapshot()?.runtimeSessionId || "runtime-bridge");
    const payload = body.payload && typeof body.payload === "object" ? body.payload : {};

    if (!command) {
      sendJson(res, 400, { ok: false, message: "command is required" });
      return;
    }

    const targetRuntime =
      getRuntimeBySessionId(sessionId) ||
      getActiveRuntimeSnapshot();
    const commandEvent = {
      type: "command",
      request: {
        requestId,
        sessionId,
        command,
        payload
      }
    };

    if (targetRuntime?.clientId && clients.has(targetRuntime.clientId)) {
      clients.get(targetRuntime.clientId).write(`data: ${JSON.stringify(commandEvent)}\n\n`);
    } else {
      broadcast(commandEvent);
    }

    const result = await createWaiter(requestId);
    sendJson(res, 200, { ok: true, id: requestId, result });
    return;
  }

  if (req.method === "POST" && (url.pathname === "/runtime/hello" || url.pathname === "/runtime/context")) {
    let body;
    try {
      body = await readJson(req);
    } catch (error) {
      sendJson(res, 400, { ok: false, message: error.message });
      return;
    }

    const runtime = normalizeRuntimePayload(body);
    if (!runtime) {
      sendJson(res, 400, { ok: false, message: "runtimeSessionId is required" });
      return;
    }

    const current = getRuntimeBySessionId(runtime.runtimeSessionId) || activeRuntime || {};
    activeRuntime = Object.assign({}, current, runtime);
    runtimesBySessionId.set(runtime.runtimeSessionId, activeRuntime);
    await writeActiveRuntimeState(activeRuntime);

    sendJson(res, 200, { ok: true, runtime: activeRuntime });
    return;
  }

  if (
    req.method === "POST" &&
    (url.pathname === "/response" || url.pathname === "/runtime-response")
  ) {
    let body;
    try {
      body = await readJson(req);
    } catch (error) {
      sendJson(res, 400, { ok: false, message: error.message });
      return;
    }

    const id = String(body.id || body.requestId || "");
    if (!id || !pending.has(id)) {
      sendJson(res, 404, { ok: false, message: "Unknown request id" });
      return;
    }

    const waiter = pending.get(id);
    pending.delete(id);
    clearTimeout(waiter.timeout);
    waiter.resolve({
      ok: !!body.ok,
      message: String(body.message || ""),
      data: body.data || null
    });
    sendJson(res, 200, { ok: true });
    return;
  }

  sendJson(res, 404, { ok: false, message: "Not found" });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(
    `Figma Runtime MCP bridge running on http://127.0.0.1:${PORT}`
  );
});
