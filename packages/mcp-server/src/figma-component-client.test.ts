import { describe, expect, it } from "vitest";
import { createFigmaComponentClient } from "./figma-component-client.js";

describe("figma component client", () => {
  it("returns component metadata plus bound variables", async () => {
    const client = createFigmaComponentClient({
      executeTool: async (toolName) => {
        if (toolName === "figma_get_component_details") {
          return {
            runtimeSessionId: "runtime-1",
            component: {
              id: "123:456",
              key: "checkbox",
              name: "Checkbox 1.0.0",
              propertyNames: ["State"]
            }
          };
        }
        if (toolName === "figma_get_bound_variables") {
          return {
            bindings: [{ field: "width", variableName: "viewport/width" }]
          };
        }
        throw new Error(`Unexpected tool ${toolName}`);
      }
    });

    const result = await client.getComponent({ componentName: "Checkbox 1.0.0" });

    expect(result.component.name).toBe("Checkbox 1.0.0");
    expect(result.bindings).toEqual([{ field: "width", variableName: "viewport/width" }]);
  });
});
