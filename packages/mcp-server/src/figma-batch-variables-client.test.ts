import { describe, expect, it } from "vitest";
import { createFigmaBatchVariablesClient } from "./figma-batch-variables-client.js";

describe("figma batch variables client", () => {
  it("creates variables one by one and returns collected results", async () => {
    const createdNames: string[] = [];
    const client = createFigmaBatchVariablesClient({
      executeTool: async (toolName, args) => {
        expect(toolName).toBe("figma_create_variable");
        createdNames.push(String(args.name));
        return {
          runtimeSessionId: "runtime-1",
          variable: {
            id: `var-${createdNames.length}`,
            name: args.name,
            resolvedType: args.resolvedType
          }
        };
      }
    });

    const result = await client.createVariables({
      collectionId: "VC:1",
      variables: [
        { name: "color/primary", resolvedType: "COLOR" },
        { name: "spacing/16", resolvedType: "FLOAT" }
      ]
    });

    expect(createdNames).toEqual(["color/primary", "spacing/16"]);
    expect(result).toEqual({
      runtimeSessionId: "runtime-1",
      createdCount: 2,
      variables: [
        { id: "var-1", name: "color/primary", resolvedType: "COLOR" },
        { id: "var-2", name: "spacing/16", resolvedType: "FLOAT" }
      ]
    });
  });
});
