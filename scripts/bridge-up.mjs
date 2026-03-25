import process from "node:process";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { readState, writeState } from "./runtime-state.mjs";

const CANDIDATE_PORTS = [3210, 3211, 3212];

async function inspectPort(port) {
  const url = `http://127.0.0.1:${port}`;

  try {
    const response = await fetch(`${url}/health`);
    const body = await response.json().catch(() => null);

    if (!response.ok) {
      return { port, url, status: "occupied-unknown" };
    }

    if (body?.bridge?.name === "figma-runtime-mcp") {
      return { port, url, status: "occupied-codex", bridge: body.bridge };
    }

    return { port, url, status: "occupied-foreign" };
  } catch {
    return { port, url, status: "free" };
  }
}

async function waitForHealthyBridge(url, retries = 20, retryMs = 250) {
  for (let index = 0; index < retries; index += 1) {
    try {
      const response = await fetch(`${url}/health`);
      const body = await response.json().catch(() => null);
      if (response.ok && body?.bridge?.name === "figma-runtime-mcp") {
        return true;
      }
    } catch {
      // Wait for the next retry.
    }

    await delay(retryMs);
  }

  return false;
}

async function main() {
  const persisted = await readState("bridge");
  const inspections = await Promise.all(CANDIDATE_PORTS.map(inspectPort));
  const runningCodex = inspections.find((item) => item.status === "occupied-codex");

  if (runningCodex) {
    if (!persisted || persisted.url !== runningCodex.url) {
      await writeState("bridge", {
        pid: null,
        url: runningCodex.url,
        version: runningCodex.bridge?.version || null
      });
    }
    console.log(
      `bridge.already_running url=${runningCodex.url} version=${runningCodex.bridge?.version || "unknown"}`
    );
    process.exit(0);
  }

  const freePort = inspections.find((item) => item.status === "free");
  if (!freePort) {
    const occupiedPorts = inspections.map((item) => `${item.port}:${item.status}`).join(",");
    throw new Error(`No available bridge port in ${CANDIDATE_PORTS.join(", ")} (${occupiedPorts})`);
  }

  console.log(`bridge.starting url=${freePort.url}`);
  const child = spawn(process.execPath, ["bridge/server.mjs"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      CODEX_FIGMA_BRIDGE_PORT: String(freePort.port)
    },
    stdio: "ignore",
    detached: true
  });
  child.unref();

  const healthy = await waitForHealthyBridge(freePort.url);
  if (!healthy) {
    throw new Error(`Bridge did not become healthy at ${freePort.url}`);
  }

  await writeState("bridge", {
    pid: child.pid || null,
    url: freePort.url,
    version: "0.2.0"
  });

  console.log(`bridge.started url=${freePort.url} pid=${child.pid || "unknown"}`);
}

main().catch((error) => {
  console.error(`bridge.up.failed ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
