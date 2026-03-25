import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { resolveBridgeUrl } from "./resolve-bridge-url.mjs";

const rootCwd = process.cwd();

function parseArgs(argv) {
  return {
    allowNoRuntime: argv.includes("--allow-no-runtime"),
    verbose: argv.includes("--verbose")
  };
}

async function fetchJson(url) {
  const response = await fetch(url);
  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const message = body?.message || `Request failed with ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.body = body;
    throw error;
  }

  return body;
}

function parseToolText(result) {
  const textPart = result?.content?.find((item) => item.type === "text");
  if (!textPart?.text) {
    return null;
  }

  try {
    return JSON.parse(textPart.text);
  } catch {
    return textPart.text;
  }
}

async function waitForBridge(bridgeUrl, { retries = 10, retryMs = 500 } = {}) {
  let lastError = null;

  for (let index = 0; index < retries; index += 1) {
    try {
      return await fetchJson(`${bridgeUrl}/health`);
    } catch (error) {
      lastError = error;
      await delay(retryMs);
    }
  }

  throw lastError || new Error("Bridge health check failed");
}

function createTransport(bridgeUrl) {
  const tsxBin = `${rootCwd}/node_modules/.bin/tsx`;

  return new StdioClientTransport({
    command: tsxBin,
    args: ["packages/mcp-server/src/stdio.ts"],
    cwd: rootCwd,
    stderr: "pipe",
    env: {
      ...process.env,
      CODEX_FIGMA_BRIDGE_URL: bridgeUrl
    }
  });
}

async function readStderr(stream, lines) {
  if (!stream) {
    return;
  }

  for await (const chunk of stream) {
    const text = chunk.toString("utf8").trim();
    if (text) {
      lines.push(text);
    }
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const bridgeUrl = await resolveBridgeUrl();

  console.log("Smoke E2E");
  console.log(`bridge=${bridgeUrl}`);

  const health = await waitForBridge(bridgeUrl);
  const bridgeName = health.bridge?.name || "unknown";
  const bridgeVersion = health.bridge?.version || "unknown";
  console.log(
    `bridge.ok name=${bridgeName} version=${bridgeVersion} listeners=${health.listeners} pending=${health.pending}`
  );

  if (!health.bridge?.name) {
    console.log("bridge.identity_missing running bridge does not expose bridge metadata");
  }

  let activeRuntime = health.activeRuntime || null;

  try {
    const activeRuntimeResponse = await fetchJson(`${bridgeUrl}/runtime/active`);
    activeRuntime = activeRuntimeResponse.runtime || activeRuntime;
  } catch (error) {
    if (error?.status === 404) {
      console.log("runtime.endpoint_missing bridge does not expose /runtime/active, falling back to /health");
    } else {
      throw error;
    }
  }

  const stderrLines = [];
  const transport = createTransport(bridgeUrl);
  const stderrReader = readStderr(transport.stderr, stderrLines);
  const client = new Client({
    name: "codex-figma-smoke",
    version: "0.2.0"
  });

  client.onerror = (error) => {
    if (options.verbose) {
      console.error("client.error", error);
    }
  };

  try {
    await client.connect(transport);

    const toolList = await client.listTools();
    const toolNames = toolList.tools.map((tool) => tool.name);
    console.log(`mcp.ok tools=${toolNames.length}`);

    if (!toolNames.includes("figma_get_status")) {
      throw new Error("Required tool figma_get_status is missing from MCP registry");
    }

    if (!activeRuntime) {
      const message = "No active Figma runtime. Open the plugin UI and wait for runtime sync.";
      if (!options.allowNoRuntime) {
        throw new Error(message);
      }

      console.log(`runtime.missing ${message}`);
      console.log("smoke.partial bridge and MCP are healthy");
      return;
    }

    console.log(
      `runtime.ok session=${activeRuntime.runtimeSessionId} file=${activeRuntime.fileName} page=${activeRuntime.pageName}`
    );

    const statusResult = await client.callTool({
      name: "figma_get_status",
      arguments: {}
    });

    const statusPayload = parseToolText(statusResult);
    const runtimeSessionId = statusPayload?.runtimeSessionId || "unknown";
    const connected = Boolean(statusPayload?.connected);
    console.log(`tool.ok figma_get_status connected=${connected} runtimeSessionId=${runtimeSessionId}`);

    if (!connected) {
      throw new Error("figma_get_status returned connected=false");
    }

    if (runtimeSessionId !== activeRuntime.runtimeSessionId) {
      throw new Error(
        `Runtime mismatch: bridge=${activeRuntime.runtimeSessionId} tool=${runtimeSessionId}`
      );
    }

    console.log("smoke.ok end-to-end chain is healthy");
  } catch (error) {
    if (stderrLines.length > 0) {
      console.error("mcp.stderr");
      for (const line of stderrLines.slice(-20)) {
        console.error(line);
      }
    }

    throw error;
  } finally {
    await client.close().catch(() => {});
    await transport.close().catch(() => {});
    await Promise.race([stderrReader, delay(50)]);
  }
}

main().catch((error) => {
  console.error(`smoke.failed ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
