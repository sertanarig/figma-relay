import { describe, expect, it } from "vitest";
import { createFigmaComponentImageClient } from "./figma-component-image-client.js";

describe("figma component image client", () => {
  it("returns screenshot payload for a component", async () => {
    const client = createFigmaComponentImageClient({
      executeTool: async (toolName) => {
        if (toolName === "figma_take_screenshot") {
          return { dataUrl: "data:image/png;base64,abc" };
        }
        throw new Error(`Unexpected tool ${toolName}`);
      },
      getComponentDetails: async () => ({
        runtimeSessionId: "runtime-1",
        component: {
          id: "123:456",
          key: "checkbox",
          name: "Checkbox 1.0.0"
        }
      })
    });

    const result = await client.getImage({ componentName: "Checkbox 1.0.0" });

    expect(result.component.name).toBe("Checkbox 1.0.0");
    expect(result.image).toEqual({ dataUrl: "data:image/png;base64,abc" });
  });

  it("falls back to executeTool for component details when helper is absent", async () => {
    const client = createFigmaComponentImageClient({
      executeTool: async (toolName) => {
        if (toolName === "figma_get_component_details") {
          return {
            runtimeSessionId: "runtime-1",
            component: {
              id: "123:789",
              key: "input",
              name: "Input 1.0.0"
            }
          };
        }
        if (toolName === "figma_take_screenshot") {
          return { dataUrl: "data:image/png;base64,xyz" };
        }
        throw new Error(`Unexpected tool ${toolName}`);
      }
    });

    const result = await client.getImage({ componentName: "Input 1.0.0" });

    expect(result.component.name).toBe("Input 1.0.0");
    expect(result.image).toEqual({ dataUrl: "data:image/png;base64,xyz" });
  });
});
