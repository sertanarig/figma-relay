import { describe, expect, it } from "vitest";
import { createFigmaDocDriftClient } from "./figma-doc-drift-client.js";

describe("figma doc drift client", () => {
  it("flags missing property references in a matching documentation section", async () => {
    const client = createFigmaDocDriftClient({
      generateComponentDoc: async (args) => {
        expect(args).toEqual({ componentName: "Checkbox 1.0.0" });
        return {
          component: {
            name: "Checkbox 1.0.0",
            propertyNames: ["State", "Value", "Label"]
          }
        };
      },
      executeTool: async (toolName, args) => {
        if (toolName === "figma_get_file_data") {
          return {
            nodes: [
              { id: "1:1", name: "Checkbox Documentation", type: "FRAME" },
              { id: "1:2", name: "Radio Documentation", type: "FRAME" }
            ]
          };
        }

        if (toolName === "figma_generate_section_report") {
          return {
            section: {
              sampleChildren: [
                { name: "State variants" },
                { name: "Selection scenarios" }
              ]
            }
          };
        }

        throw new Error(`Unexpected tool ${toolName}`);
      }
    });

    const result = await client.detect({ componentName: "Checkbox 1.0.0" });

    expect(result.documentation).toMatchObject({
      name: "Checkbox Documentation"
    });
    expect(result.summary).toMatchObject({
      status: "watch",
      findings: 1,
      missingPropertyMentions: 2
    });
    expect(result.missingPropertyMentions).toEqual(["Value", "Label"]);
  });
});
