import { describe, expect, it } from "vitest";
import { createFigmaBatchComponentsClient } from "./figma-batch-components-client.js";

describe("figma batch components client", () => {
  it("instantiates components one by one and returns collected results", async () => {
    const client = createFigmaBatchComponentsClient({
      executeTool: async (toolName, args) => {
        expect(toolName).toBe("figma_instantiate_component");
        return {
          runtimeSessionId: "runtime-1",
          instance: {
            id: `instance-${args.nodeId || args.componentKey}`,
            nodeId: args.nodeId || null,
            componentKey: args.componentKey || null
          }
        };
      }
    });

    const result = await client.instantiate({
      instances: [
        { nodeId: "123:456", parentId: "1:1", position: { x: 0, y: 0 } },
        { componentKey: "component-key", parentId: "1:1", position: { x: 100, y: 0 } }
      ]
    });

    expect(result.instantiatedCount).toBe(2);
    expect(result.results).toEqual([
      {
        runtimeSessionId: "runtime-1",
        instance: {
          id: "instance-123:456",
          nodeId: "123:456",
          componentKey: null
        }
      },
      {
        runtimeSessionId: "runtime-1",
        instance: {
          id: "instance-component-key",
          nodeId: null,
          componentKey: "component-key"
        }
      }
    ]);
  });
});
