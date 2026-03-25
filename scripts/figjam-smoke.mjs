import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { resolveLiveBridgeUrl } from "./smoke-helpers.mjs";

async function resolveFigJamRuntimeSession() {
  const bridgeUrl = await resolveLiveBridgeUrl();
  const response = await fetch(`${bridgeUrl}/runtimes`);
  const payload = await response.json().catch(() => null);
  const runtimes = Array.isArray(payload?.runtimes) ? payload.runtimes : [];
  const figJamRuntime = runtimes.find((runtime) => runtime?.editorType === "figjam");

  if (!figJamRuntime?.runtimeSessionId) {
    throw new Error("FIGJAM_REQUIRED: no active figjam runtime found");
  }

  return {
    bridgeUrl,
    runtimeSessionId: String(figJamRuntime.runtimeSessionId)
  };
}

function createTransport(bridgeUrl, runtimeSessionId) {
  return new StdioClientTransport({
    command: `${process.cwd()}/node_modules/.bin/tsx`,
    args: ["packages/mcp-server/src/stdio.ts"],
    cwd: process.cwd(),
    stderr: "pipe",
    env: {
      ...process.env,
      CODEX_FIGMA_BRIDGE_URL: bridgeUrl,
      CODEX_FIGMA_RUNTIME_SESSION_ID: runtimeSessionId
    }
  });
}

function getText(result) {
  return result.content.find((item) => item.type === "text")?.text || "{}";
}

async function main() {
  const { bridgeUrl, runtimeSessionId } = await resolveFigJamRuntimeSession();
  const transport = createTransport(bridgeUrl, runtimeSessionId);
  const client = new Client({ name: "figjam-smoke-client", version: "0.0.1" });
  const cleanupNodeIds = [];

  async function call(name, args) {
    const text = getText(await client.callTool({ name, arguments: args }));
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`${name}: ${text}`);
    }
  }

  try {
    await client.connect(transport);

    const status = await call("figma_get_status", {});
    if (status.editorType !== "figjam") {
      throw new Error(`FIGJAM_REQUIRED: selected editorType is ${status.editorType || "unknown"}`);
    }

    const sticky = await call("figma_create_node", {
      nodeType: "STICKY",
      properties: {
        name: "Runtime FigJam Sticky",
        text: "relay figjam smoke",
        x: 36000,
        y: 2000
      }
    });
    cleanupNodeIds.push(sticky.node.id);

    const stickyTarget = await call("figma_create_node", {
      nodeType: "STICKY",
      properties: {
        name: "Runtime FigJam Sticky Target",
        text: "relay figjam target",
        x: 36620,
        y: 2000
      }
    });
    cleanupNodeIds.push(stickyTarget.node.id);

    const shape = await call("figma_create_node", {
      nodeType: "SHAPE_WITH_TEXT",
      properties: {
        name: "Runtime FigJam Shape",
        text: "shape smoke",
        shapeType: "ROUNDED_RECTANGLE",
        x: 36320,
        y: 2000,
        width: 220,
        height: 120
      }
    });
    cleanupNodeIds.push(shape.node.id);

    const table = await call("figma_create_node", {
      nodeType: "TABLE",
      properties: {
        name: "Runtime FigJam Table",
        rows: 2,
        columns: 3,
        x: 36000,
        y: 2240
      }
    });
    cleanupNodeIds.push(table.node.id);

    const codeBlock = await call("figma_create_node", {
      nodeType: "CODE_BLOCK",
      properties: {
        name: "Runtime FigJam Code Block",
        code: "const relay = 'figjam';",
        language: "JAVASCRIPT",
        x: 36320,
        y: 2240
      }
    });
    cleanupNodeIds.push(codeBlock.node.id);

    await call("figma_update_figjam_node", {
      nodeId: sticky.node.id,
      text: "relay figjam smoke updated"
    });
    await call("figma_update_figjam_node", {
      nodeId: shape.node.id,
      text: "shape smoke updated",
      shapeType: "diamond"
    });
    await call("figma_update_figjam_node", {
      nodeId: codeBlock.node.id,
      code: "const relay = 'figjam-updated';",
      language: "ts"
    });

    const stickyNode = await call("figma_get_node", { nodeId: sticky.node.id });
    const shapeNode = await call("figma_get_node", { nodeId: shape.node.id });
    const tableNode = await call("figma_get_node", { nodeId: table.node.id });
    const codeBlockNode = await call("figma_get_node", { nodeId: codeBlock.node.id });

    const connector = await call("figma_create_node", {
      nodeType: "CONNECTOR",
      properties: {
        name: "Runtime FigJam Connector",
        startNodeId: sticky.node.id,
        endNodeId: shape.node.id
      }
    });
    cleanupNodeIds.push(connector.node.id);
    await call("figma_update_figjam_node", {
      nodeId: connector.node.id,
      endNodeId: stickyTarget.node.id
    });
    const connectorNode = await call("figma_get_node", { nodeId: connector.node.id });

    console.log(
      JSON.stringify(
        {
          ok: true,
          runtimeSessionId,
          editorType: status.editorType,
          stickyId: sticky.node.id,
          stickyText: stickyNode.node?.text || null,
          shapeId: shape.node.id,
          shapeType: shapeNode.node?.shapeType || null,
          tableId: table.node.id,
          tableRows: tableNode.node?.table?.rows ?? null,
          tableColumns: tableNode.node?.table?.columns ?? null,
          codeBlockId: codeBlock.node.id,
          codeLanguage: codeBlockNode.node?.language || null,
          codeSnippet: codeBlockNode.node?.code || null,
          connectorId: connector.node.id,
          connectorEndNodeId: connectorNode.node?.connectorEnd?.endpointNodeId || null
        },
        null,
        2
      )
    );
  } finally {
    for (const nodeId of cleanupNodeIds.reverse()) {
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
  console.error(`figjam-smoke.failed ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
