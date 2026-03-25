import { describe, expect, it } from "vitest";
import { createFigmaComponentDocClient } from "./figma-component-doc-client.js";

describe("figma component doc client", () => {
  it("builds a compact component doc from file inventories", async () => {
    const client = createFigmaComponentDocClient({
      executeTool: async (toolName, args) => {
        if (toolName === "figma_get_file_context") {
          return {
            fileName: "Comm. Design System",
            pageName: "Design System"
          };
        }

        if (toolName === "figma_get_components") {
          return {
            components: [
              {
                id: "C:1",
                key: "button-primary",
                name: "Button/Primary",
                setName: "Button",
                propertyNames: ["State", "Size"]
              },
              {
                id: "C:2",
                key: "input-text",
                name: "Input/Text Field",
                setName: "Input",
                propertyNames: ["State"]
              }
            ]
          };
        }

        if (toolName === "figma_get_styles") {
          return {
            textStyles: [{ id: "TS:1", name: "Typography/Body" }],
            paintStyles: [{ id: "PS:1", name: "Color/Primary" }],
            effectStyles: [{ id: "ES:1", name: "Effects/Focus" }],
            gridStyles: []
          };
        }

        if (toolName === "figma_get_variables") {
          return {
            variables: [
              { id: "V:1", name: "color/primary" },
              { id: "V:2", name: "spacing/16" }
            ]
          };
        }

        if (toolName === "figma_get_component_details") {
          return {
            component: {
              id: "C:1",
              key: "button-primary",
              name: "Button/Primary",
              setName: "Button",
              propertyNames: ["State", "Size"],
              nodeType: "COMPONENT",
              width: 120,
              height: 40
            }
          };
        }

        if (toolName === "figma_get_bound_variables") {
          return {
            bindings: [{ field: "width", variableName: "viewport/width" }]
          };
        }

        if (toolName === "figma_take_screenshot") {
          return {
            dataUrl: "data:image/png;base64,abc"
          };
        }

        throw new Error(`Unexpected tool ${toolName} ${JSON.stringify(args)}`);
      }
    });

    const result = await client.generate({
      componentName: "Button/Primary"
    });

    expect(result.component.name).toBe("Button/Primary");
    expect(result.component.setName).toBe("Button");
    expect(result.component.nodeType).toBe("COMPONENT");
    expect(result.summary.propertyCount).toBe(2);
    expect(result.summary.bindingsCount).toBe(1);
    expect(result.summary.hasScreenshot).toBe(true);
    expect(result.summary.exampleCount).toBe(2);
    expect(result.summary.suggestedStyles).toEqual(["Color/Primary", "Effects/Focus", "Typography/Body"]);
    expect(result.summary.suggestedVariables).toEqual(["color/primary", "spacing/16"]);
    expect(result.summary.recommendations).toContain("No immediate documentation issues detected; this component is ready for handoff.");
    expect(result.bindings).toEqual([{ field: "width", variableName: "viewport/width" }]);
    expect(result.screenshot).toEqual({ dataUrl: "data:image/png;base64,abc" });
    expect(result.examples).toHaveLength(2);
    expect(result.markdown).toContain("# Button/Primary");
    expect(result.markdown).toContain("Comm. Design System");
    expect(result.markdown).toContain("State");
    expect(result.markdown).toContain("Bound variables: 1");
    expect(result.markdown).toContain("width -> viewport/width");
    expect(result.markdown).toContain("## Recommendations");
    expect(result.markdown).toContain("## Usage Examples");
    expect(result.examples[1]?.code).toContain('state="..."');
  });
});
