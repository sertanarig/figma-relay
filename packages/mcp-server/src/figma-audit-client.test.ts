import { describe, expect, it } from "vitest";
import { createFigmaAuditClient } from "./figma-audit-client.js";

describe("figma audit client", () => {
  it("summarizes design system health from runtime inventories", async () => {
    const calls: string[] = [];
    const client = createFigmaAuditClient({
      executeTool: async (toolName) => {
        calls.push(toolName);

        if (toolName === "figma_get_styles") {
          return {
            textStyles: [{ id: "TS:1", name: "Typography/Body" }],
            effectStyles: [],
            paintStyles: [{ id: "PS:1", name: "Brand/Primary" }, { id: "PS:2", name: "Brand/Primary" }],
            gridStyles: []
          };
        }

        if (toolName === "figma_get_variables") {
          return {
            collections: [{ id: "VC:1", name: "Primitives" }],
            variables: [
              { id: "V:1", name: "color/primary", collectionName: "Primitives" },
              { id: "V:2", name: "spacing/16", collectionName: "Primitives" },
              { id: "V:3", name: "Bad Token", collectionName: "Primitives" },
              { id: "V:4", name: "color/primary", collectionName: "Primitives" }
            ]
          };
        }

        if (toolName === "figma_get_components") {
          return {
            components: [
              { id: "C:1", name: "Button/Primary", setName: "Button", propertyNames: ["State", "Size"] },
              { id: "C:2", name: "Bad Component", setName: null, propertyNames: [] },
              { id: "C:3", name: "Button/Primary", setName: "Button", propertyNames: ["State"] }
            ]
          };
        }

        if (toolName === "figma_get_file_context") {
          return {
            fileKey: "file-key",
            fileName: "Comm. Design System",
            pageName: "Design System"
          };
        }

        throw new Error(`Unexpected tool: ${toolName}`);
      }
    });

    const result = await client.audit();

    expect(calls).toEqual([
      "figma_get_file_context",
      "figma_get_styles",
      "figma_get_variables",
      "figma_get_components"
    ]);
    expect(result.file.fileName).toBe("Comm. Design System");
    expect(result.summary).toEqual({
      styles: 3,
      variables: 4,
      collections: 1,
      components: 3,
      findings: 5,
      suppressedFindings: 0,
      profile: "default",
      categoryScores: {
        naming: 37,
        structure: 100,
        coverage: 100
      },
      score: 72
    });
    expect(result.findings).toEqual([
      {
        category: "variables",
        severity: "warning",
        message: "1 variable names do not follow slash-based token naming."
      },
      {
        category: "components",
        severity: "warning",
        message: "2 component family names do not follow the active naming rules."
      },
      {
        category: "variables",
        severity: "warning",
        message: "1 duplicate variable names detected."
      },
      {
        category: "components",
        severity: "warning",
        message: "1 duplicate component names detected."
      },
      {
        category: "styles",
        severity: "warning",
        message: "1 duplicate style names detected."
      }
    ]);
  });

  it("uses release profile heuristics to reduce false positives for versioned families", async () => {
    const client = createFigmaAuditClient({
      executeTool: async (toolName) => {
        if (toolName === "figma_get_styles") {
          return {
            textStyles: [{ id: "TS:1", name: "Typography/Body" }],
            effectStyles: [],
            paintStyles: [],
            gridStyles: []
          };
        }

        if (toolName === "figma_get_variables") {
          return {
            collections: [{ id: "VC:1", name: "Responsive" }],
            variables: [{ id: "V:1", name: "page/padding/x", collectionName: "Responsive" }]
          };
        }

        if (toolName === "figma_get_components") {
          return {
            components: [
              { id: "C:1", name: "Checkbox 1.0.0", setName: null, propertyNames: ["State"] },
              { id: "C:2", name: "Checkbox 1.0.0 / Default", setName: "Checkbox 1.0.0", propertyNames: [] },
              { id: "C:3", name: "Runtime MCP Temp Card", setName: null, propertyNames: [] }
            ]
          };
        }

        if (toolName === "figma_get_file_context") {
          return {
            fileKey: "file-key",
            fileName: "Comm. Design System",
            pageName: "Design System"
          };
        }

        throw new Error(`Unexpected tool: ${toolName}`);
      }
    });

    const result = await client.audit({ profile: "release" });

    expect(result.summary.profile).toBe("release");
    expect(result.findings.find((item: any) => item.category === "components" && item.severity === "warning")).toBeUndefined();
    expect(result.findings.find((item: any) => String(item.message).includes("multi-variant component families"))).toBeUndefined();
  });

  it("flattens collection-scoped variables when the runtime omits a top-level variable list", async () => {
    const client = createFigmaAuditClient({
      executeTool: async (toolName) => {
        if (toolName === "figma_get_styles") {
          return {
            textStyles: [{ id: "TS:1", name: "Typography/Body" }],
            effectStyles: [],
            paintStyles: [{ id: "PS:1", name: "Brand/Primary" }],
            gridStyles: []
          };
        }

        if (toolName === "figma_get_variables") {
          return {
            collections: [
              {
                id: "VC:1",
                name: "Responsive",
                variables: [
                  { id: "V:1", name: "page/padding/x" },
                  { id: "V:2", name: "page/padding/y" }
                ]
              }
            ]
          };
        }

        if (toolName === "figma_get_components") {
          return {
            components: [{ id: "C:1", name: "Button/Primary", setName: null, propertyNames: ["State"] }]
          };
        }

        if (toolName === "figma_get_file_context") {
          return {
            fileKey: "file-key",
            fileName: "Comm. Design System",
            pageName: "Design System"
          };
        }

        throw new Error(`Unexpected tool: ${toolName}`);
      }
    });

    const result = await client.audit({ profile: "release" });

    expect(result.summary.variables).toBe(2);
    expect(result.summary.collections).toBe(1);
  });

  it("suppresses waived findings and reports them separately", async () => {
    const client = createFigmaAuditClient({
      listWaivers: async () => [
        {
          id: "waiver-1",
          fileKey: "file-key",
          profile: "release",
          category: "styles",
          messagePattern: "No paint styles found",
          createdAt: "2026-03-24T00:00:00.000Z"
        }
      ],
      executeTool: async (toolName) => {
        if (toolName === "figma_get_styles") {
          return {
            textStyles: [{ id: "TS:1", name: "Typography/Body" }],
            effectStyles: [],
            paintStyles: [],
            gridStyles: []
          };
        }
        if (toolName === "figma_get_variables") {
          return {
            collections: [{ id: "VC:1", name: "Responsive", variables: [{ id: "V:1", name: "page/padding/x" }] }]
          };
        }
        if (toolName === "figma_get_components") {
          return {
            components: [{ id: "C:1", name: "Checkbox 1.0.0", setName: null, propertyNames: ["State"] }]
          };
        }
        if (toolName === "figma_get_file_context") {
          return {
            fileKey: "file-key",
            fileName: "Comm. Design System",
            pageName: "Design System"
          };
        }
        throw new Error(`Unexpected tool: ${toolName}`);
      }
    });

    const result = await client.audit({ profile: "release" });

    expect(result.findings.find((item: any) => String(item.message).includes("No paint styles found"))).toBeUndefined();
    expect(result.summary.suppressedFindings).toBe(1);
    expect(result.waivers.suppressed).toEqual([
      {
        waiverId: "waiver-1",
        category: "styles",
        message: "No paint styles found in the active file."
      }
    ]);
  });
});
