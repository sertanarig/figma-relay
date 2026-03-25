import { describe, expect, it } from "vitest";
import { createFigmaBatchBindingsClient } from "./figma-batch-bindings-client.js";

describe("figma batch bindings client", () => {
  it("binds variables one by one and returns collected results", async () => {
    const client = createFigmaBatchBindingsClient({
      executeTool: async (toolName, args) => {
        expect(toolName).toBe("figma_bind_variable");
        return {
          runtimeSessionId: "runtime-1",
          nodeId: args.nodeId,
          field: args.field,
          variableName: args.variableName
        };
      }
    });

    const result = await client.bindVariables({
      bindings: [
        { nodeId: "1:1", field: "width", variableName: "viewport/width" },
        { nodeId: "1:2", field: "paddingLeft", variableName: "page/padding/x" }
      ]
    });

    expect(result).toEqual({
      runtimeSessionId: "runtime-1",
      boundCount: 2,
      results: [
        { runtimeSessionId: "runtime-1", nodeId: "1:1", field: "width", variableName: "viewport/width" },
        { runtimeSessionId: "runtime-1", nodeId: "1:2", field: "paddingLeft", variableName: "page/padding/x" }
      ]
    });
  });
});
