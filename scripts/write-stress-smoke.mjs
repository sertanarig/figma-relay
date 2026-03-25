import process from "node:process";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { resolveBridgeUrl } from "./resolve-bridge-url.mjs";
import { summarizeDurations } from "./stress-metrics.mjs";

const rootCwd = process.cwd();

function parseArgs(argv) {
  const iterationsArg = argv.find((arg) => arg.startsWith("--iterations="));
  return {
    iterations: iterationsArg ? Math.max(1, Number(iterationsArg.split("=")[1]) || 5) : 5
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

function getText(result) {
  return result.content.find((item) => item.type === "text")?.text || "{}";
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const bridgeUrl = await resolveBridgeUrl();
  const transport = createTransport(bridgeUrl);
  const client = new Client({ name: "figma-runtime-write-stress", version: "0.2.0" });

  const durationsByTool = {
    figma_create_node: [],
    figma_rename_node: [],
    figma_move_node: [],
    figma_resize_node: [],
    figma_create_child: [],
    figma_set_text: [],
    figma_set_fills: [],
    figma_clone_node: [],
    figma_cleanup_artifacts: []
  };
  const failures = [];

  async function call(name, args) {
    const startedAt = Date.now();
    try {
      const result = JSON.parse(getText(await client.callTool({ name, arguments: args })));
      durationsByTool[name].push(Date.now() - startedAt);
      return result;
    } catch (error) {
      failures.push({
        tool: name,
        message: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  try {
    await client.connect(transport);

    for (let index = 0; index < options.iterations; index += 1) {
      const rootName = `Runtime MCP Write Stress ${Date.now()}-${index}`;

      const created = await call("figma_create_node", {
        nodeType: "FRAME",
        properties: {
          name: rootName,
          x: 33000 + index * 40,
          y: 33000 + index * 40,
          width: 240,
          height: 160
        }
      });
      const rootId = created.node.id;

      await call("figma_rename_node", {
        nodeId: rootId,
        newName: `${rootName} Renamed`
      });

      await call("figma_move_node", {
        nodeId: rootId,
        x: 33100 + index * 40,
        y: 33100 + index * 40
      });

      await call("figma_resize_node", {
        nodeId: rootId,
        width: 260,
        height: 180
      });

      const child = await call("figma_create_child", {
        parentId: rootId,
        nodeType: "TEXT",
        properties: {
          name: `${rootName} Label`,
          text: "write stress"
        }
      });

      await call("figma_set_text", {
        nodeId: child.node.id,
        text: `write stress ${index + 1}`
      });

      await call("figma_set_fills", {
        nodeId: rootId,
        fills: [{ type: "SOLID", color: "#DDE8FF", opacity: 1 }]
      });

      await call("figma_clone_node", { nodeId: rootId });

      await call("figma_cleanup_artifacts", {
        namePrefix: "Runtime MCP Write Stress",
        includeNodes: true,
        includeStyles: false,
        includeVariables: false
      });
    }

    const summary = Object.fromEntries(
      Object.entries(durationsByTool).map(([toolName, samples]) => [toolName, summarizeDurations(samples)])
    );

    console.log(
      JSON.stringify(
        {
          ok: failures.length === 0,
          iterations: options.iterations,
          failures,
          summary
        },
        null,
        2
      )
    );

    if (failures.length > 0) {
      throw new Error(`Write stress smoke failed with ${failures.length} tool errors`);
    }
  } finally {
    await client.close().catch(() => {});
    await transport.close().catch(() => {});
  }
}

main().catch((error) => {
  console.error(`write-stress-smoke.failed ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
