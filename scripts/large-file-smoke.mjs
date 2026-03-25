import process from "node:process";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { resolveBridgeUrl } from "./resolve-bridge-url.mjs";
import { summarizeDurations } from "./stress-metrics.mjs";

const rootCwd = process.cwd();

function parseArgs(argv) {
  const componentLimitArg = argv.find((arg) => arg.startsWith("--component-limit="));
  const depthArg = argv.find((arg) => arg.startsWith("--depth="));
  return {
    componentLimit: componentLimitArg ? Math.max(1, Number(componentLimitArg.split("=")[1]) || 25) : 25,
    depth: depthArg ? Math.max(1, Number(depthArg.split("=")[1]) || 2) : 2
  };
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

function parseToolResult(result) {
  const text = result?.content?.find((item) => item.type === "text")?.text || "{}";
  return JSON.parse(text);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const bridgeUrl = await resolveBridgeUrl();
  const transport = createTransport(bridgeUrl);
  const client = new Client({ name: "figma-runtime-large-file-smoke", version: "0.2.0" });
  const durationsByTool = {
    figma_get_file_data: [],
    figma_get_design_system_summary: [],
    figma_get_design_system_kit: [],
    figma_browse_design_system: [],
    figma_get_dashboard: []
  };

  async function call(name, args) {
    const startedAt = Date.now();
    const result = parseToolResult(await client.callTool({ name, arguments: args }));
    durationsByTool[name].push(Date.now() - startedAt);
    return result;
  }

  try {
    await client.connect(transport);

    const fileData = await call("figma_get_file_data", {
      depth: options.depth,
      verbosity: "summary"
    });
    const summary = await call("figma_get_design_system_summary", {});
    const kit = await call("figma_get_design_system_kit", {
      componentLimit: options.componentLimit
    });
    const browser = await call("figma_browse_design_system", {
      componentLimit: options.componentLimit,
      styleLimit: 20
    });
    const dashboard = await call("figma_get_dashboard", {});

    const metrics = Object.fromEntries(
      Object.entries(durationsByTool).map(([toolName, samples]) => [toolName, summarizeDurations(samples)])
    );

    console.log(
      JSON.stringify(
        {
          ok: true,
          options,
          fileData: {
            fileName: fileData.fileName || null,
            pageName: fileData.pageName || null,
            nodes: Array.isArray(fileData.nodes) ? fileData.nodes.length : 0
          },
          summary: {
            counts: summary.counts || {}
          },
          kit: {
            componentCount: Array.isArray(kit.components) ? kit.components.length : 0,
            styleCount: Array.isArray(kit.styles) ? kit.styles.length : 0,
            collectionCount: Array.isArray(kit.collections) ? kit.collections.length : 0
          },
          browser: {
            componentGroups: Array.isArray(browser.components) ? browser.components.length : 0,
            styleGroups: Array.isArray(browser.styles) ? browser.styles.length : 0
          },
          dashboard: {
            status: dashboard.health?.status || null,
            topIssues: Array.isArray(dashboard.health?.topIssues) ? dashboard.health.topIssues.length : 0
          },
          metrics
        },
        null,
        2
      )
    );
  } finally {
    await client.close().catch(() => {});
    await transport.close().catch(() => {});
  }
}

main().catch((error) => {
  console.error(`large-file-smoke.failed ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
