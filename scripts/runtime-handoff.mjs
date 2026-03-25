import process from "node:process";
import { readState } from "./runtime-state.mjs";
import { resolveBridgeUrl } from "./resolve-bridge-url.mjs";

async function fetchJson(url) {
  const response = await fetch(url);
  const body = await response.json().catch(() => null);
  return { ok: response.ok, status: response.status, body };
}

async function main() {
  const bridgeUrl = await resolveBridgeUrl();
  const persisted = await readState("active-runtime");
  const persistedBridge = await readState("bridge");
  let health = null;
  let runtimeResponse = null;
  let runtime = persisted?.runtime || null;
  let bridgeReachable = false;

  try {
    health = await fetchJson(`${bridgeUrl}/health`);
    if (health.ok) {
      bridgeReachable = true;
      runtimeResponse = await fetchJson(`${bridgeUrl}/runtime/active`);
      runtime = runtimeResponse.body?.runtime || health.body?.activeRuntime || runtime;
    }
  } catch {
    // Fall back to persisted state.
  }

  console.log("Runtime Handoff");
  console.log(`bridge=${bridgeUrl || persistedBridge?.url || "unknown"}`);
  console.log(`bridgeName=${health?.body?.bridge?.name || persisted?.bridge?.name || "unknown"}`);
  console.log(`bridgeVersion=${health?.body?.bridge?.version || persisted?.bridge?.version || persistedBridge?.version || "unknown"}`);
  console.log(`bridgeReachable=${bridgeReachable ? "yes" : "no"}`);

  if (!runtime) {
    console.log("runtime=none");
    console.log("hint=Open Figma Relay once, then both agents can reuse the same active runtime.");
    return;
  }

  console.log(`runtimeSessionId=${runtime.runtimeSessionId}`);
  console.log(`editorType=${runtime.editorType || "figma"}`);
  console.log(`file=${runtime.fileName || "Unknown"}`);
  console.log(`page=${runtime.pageName || "Unknown"}`);
  console.log(`fileKey=${runtime.fileKey || "unknown"}`);
  console.log(`capabilities=${Array.isArray(runtime.capabilities) ? runtime.capabilities.length : 0}`);
  console.log(`updatedAt=${runtime.updatedAt || "unknown"}`);
  if (!bridgeReachable) {
    console.log("hint=Last known runtime is shown from local state. Start or reconnect the local bridge to resume live tool calls.");
  } else {
    console.log("next=Point any MCP client at this same local bridge and it should reuse the active runtime without reopening the plugin.");
  }
}

main().catch((error) => {
  console.error(`runtime.handoff.failed ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
