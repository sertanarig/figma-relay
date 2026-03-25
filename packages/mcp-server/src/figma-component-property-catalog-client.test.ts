import { describe, expect, it } from "vitest";
import { createFigmaComponentPropertyCatalogClient } from "./figma-component-property-catalog-client.js";

describe("figma component property catalog client", () => {
  it("normalizes raw property names into a readable catalog", async () => {
    const client = createFigmaComponentPropertyCatalogClient({
      getComponentDetails: async () => ({
        runtimeSessionId: "runtime-1",
        component: {
          id: "C:1",
          key: "checkbox",
          name: "Checkbox 1.0.0",
          setName: null,
          propertyNames: [
            "Label#899:160",
            "Helper#899:173",
            "✎ Label#899:186",
            "✎ Helper#899:199",
            "State",
            "Value"
          ]
        }
      })
    });

    const result = await client.getCatalog({
      componentName: "Checkbox 1.0.0"
    });

    expect(result.component.name).toBe("Checkbox 1.0.0");
    expect(result.summary).toEqual({
      propertyCount: 6,
      normalizedPropertyCount: 4,
      textPropertyCount: 2,
      variantPropertyCount: 2,
      collisionCount: 2
    });
    expect(result.properties).toEqual([
      {
        name: "Label",
        rawNames: ["Label#899:160", "✎ Label#899:186"],
        kind: "text",
        occurrences: 2,
        hasNameCollision: true
      },
      {
        name: "Helper",
        rawNames: ["Helper#899:173", "✎ Helper#899:199"],
        kind: "text",
        occurrences: 2,
        hasNameCollision: true
      },
      {
        name: "State",
        rawNames: ["State"],
        kind: "variant",
        occurrences: 1,
        hasNameCollision: false
      },
      {
        name: "Value",
        rawNames: ["Value"],
        kind: "variant",
        occurrences: 1,
        hasNameCollision: false
      }
    ]);
  });
});
