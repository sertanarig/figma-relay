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
    iterations: iterationsArg ? Math.max(1, Number(iterationsArg.split("=")[1]) || 3) : 3
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

function getText(result) {
  return result?.content?.find((item) => item.type === "text")?.text || "{}";
}

function parseToolResult(result) {
  if (result?.isError) {
    const message = getText(result) || "Unknown tool error";
    throw new Error(message);
  }
  return JSON.parse(getText(result));
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const bridgeUrl = await resolveBridgeUrl();
  const health = await waitForBridge(bridgeUrl);
  const activeRuntime = health.activeRuntime || null;

  console.log("Mixed Stress Smoke");
  console.log(`bridge=${bridgeUrl}`);
  console.log(`iterations=${options.iterations}`);

  if (!activeRuntime) {
    const message = "No active Figma runtime. Open the plugin UI and wait for runtime sync.";
    if (!options.allowNoRuntime) {
      throw new Error(message);
    }
    console.log(`runtime.missing ${message}`);
    console.log("mixed-stress.partial bridge is healthy");
    return;
  }

  const transport = createTransport(bridgeUrl);
  const client = new Client({ name: "figma-runtime-mixed-stress", version: "0.2.0" });
  const durationsByTool = {
    figma_get_status: [],
    figma_get_file_context: [],
    figma_get_styles: [],
    figma_get_variables: [],
    figma_get_components: [],
    figma_create_node: [],
    figma_set_layout: [],
    figma_batch_bind_variables: [],
    figma_create_child: [],
    figma_set_text: [],
    figma_batch_apply_styles: [],
    figma_batch_instantiate_components: [],
    figma_batch_set_instance_properties: [],
    figma_cleanup_artifacts: []
  };
  const failures = [];

  async function call(name, args) {
    const startedAt = Date.now();
    try {
      const result = parseToolResult(await client.callTool({ name, arguments: args }));
      if (name in durationsByTool) {
        durationsByTool[name].push(Date.now() - startedAt);
      }
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
      const suffix = `${Date.now()}-${index}`;
      const rootName = `Runtime MCP Mixed Stress ${suffix}`;

      await call("figma_get_status", {});
      await call("figma_get_file_context", {});
      const styles = await call("figma_get_styles", {});
      const variables = await call("figma_get_variables", {});
      const components = await call("figma_get_components", { query: "Checkbox" });

      const collections = Array.isArray(variables.collections) ? variables.collections : [];
      const floatVariables = collections.flatMap((collection) =>
        (Array.isArray(collection.variables) ? collection.variables : []).map((variable) => ({
          ...variable,
          collectionName: collection.name
        }))
      ).filter((variable) => String(variable.type || "").toUpperCase() === "FLOAT");

      const widthVariable =
        floatVariables.find((item) => item.name === "viewport/width") ||
        floatVariables.find((item) => item.name === "content/max-width") ||
        null;
      const paddingVariable =
        floatVariables.find((item) => item.name === "page/padding/x") ||
        floatVariables.find((item) => String(item.name || "").includes("padding")) ||
        null;
      const textStyle =
        (Array.isArray(styles.textStyles) ? styles.textStyles : [])[0] || null;
      const component =
        (Array.isArray(components.components) ? components.components : []).find(
          (item) => item.name === "Checkbox 1.0.0"
        ) ||
        (Array.isArray(components.components) ? components.components : [])[0] ||
        null;

      if (!widthVariable || !paddingVariable || !textStyle || !component) {
        throw new Error("MIXED_STRESS_PREREQUISITES_MISSING");
      }

      const created = await call("figma_create_node", {
        nodeType: "FRAME",
        properties: {
          name: rootName,
          x: 34200 + index * 60,
          y: 34200 + index * 60,
          width: 420,
          height: 220
        }
      });
      const rootId = created.node.id;

      try {
        await call("figma_set_layout", {
          nodeId: rootId,
          layoutMode: "VERTICAL",
          primaryAxisSizingMode: "AUTO",
          counterAxisSizingMode: "FIXED",
          paddingLeft: 16,
          paddingRight: 16,
          paddingTop: 16,
          paddingBottom: 16,
          itemSpacing: 12,
          width: 420,
          height: 220
        });

        await call("figma_batch_bind_variables", {
          bindings: [
            { nodeId: rootId, field: "width", variableName: widthVariable.name },
            { nodeId: rootId, field: "paddingLeft", variableName: paddingVariable.name },
            { nodeId: rootId, field: "paddingRight", variableName: paddingVariable.name }
          ]
        });

        const textNode = await call("figma_create_child", {
          parentId: rootId,
          nodeType: "TEXT",
          properties: {
            name: `${rootName} Label`,
            text: "mixed stress"
          }
        });

        await call("figma_set_text", {
          nodeId: textNode.node.id,
          text: `mixed stress ${index + 1}`
        });

        await call("figma_batch_apply_styles", {
          applications: [
            {
              nodeId: textNode.node.id,
              styleType: "text",
              styleId: textStyle.id
            }
          ]
        });

        const instances = await call("figma_batch_instantiate_components", {
          instances: [
            { nodeId: component.id, parentId: rootId, position: { x: 0, y: 80 } },
            { nodeId: component.id, parentId: rootId, position: { x: 220, y: 80 } }
          ]
        });

        const firstId = instances.results?.[0]?.instance?.id;
        const secondId = instances.results?.[1]?.instance?.id;
        if (!firstId || !secondId) {
          throw new Error("MIXED_STRESS_INSTANCE_CREATION_FAILED");
        }

        await call("figma_batch_set_instance_properties", {
          updates: [
            { nodeId: firstId, properties: { Label: `Mixed ${index + 1}A`, State: "Error", Value: "Checked" } },
            { nodeId: secondId, properties: { Label: `Mixed ${index + 1}B`, State: "Warning", Value: "Indeterminate" } }
          ]
        });
      } finally {
        await call("figma_cleanup_artifacts", {
          namePrefix: rootName,
          includeNodes: true,
          includeStyles: false,
          includeVariables: false
        });
      }
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
      throw new Error(`Mixed stress smoke failed with ${failures.length} tool errors`);
    }
  } finally {
    await client.close().catch(() => {});
    await transport.close().catch(() => {});
  }
}

main().catch((error) => {
  console.error(`mixed-stress-smoke.failed ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
