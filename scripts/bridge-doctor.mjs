import process from "node:process";
import { readState } from "./runtime-state.mjs";
import { resolveBridgeUrl } from "./resolve-bridge-url.mjs";

async function fetchJson(bridgeUrl, path) {
  const response = await fetch(`${bridgeUrl}${path}`);
  const body = await response.json().catch(() => null);
  return {
    ok: response.ok,
    status: response.status,
    body
  };
}

async function main() {
  const bridgeUrl = await resolveBridgeUrl();
  const persistedRuntime = await readState("active-runtime");
  const persistedBridge = await readState("bridge");

  console.log("Bridge Doctor");
  console.log(`bridge=${bridgeUrl}`);

  let health;
  try {
    health = await fetchJson(bridgeUrl, "/health");
  } catch {
    health = null;
  }

  if (!health?.ok) {
    console.log("status=warning");
    console.log("bridge.unreachable");
    console.log(`bridge.identity ${(persistedRuntime?.bridge?.name || "unknown")}@${persistedRuntime?.bridge?.version || persistedBridge?.version || "unknown"}`);
    const current = persistedRuntime?.runtime || null;
    if (!current) {
      console.log("runtime=none");
      console.log("hint=Start the local bridge or reopen Figma Relay to refresh the active runtime.");
      return;
    }
    console.log(`runtime=session:${current.runtimeSessionId}`);
    console.log(`file=${current.fileName || "Unknown"}`);
    console.log(`page=${current.pageName || "Unknown"}`);
    console.log(`capabilities=${Array.isArray(current.capabilities) ? current.capabilities.length : 0}`);
    console.log("hint=Bridge is currently unreachable, but the last known runtime is still cached locally.");
    return;
  }

  const bridge = health.body?.bridge || null;
  const activeRuntime = health.body?.activeRuntime || null;

  if (!bridge?.name) {
    console.log("bridge.identity missing");
    console.log("status=warning");
    console.log("hint=Port is serving a bridge-like process, but not Figma Relay.");
  } else {
    console.log(`bridge.identity ${bridge.name}@${bridge.version || "unknown"}`);
    console.log("status=ok");
  }

  console.log(`listeners=${health.body?.listeners ?? 0}`);
  console.log(`pending=${health.body?.pending ?? 0}`);

  const runtime = await fetchJson(bridgeUrl, "/runtime/active");
  if (!runtime.ok) {
    console.log(`runtime.endpoint missing status=${runtime.status}`);
  } else if (!runtime.body?.runtime && !activeRuntime) {
    console.log("runtime=none");
    console.log("hint=Open the Figma plugin UI to register an active runtime.");
  } else {
    const current = runtime.body?.runtime || activeRuntime;
    console.log(`runtime=session:${current.runtimeSessionId}`);
    console.log(`file=${current.fileName || "Unknown"}`);
    console.log(`page=${current.pageName || "Unknown"}`);
    console.log(`capabilities=${Array.isArray(current.capabilities) ? current.capabilities.length : 0}`);
  }
}

main().catch((error) => {
  console.error(`doctor.failed ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
