import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";
import { resolveBridgeUrl } from "./resolve-bridge-url.mjs";

const RUNTIME_SESSION_ID = process.env.FIGMA_RUNTIME_SIM_SESSION_ID || "sim-runtime-1";
const CAPABILITIES = [
  "runtime.status",
  "selection.read",
  "node.read",
  "screenshots.capture",
  "variables.read",
  "components.read",
  "node.write",
  "variables.write",
  "components.write",
  "logs.read"
];

async function postJson(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.message || `Request failed with ${response.status}`);
  }
}

function buildRuntimePayload() {
  return {
    runtimeSessionId: RUNTIME_SESSION_ID,
    fileKey: "simulated-file",
    fileName: "Simulated Playground",
    pageName: "Runtime Simulator",
    capabilities: CAPABILITIES
  };
}

async function main() {
  const bridgeUrl = await resolveBridgeUrl();
  const runtimePayload = buildRuntimePayload();

  async function respond(requestId, ok, data, message = "") {
    await postJson(`${bridgeUrl}/response`, {
      id: requestId,
      ok,
      message,
      data
    });
  }

  const response = await fetch(`${bridgeUrl}/events`, {
    headers: {
      accept: "text/event-stream"
    }
  });

  if (!response.ok || !response.body) {
    throw new Error(`Failed to connect to runtime event stream (${response.status})`);
  }

  await postJson(`${bridgeUrl}/runtime/hello`, runtimePayload);
  await postJson(`${bridgeUrl}/runtime/context`, runtimePayload);

  console.log(`runtime.simulator.connected bridge=${bridgeUrl} session=${RUNTIME_SESSION_ID}`);

  const heartbeat = setInterval(async () => {
    try {
      await postJson(`${bridgeUrl}/runtime/hello`, runtimePayload);
      await postJson(`${bridgeUrl}/runtime/context`, runtimePayload);
    } catch (error) {
      console.error(`runtime.simulator.heartbeat_failed ${error instanceof Error ? error.message : String(error)}`);
    }
  }, 10000);

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() || "";

    for (const event of events) {
      const dataLine = event
        .split("\n")
        .find((line) => line.startsWith("data: "));

      if (!dataLine) {
        continue;
      }

      try {
        const payload = JSON.parse(dataLine.slice(6));
        if (payload.type !== "command" || !payload.request) {
          continue;
        }

        const { requestId, command } = payload.request;
        if (!requestId) {
          continue;
        }

        switch (command) {
          case "figma_get_status":
            await respond(requestId, true, {
              connected: true,
              runtimeSessionId: RUNTIME_SESSION_ID,
              fileKey: runtimePayload.fileKey,
              fileName: runtimePayload.fileName,
              pageName: runtimePayload.pageName,
              capabilities: CAPABILITIES
            });
            break;
          default:
            await respond(requestId, false, null, `SIMULATOR_UNSUPPORTED:${command}`);
            break;
        }
      } catch (error) {
        console.error(`runtime.simulator.message_failed ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  clearInterval(heartbeat);
  await delay(50);
}

main().catch((error) => {
  console.error(`runtime.simulator.failed ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
