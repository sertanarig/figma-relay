import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { resolveBridgeUrl } from "./resolve-bridge-url.mjs";
import { summarizeDurations } from "./stress-metrics.mjs";

const rootCwd = process.cwd();

function parseArgs(argv) {
  const iterationsArg = argv.find((arg) => arg.startsWith("--iterations="));
  return {
    allowNoRuntime: argv.includes("--allow-no-runtime"),
    iterations: iterationsArg ? Math.max(1, Number(iterationsArg.split("=")[1]) || 20) : 20
  };
}

async function fetchJson(url) {
  const response = await fetch(url);
  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const message = body?.message || `Request failed with ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return body;
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
  return new StdioClientTransport({
    command: `${rootCwd}/node_modules/.bin/tsx`,
    args: ["packages/mcp-server/src/stdio.ts"],
    cwd: rootCwd,
    stderr: "pipe",
    env: {
      ...process.env,
      CODEX_FIGMA_BRIDGE_URL: bridgeUrl
    }
  });
}

function parseToolText(result) {
  const textPart = result?.content?.find((item) => item.type === "text");
  if (!textPart?.text) {
    return null;
  }

  return JSON.parse(textPart.text);
}

async function timeTool(client, name, durations, failures) {
  const startedAt = Date.now();
  try {
    const result = await client.callTool({ name, arguments: {} });
    durations.push(Date.now() - startedAt);
    return parseToolText(result);
  } catch (error) {
    failures.push({
      tool: name,
      message: error instanceof Error ? error.message : String(error)
    });
    return null;
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const bridgeUrl = await resolveBridgeUrl();
  const health = await waitForBridge(bridgeUrl);
  const activeRuntime = health.activeRuntime || null;

  console.log("Stress Smoke");
  console.log(`bridge=${bridgeUrl}`);
  console.log(`iterations=${options.iterations}`);

  if (!activeRuntime) {
    const message = "No active Figma runtime. Open the plugin UI and wait for runtime sync.";
    if (!options.allowNoRuntime) {
      throw new Error(message);
    }
    console.log(`runtime.missing ${message}`);
    console.log("stress.partial bridge is healthy");
    return;
  }

  const transport = createTransport(bridgeUrl);
  const client = new Client({ name: "figma-runtime-stress", version: "0.2.0" });

  const durationsByTool = {
    figma_get_status: [],
    figma_get_file_context: [],
    figma_get_selection: [],
    figma_get_styles: [],
    figma_get_variables: [],
    figma_get_components: []
  };
  const failures = [];

  try {
    await client.connect(transport);

    for (let index = 0; index < options.iterations; index += 1) {
      await timeTool(client, "figma_get_status", durationsByTool.figma_get_status, failures);
      await timeTool(client, "figma_get_file_context", durationsByTool.figma_get_file_context, failures);
      await timeTool(client, "figma_get_selection", durationsByTool.figma_get_selection, failures);
      await timeTool(client, "figma_get_styles", durationsByTool.figma_get_styles, failures);
      await timeTool(client, "figma_get_variables", durationsByTool.figma_get_variables, failures);
      await timeTool(client, "figma_get_components", durationsByTool.figma_get_components, failures);
    }

    const summary = Object.fromEntries(
      Object.entries(durationsByTool).map(([toolName, samples]) => [toolName, summarizeDurations(samples)])
    );

    console.log(
      JSON.stringify(
        {
          ok: failures.length === 0,
          runtimeSessionId: activeRuntime.runtimeSessionId,
          iterations: options.iterations,
          failures,
          summary
        },
        null,
        2
      )
    );

    if (failures.length > 0) {
      throw new Error(`Stress smoke failed with ${failures.length} tool errors`);
    }
  } finally {
    await client.close().catch(() => {});
    await transport.close().catch(() => {});
  }
}

main().catch((error) => {
  console.error(`stress-smoke.failed ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
