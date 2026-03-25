import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";
import { resolveBridgeUrl } from "./resolve-bridge-url.mjs";

function parseArgs(argv) {
  const timeoutArg = argv.find((arg) => arg.startsWith("--timeout-ms="));
  return {
    timeoutMs: timeoutArg ? Number(timeoutArg.split("=")[1]) : 60000,
    allowSimulated: argv.includes("--allow-simulated")
  };
}

async function fetchRuntime(bridgeUrl) {
  const response = await fetch(`${bridgeUrl}/runtime/active`);
  const body = await response.json().catch(() => null);

  if (!response.ok || !body?.ok) {
    return null;
  }

  return body.runtime || null;
}

function isSimulatedRuntime(runtime) {
  return runtime?.fileName === "Simulated Playground" || runtime?.pageName === "Runtime Simulator";
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const bridgeUrl = await resolveBridgeUrl();
  const startedAt = Date.now();

  console.log(`runtime.wait bridge=${bridgeUrl} timeoutMs=${options.timeoutMs}`);

  while (Date.now() - startedAt < options.timeoutMs) {
    const runtime = await fetchRuntime(bridgeUrl).catch(() => null);

    if (runtime && (options.allowSimulated || !isSimulatedRuntime(runtime))) {
      console.log(
        `runtime.ready session=${runtime.runtimeSessionId} file=${runtime.fileName || "Unknown"} page=${runtime.pageName || "Unknown"}`
      );
      return;
    }

    if (runtime && isSimulatedRuntime(runtime) && !options.allowSimulated) {
      console.log("runtime.wait.skip simulated runtime is active; waiting for real Figma plugin runtime");
    } else {
      console.log("runtime.wait.pending open the Figma plugin UI to register a runtime");
    }

    await delay(2000);
  }

  throw new Error("Timed out waiting for a live Figma runtime");
}

main().catch((error) => {
  console.error(`runtime.wait.failed ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
