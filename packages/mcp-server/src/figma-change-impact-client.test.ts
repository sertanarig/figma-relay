import { describe, expect, it } from "vitest";
import { createFigmaChangeImpactClient } from "./figma-change-impact-client.js";

describe("figma change impact client", () => {
  it("summarizes recent change events into impacted areas and checks", async () => {
    const client = createFigmaChangeImpactClient({
      executeTool: async (toolName, args) => {
        if (toolName === "figma_get_design_changes") {
          expect(args).toEqual({ limit: 5 });
          return {
            runtimeSessionId: "runtime-1",
            events: [
              { id: "1", nodeId: "10:1", type: "NODE_UPDATED" },
              { id: "2", nodeId: "10:2", type: "STYLE_APPLIED" },
              { id: "3", nodeId: "10:3", type: "COMMENT_CREATED" }
            ]
          };
        }

        if (toolName === "figma_get_file_data") {
          return {
            nodes: [
              { id: "10:1", name: "Button/Primary", type: "COMPONENT" },
              { id: "10:2", name: "Typography/Body", type: "TEXT" },
              { id: "10:3", name: "Dropdown Documentation", type: "FRAME" }
            ]
          };
        }

        throw new Error(`Unexpected tool ${toolName}`);
      }
    });

    const result = await client.generate({ limit: 5 });

    expect(result.summary).toEqual({
      totalEvents: 3,
      impactedAreas: 3,
      impactedNodes: 3
    });
    expect(result.impactedAreas).toEqual([
      { area: "nodes", count: 1 },
      { area: "styles", count: 1 },
      { area: "comments", count: 1 }
    ]);
    expect(result.topEventTypes).toEqual([
      { type: "NODE_UPDATED", count: 1 },
      { type: "STYLE_APPLIED", count: 1 },
      { type: "COMMENT_CREATED", count: 1 }
    ]);
    expect(result.recommendedChecks).toContain("npm run smoke:e2e");
    expect(result.recommendedChecks).toContain("npm run smoke:styles");
    expect(result.recommendedChecks).toContain("npm run smoke:comments");
  });
});
