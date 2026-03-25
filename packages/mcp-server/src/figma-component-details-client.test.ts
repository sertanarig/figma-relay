import { describe, expect, it } from "vitest";
import { createFigmaComponentDetailsClient } from "./figma-component-details-client.js";

describe("figma component details client", () => {
  it("returns a single component with node metadata", async () => {
    const client = createFigmaComponentDetailsClient({
      executeTool: async (toolName, args) => {
        if (toolName === "figma_get_components") {
          return {
            runtimeSessionId: "runtime-1",
            components: [
              {
                id: "123:456",
                key: "button-primary",
                name: "Button/Primary",
                setName: "Button",
                propertyNames: ["Size", "State"]
              }
            ]
          };
        }
        if (toolName === "figma_get_node") {
          return {
            node: {
              id: String(args.nodeId),
              type: "COMPONENT",
              width: 120,
              height: 40,
              parentId: "component-set-1"
            }
          };
        }
        throw new Error(`Unexpected tool ${toolName}`);
      }
    });

    const result = await client.getDetails({ componentKey: "button-primary" });

    expect(result.component).toMatchObject({
      id: "123:456",
      key: "button-primary",
      name: "Button/Primary",
      setName: "Button",
      nodeType: "COMPONENT",
      width: 120,
      height: 40
    });
  });
});
