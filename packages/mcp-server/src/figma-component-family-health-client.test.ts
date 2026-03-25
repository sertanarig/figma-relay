import { describe, expect, it } from "vitest";
import { createFigmaComponentFamilyHealthClient } from "./figma-component-family-health-client.js";

describe("figma component family health client", () => {
  it("builds a family-level score from inventory and property catalog", async () => {
    const client = createFigmaComponentFamilyHealthClient({
      executeTool: async (toolName) => {
        if (toolName === "figma_get_components") {
          return {
            runtimeSessionId: "runtime-1",
            components: [
              {
                id: "1:1",
                key: "checkbox-a",
                name: "Checkbox 1.0.0",
                setName: null,
                propertyNames: ["State", "Value"]
              },
              {
                id: "1:2",
                key: "checkbox-b",
                name: "State=Normal, Value=Unchecked",
                setName: "Checkbox 1.0.0",
                propertyNames: []
              },
              {
                id: "1:3",
                key: "button-a",
                name: "Button/Primary",
                setName: "Button",
                propertyNames: ["State"]
              }
            ]
          };
        }
        throw new Error(`Unexpected tool`);
      },
      getComponentPropertyCatalog: async () => ({
        runtimeSessionId: "runtime-1",
        summary: {
          collisionCount: 1,
          variantPropertyCount: 2,
          textPropertyCount: 1
        }
      })
    });

    const result = await client.getHealth({
      componentName: "Checkbox 1.0.0"
    });

    expect(result.family).toMatchObject({
      name: "Checkbox",
      count: 2
    });
    expect(result.summary).toMatchObject({
      status: "ready",
      duplicateCount: 0,
      zeroPropertyCount: 0,
      variantMemberCount: 1,
      collisionCount: 1,
      variantPropertyCount: 2,
      textPropertyCount: 1
    });
    expect(result.findings).toHaveLength(2);
    expect(result.recommendations[0]).toContain("Align component property names");
  });
});
