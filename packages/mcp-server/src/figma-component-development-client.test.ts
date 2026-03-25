import { describe, expect, it } from "vitest";
import { createFigmaComponentDevelopmentClient } from "./figma-component-development-client.js";

describe("figma component development client", () => {
  it("returns component details plus screenshot and references", async () => {
    const client = createFigmaComponentDevelopmentClient({
      executeTool: async (toolName) => {
        if (toolName === "figma_get_component_details") {
          return {
            runtimeSessionId: "runtime-1",
            component: {
              id: "123:456",
              key: "checkbox",
              name: "Checkbox 1.0.0",
              propertyNames: ["State", "Value"]
            }
          };
        }
        if (toolName === "figma_take_screenshot") {
          return { dataUrl: "data:image/png;base64,abc" };
        }
        if (toolName === "figma_get_styles") {
          return {
            textStyles: [{ name: "Typography/Body/M" }],
            paintStyles: [],
            effectStyles: []
          };
        }
        if (toolName === "figma_get_variables") {
          return {
            collections: [
              {
                name: "Component",
                variables: [{ name: "checkbox/size" }, { name: "spacing/16" }]
              }
            ]
          };
        }
        throw new Error(`Unexpected tool ${toolName}`);
      }
    });

    const result = await client.getComponentForDevelopment({ componentName: "Checkbox 1.0.0" });

    expect(result.component.name).toBe("Checkbox 1.0.0");
    expect(result.screenshot).toEqual({ dataUrl: "data:image/png;base64,abc" });
    expect(result.references.suggestedVariables).toContain("checkbox/size");
  });
});
