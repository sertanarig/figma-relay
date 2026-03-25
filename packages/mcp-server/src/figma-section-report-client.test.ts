import { describe, expect, it } from "vitest";
import { createFigmaSectionReportClient } from "./figma-section-report-client.js";

describe("figma section report client", () => {
  it("builds a compact section report from verification and file data", async () => {
    const client = createFigmaSectionReportClient({
      generateVerification: async (args) => ({
        runtimeSessionId: "runtime-1",
        summary: {
          score: 88,
          readinessStatus: "watch",
          findings: 1,
          bindingCount: 2,
          childCount: 3,
          recommendations: 1,
          severityBreakdown: {
            warning: 1,
            info: 0
          }
        },
        node: {
          id: String(args.nodeId),
          name: "Section/Buttons",
          type: "FRAME"
        },
        findings: [
          {
            category: "bindings",
            severity: "warning",
            message: "Layout-capable node has no variable bindings."
          }
        ],
        recommendations: ["Bind responsive variables."]
      }),
      executeTool: async (toolName, args) => {
        if (toolName === "figma_get_file_data") {
          const payload = args as any;
          return {
            runtimeSessionId: "runtime-1",
            fileName: "Comm. Design System",
            page: {
              id: "700:7843",
              name: "Design System"
            },
            nodes: [
              {
                id: String((payload.nodeIds || [])[0]),
                name: "Section/Buttons",
                type: "FRAME",
                nodes: [
                  { id: "1:2", name: "Button/Primary", type: "COMPONENT" },
                  { id: "1:3", name: "Button/Secondary", type: "COMPONENT" },
                  { id: "1:4", name: "Guidance", type: "TEXT" }
                ]
              }
            ]
          };
        }

        throw new Error(`Unexpected tool ${toolName}`);
      }
    });

    const result = await client.generate({
      nodeId: "1:1",
      depth: 2
    });

    expect(result).toMatchObject({
      file: {
        fileName: "Comm. Design System",
        pageName: "Design System"
      },
      section: {
        nodeId: "1:1",
        name: "Section/Buttons",
        type: "FRAME",
        directChildren: 3
      },
      verification: {
        score: 88,
        readinessStatus: "watch",
        findings: 1,
        severityBreakdown: {
          warning: 1,
          info: 0
        },
        recommendations: 1
      }
    });
    expect(result.markdown).toContain("# Section Report");
    expect(result.markdown).toContain("Button/Primary");
    expect(result.markdown).toContain("- Readiness: watch");
  });
});
