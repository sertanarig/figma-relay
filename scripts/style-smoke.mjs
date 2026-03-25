import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { resolveLiveBridgeUrl } from "./smoke-helpers.mjs";

function createTransport(bridgeUrl) {
  return new StdioClientTransport({
    command: `${process.cwd()}/node_modules/.bin/tsx`,
    args: ["packages/mcp-server/src/stdio.ts"],
    cwd: process.cwd(),
    stderr: "pipe",
    env: { ...process.env, CODEX_FIGMA_BRIDGE_URL: bridgeUrl }
  });
}

function getText(result) {
  return result.content.find((item) => item.type === "text")?.text || "{}";
}

async function main() {
  const bridgeUrl = await resolveLiveBridgeUrl();
  const transport = createTransport(bridgeUrl);
  const client = new Client({ name: "style-smoke-client", version: "0.0.1" });
  let nodeId = null;
  let createdStyle = null;

  async function call(name, args) {
    return JSON.parse(getText(await client.callTool({ name, arguments: args })));
  }

  try {
    await client.connect(transport);

    const styles = await call("figma_get_styles", {});
    const textStyle = Array.isArray(styles.textStyles) ? styles.textStyles[0] : null;
    if (!textStyle) {
      throw new Error("No text style available for style smoke");
    }

    const createdNode = await call("figma_create_node", {
      nodeType: "TEXT",
      properties: {
        name: "Runtime MCP Style Smoke",
        text: "style smoke",
        x: 32650,
        y: 32000,
        width: 160,
        height: 24
      }
    });
    nodeId = createdNode.node.id;

    const applied = await call("figma_apply_style", {
      nodeId,
      styleType: "text",
      styleId: textStyle.id
    });

    const created = await call("figma_create_style", {
      styleType: "paint",
      name: `Runtime MCP Temp Paint Style ${Date.now()}`,
      color: "#123ABC",
      description: "temporary smoke style"
    });
    createdStyle = created.style;

    const inventory = await call("figma_get_styles", {});
    const foundCreatedStyle = (inventory.paintStyles || []).some((style) => style.id === createdStyle.id);

    const deleted = await call("figma_delete_style", {
      styleType: "paint",
      styleId: createdStyle.id
    });
    createdStyle = null;

    console.log(
      JSON.stringify(
        {
          ok: true,
          applied,
          created,
          foundCreatedStyle,
          deleted
        },
        null,
        2
      )
    );
  } finally {
    if (createdStyle) {
      try {
        await call("figma_delete_style", { styleType: "paint", styleId: createdStyle.id });
      } catch {
        // Ignore cleanup errors.
      }
    }

    if (nodeId) {
      try {
        await call("figma_delete_node", { nodeId });
      } catch {
        // Ignore cleanup errors.
      }
    }

    await client.close().catch(() => {});
    await transport.close().catch(() => {});
  }
}

main().catch((error) => {
  console.error(`style-smoke.failed ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
