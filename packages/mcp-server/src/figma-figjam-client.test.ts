import { describe, expect, it } from "vitest";
import { createFigmaFigJamClient } from "./figma-figjam-client.js";

describe("figma figjam client", () => {
  it("builds a figjam board summary", async () => {
    const calls: string[] = [];
    const client = createFigmaFigJamClient({
      executeTool: async (toolName) => {
        calls.push(toolName);
        if (toolName === "figma_get_status") {
          return { runtimeSessionId: "runtime-1", editorType: "figjam", fileKey: "file-1" };
        }
        if (toolName === "figma_get_file_context") {
          return { fileName: "Relay Board", pageName: "Workshop" };
        }
        if (toolName === "figma_get_selection") {
          return { selection: [{ id: "1:1", name: "Sticky 1", type: "STICKY" }] };
        }
        if (toolName === "figma_get_file_data") {
          return {
            nodes: [
              { id: "1:1", type: "STICKY", children: [] },
              {
                id: "1:2",
                type: "FRAME",
                children: [
                  { id: "1:3", type: "CODE_BLOCK", children: [] },
                  { id: "1:4", type: "CONNECTOR", children: [] }
                ]
              }
            ]
          };
        }
        throw new Error(`Unexpected tool ${toolName}`);
      }
    });

    const result = await client.getBoard({ depth: 3 });

    expect(calls).toEqual([
      "figma_get_status",
      "figma_get_file_context",
      "figma_get_selection",
      "figma_get_file_data"
    ]);
    expect(result).toMatchObject({
      editorType: "figjam",
      file: {
        fileKey: "file-1",
        fileName: "Relay Board",
        pageName: "Workshop"
      },
      board: {
        depth: 3,
        nodeCount: 4,
        typeCounts: {
          sticky: 1,
          codeBlock: 1,
          connector: 1
        }
      }
    });
  });

  it("rejects non-figjam runtimes", async () => {
    const client = createFigmaFigJamClient({
      executeTool: async (toolName) => {
        if (toolName === "figma_get_status") return { editorType: "figma" };
        if (toolName === "figma_get_file_context") return {};
        if (toolName === "figma_get_selection") return { selection: [] };
        if (toolName === "figma_get_file_data") return { nodes: [] };
        throw new Error(`Unexpected tool ${toolName}`);
      }
    });

    await expect(client.getBoard()).rejects.toThrow("FIGJAM_REQUIRED:figma");
  });
});
