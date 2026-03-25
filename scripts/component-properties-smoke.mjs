import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { resolveLiveBridgeUrl } from "./smoke-helpers.mjs";

const rootCwd = process.cwd();

function text(result) {
  return result?.content?.find((item) => item.type === "text")?.text || "";
}

async function main() {
  const bridgeUrl = await resolveLiveBridgeUrl();
  const transport = new StdioClientTransport({
    command: `${rootCwd}/node_modules/.bin/tsx`,
    args: ["packages/mcp-server/src/stdio.ts"],
    cwd: rootCwd,
    stderr: "pipe",
    env: {
      ...process.env,
      CODEX_FIGMA_BRIDGE_URL: bridgeUrl
    }
  });

  const client = new Client({ name: "mcp-component-property-smoke", version: "0.2.0" });

  try {
    await client.connect(transport);

  const root = JSON.parse(
    text(
      await client.callTool({
        name: "figma_create_node",
        arguments: {
          nodeType: "FRAME",
          properties: {
            name: "Runtime MCP Property Root",
            width: 320,
            height: 180,
            x: 33400,
            y: 33400
          }
        }
      })
    )
  );

  await client.callTool({
    name: "figma_create_child",
    arguments: {
      parentId: root.node.id,
      nodeType: "TEXT",
      properties: {
        name: "Runtime MCP Property Label",
        text: "Hello",
        x: 24,
        y: 24,
        width: 120,
        height: 24
      }
    }
  });

  const component = JSON.parse(
    text(
      await client.callTool({
        name: "figma_create_component",
        arguments: { nodeId: root.node.id, name: "Runtime MCP Property Component" }
      })
    )
  );

  const added = JSON.parse(
    text(
      await client.callTool({
        name: "figma_add_component_property",
        arguments: {
          nodeId: component.component.id,
          propertyName: "Show Icon",
          type: "BOOLEAN",
          defaultValue: true
        }
      })
    )
  );

  const edited = JSON.parse(
    text(
      await client.callTool({
        name: "figma_edit_component_property",
        arguments: {
          nodeId: component.component.id,
          propertyName: added.propertyName,
          newName: "Has Icon",
          defaultValue: false
        }
      })
    )
  );

  const deleted = JSON.parse(
    text(
      await client.callTool({
        name: "figma_delete_component_property",
        arguments: {
          nodeId: component.component.id,
          propertyName: edited.propertyName
        }
      })
    )
  );

  await client.callTool({
    name: "figma_cleanup_artifacts",
    arguments: {
      namePrefix: "Runtime MCP Property",
      includeNodes: true,
      includeStyles: false,
      includeVariables: false
    }
  });

    console.log(
      JSON.stringify(
        {
          ok: true,
          componentId: component.component.id,
          addedName: added.propertyName,
          editedName: edited.propertyName,
          deleted: deleted.deleted,
          remainingDefinitions: Object.keys(deleted.definitions || {}).length
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
  console.error(
    `component-properties-smoke.failed ${error instanceof Error ? error.message : String(error)}`
  );
  process.exit(1);
});
