import { describe, expect, it } from "vitest";
import { createFigmaBatchStyleClient } from "./figma-batch-style-client.js";

describe("figma batch style client", () => {
  it("applies styles one by one and returns collected results", async () => {
    const client = createFigmaBatchStyleClient({
      executeTool: async (toolName, args) => {
        expect(toolName).toBe("figma_apply_style");
        return {
          runtimeSessionId: "runtime-1",
          nodeId: args.nodeId,
          styleType: args.styleType,
          styleId: args.styleId
        };
      }
    });

    const result = await client.applyStyles({
      applications: [
        { nodeId: "1:1", styleType: "text", styleId: "S:1" },
        { nodeId: "1:2", styleType: "paint", styleId: "S:2" }
      ]
    });

    expect(result).toEqual({
      runtimeSessionId: "runtime-1",
      appliedCount: 2,
      results: [
        { runtimeSessionId: "runtime-1", nodeId: "1:1", styleType: "text", styleId: "S:1" },
        { runtimeSessionId: "runtime-1", nodeId: "1:2", styleType: "paint", styleId: "S:2" }
      ]
    });
  });
});
