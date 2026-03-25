import process from "node:process";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { resolveBridgeUrl } from "./resolve-bridge-url.mjs";
import { writeState } from "./runtime-state.mjs";

async function fetchJson(url) {
  const response = await fetch(url);
  const body = await response.json().catch(() => null);
  return {
    ok: response.ok,
    body
  };
}

async function waitForRuntime(bridgeUrl, retries = 20, retryMs = 250) {
  for (let index = 0; index < retries; index += 1) {
    const response = await fetchJson(`${bridgeUrl}/runtime/active`).catch(() => null);
    if (response?.ok && response.body?.runtime?.runtimeSessionId) {
      return response.body.runtime;
    }
    await delay(retryMs);
  }

  return null;
}

async function main() {
  const bridgeUrl = await resolveBridgeUrl();
  const current = await fetchJson(`${bridgeUrl}/runtime/active`).catch(() => null);

  if (current?.ok && current.body?.runtime?.runtimeSessionId) {
    await writeState("runtime-simulator", {
      pid: null,
      bridgeUrl,
      runtimeSessionId: current.body.runtime.runtimeSessionId
    });
    console.log(`runtime.simulator.already_present session=${current.body.runtime.runtimeSessionId}`);
    return;
  }

  const child = spawn(process.execPath, ["scripts/runtime-simulator.mjs"], {
    cwd: process.cwd(),
    env: process.env,
    stdio: "ignore",
    detached: true
  });
  child.unref();

  const runtime = await waitForRuntime(bridgeUrl);
  if (!runtime) {
    throw new Error(`Runtime simulator did not register with ${bridgeUrl}`);
  }

  await writeState("runtime-simulator", {
    pid: child.pid || null,
    bridgeUrl,
    runtimeSessionId: runtime.runtimeSessionId
  });

  console.log(`runtime.simulator.started bridge=${bridgeUrl} session=${runtime.runtimeSessionId}`);
}

main().catch((error) => {
  console.error(`runtime.simulator.up.failed ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
