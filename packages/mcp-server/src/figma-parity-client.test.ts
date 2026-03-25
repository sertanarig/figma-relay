import { describe, expect, it } from "vitest";
import { createFigmaParityClient } from "./figma-parity-client.js";

describe("figma parity client", () => {
  it("compares expected names against current figma inventories", async () => {
    const client = createFigmaParityClient({
      executeTool: async (toolName) => {
        if (toolName === "figma_get_styles") {
          return {
            textStyles: [{ id: "TS:1", name: "Typography/Body" }],
            paintStyles: [{ id: "PS:1", name: "Color/Primary" }],
            effectStyles: [],
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

        if (toolName === "figma_get_components") {
          return {
            components: [
              { id: "C:1", name: "Button/Primary" },
              { id: "C:2", name: "Input/Text Field" }
            ]
          };
        }

        throw new Error(`Unexpected tool ${toolName}`);
      }
    });

    const result = await client.check({
      expectedComponents: ["Button/Primary", "Checkbox/Default"],
      expectedVariables: ["color/primary", "spacing/24"],
      expectedStyles: ["Typography/Body", "Color/Primary", "Effects/Focus"]
    });

    expect(result.summary).toEqual({
      checked: 7,
      matched: 4,
      missing: 3,
      extra: 2,
      score: 57,
      categories: {
        components: {
          checked: 2,
          matched: 1,
          missing: 1,
          extra: 1,
          score: 50
        },
        variables: {
          checked: 2,
          matched: 1,
          missing: 1,
          extra: 1,
          score: 50
        },
        styles: {
          checked: 3,
          matched: 2,
          missing: 1,
          extra: 0,
          score: 67
        }
      }
    });
    expect(result.components.missing).toEqual(["Checkbox/Default"]);
    expect(result.components.extra).toEqual(["Input/Text Field"]);
    expect(result.variables.missing).toEqual(["spacing/24"]);
    expect(result.styles.missing).toEqual(["Effects/Focus"]);
  });

  it("matches names case-insensitively to reduce false positives", async () => {
    const client = createFigmaParityClient({
      executeTool: async (toolName) => {
        if (toolName === "figma_get_styles") {
          return {
            textStyles: [{ id: "TS:1", name: "Typography/Body" }],
            paintStyles: [{ id: "PS:1", name: "Color/Primary" }],
            effectStyles: [],
            gridStyles: []
          };
        }

        if (toolName === "figma_get_variables") {
          return {
            variables: [{ id: "V:1", name: "color/primary" }]
          };
        }

        if (toolName === "figma_get_components") {
          return {
            components: [{ id: "C:1", name: "Button/Primary" }]
          };
        }

        throw new Error(`Unexpected tool ${toolName}`);
      }
    });

    const result = await client.check({
      expectedComponents: ["button/primary"],
      expectedVariables: ["COLOR/PRIMARY"],
      expectedStyles: ["color/primary"]
    });

    expect(result.summary.score).toBe(100);
    expect(result.components.missing).toEqual([]);
    expect(result.variables.missing).toEqual([]);
    expect(result.styles.missing).toEqual([]);
  });
});
