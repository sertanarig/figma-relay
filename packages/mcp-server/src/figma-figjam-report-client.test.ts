import { describe, expect, it } from "vitest";
import { createFigmaFigJamReportClient } from "./figma-figjam-report-client.js";

describe("figma figjam report client", () => {
  it("builds a figjam report payload and markdown", async () => {
    const client = createFigmaFigJamReportClient({
      getBoard: async () => ({
        editorType: "figjam",
        file: {
          fileKey: "file-1",
          fileName: "Brainstorm",
          pageName: "Board"
        },
        selection: [{ id: "1:1", name: "Sticky 1", type: "STICKY" }],
        board: {
          nodeCount: 5,
          typeCounts: {
            sticky: 1,
            shapeWithText: 1,
            connector: 1,
            codeBlock: 1,
            table: 1
          },
          sample: [{ id: "1:1", name: "Sticky 1", type: "STICKY" }]
        }
      }),
      getDashboard: async () => ({
        health: {
          status: "healthy",
          topIssues: []
        }
      })
    });

    const result = await client.generate();

    expect(result).toMatchObject({
      editorType: "figjam",
      file: {
        fileName: "Brainstorm",
        pageName: "Board"
      },
      board: {
        nodeCount: 5,
        typeCounts: {
          sticky: 1,
          codeBlock: 1
        }
      },
      health: {
        status: "healthy"
      }
    });
    expect(result.markdown).toContain("# FigJam Report");
    expect(result.markdown).toContain("- Sticky: 1");
    expect(result.recommendations).toContain("No immediate FigJam-specific action is required.");
  });
});
