import { describe, expect, it } from "vitest";
import { createFigmaBatchInstancePropertiesClient } from "./figma-batch-instance-properties-client.js";

describe("figma batch instance properties client", () => {
  it("updates multiple component instances", async () => {
    const calls: Array<{ toolName: string; args: Record<string, unknown> }> = [];
    const client = createFigmaBatchInstancePropertiesClient({
      executeTool: async (toolName, args) => {
        calls.push({ toolName, args });
        return {
          runtimeSessionId: "runtime-1",
          nodeId: args.nodeId
        };
      }
    });

    const result = await client.setProperties({
      updates: [
        { nodeId: "1:1", properties: { Label: "One" } },
        { nodeId: "1:2", properties: { Label: "Two" } }
      ]
    });

    expect(result).toMatchObject({
      runtimeSessionId: "runtime-1",
      updatedCount: 2
    });
    expect(calls).toEqual([
      {
        toolName: "figma_set_instance_properties",
        args: { nodeId: "1:1", properties: { Label: "One" } }
      },
      {
        toolName: "figma_set_instance_properties",
        args: { nodeId: "1:2", properties: { Label: "Two" } }
      }
    ]);
  });
});
