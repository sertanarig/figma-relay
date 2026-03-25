import { afterEach, describe, expect, it, vi } from "vitest";
import { createFigmaDesignSystemReportClient } from "./figma-design-system-report-client.js";

afterEach(() => {
  vi.useRealTimers();
});

describe("figma design system report client", () => {
  it("builds a compact report payload and markdown", async () => {
    const client = createFigmaDesignSystemReportClient({
      getSummary: async () => ({
        fileName: "Comm. Design System",
        pageName: "Design System",
        counts: {
          components: 10,
          variables: 50,
          variableCollections: 3,
          textStyles: 4,
          paintStyles: 2,
          effectStyles: 1,
          gridStyles: 0
        }
      }),
      getDashboard: async () => ({
        runtime: {
          editorType: "figma"
        },
        health: {
          status: "watch",
          topIssues: [{ severity: "warning", category: "styles", message: "No paint styles found." }]
        },
        summary: {
          highlights: {
            topComponents: ["Button/Primary"],
            topStyles: ["Typography/Body"],
            topCollections: ["Responsive"]
          },
          figJam: {
            nodeCount: 4,
            typeCounts: {
              sticky: 1,
              shapeWithText: 1,
              connector: 1,
              codeBlock: 1,
              table: 0
            }
          }
        },
        audit: {
          score: 82
        }
      }),
      getAudit: async () => ({
        summary: {
          score: 82,
          categoryScores: {
            naming: 90,
            structure: 75,
            coverage: 80
          }
        }
      }),
      browseTokens: async () => ({
        collections: [{ name: "Responsive", variableCount: 12 }]
      }),
      browseDesignSystem: async () => ({
        componentGroups: [{ group: "Button", count: 4 }],
        styleGroups: [{ group: "Typography", count: 3 }]
      })
    });

    const result = await client.generate();

    expect(result).toMatchObject({
      file: {
        fileName: "Comm. Design System",
        pageName: "Design System",
        editorType: "figma"
      },
      health: {
        status: "watch",
        auditScore: 82
      },
      counts: {
        components: 10,
        variables: 50
      },
      categoryScores: {
        naming: 90
      }
    });
    expect(result.markdown).toContain("# Design System Report");
    expect(result.markdown).toContain("- Editor: figma");
    expect(result.markdown).toContain("Button/Primary");
    expect(result.markdown).toContain("## Recommended Actions");
    expect(result.health.recommendedActions).toContain(
      "Resolve the top warnings before marking this file release-ready."
    );
  });

  it("reuses cached report dependencies within the ttl window", async () => {
    vi.useFakeTimers();

    const counters = {
      summary: 0,
      dashboard: 0,
      audit: 0,
      tokens: 0,
      browser: 0
    };

    const client = createFigmaDesignSystemReportClient({
      cacheTtlMs: 1_000,
      getSummary: async () => {
        counters.summary += 1;
        return {
          fileName: "Comm. Design System",
          pageName: "Design System",
          counts: {
            components: 10,
            variables: 50,
            variableCollections: 3,
            textStyles: 4,
            paintStyles: 2,
            effectStyles: 1,
            gridStyles: 0
          }
        };
      },
      getDashboard: async () => {
        counters.dashboard += 1;
        return {
          runtime: {
            editorType: "figma"
          },
          health: {
            status: "watch",
            topIssues: []
          },
          summary: {
            highlights: {
              topComponents: [],
              topStyles: [],
              topCollections: []
            }
          },
          audit: {
            score: 82
          }
        };
      },
      getAudit: async () => {
        counters.audit += 1;
        return {
          summary: {
            score: 82,
            categoryScores: {
              naming: 90,
              structure: 75,
              coverage: 80
            }
          }
        };
      },
      browseTokens: async () => {
        counters.tokens += 1;
        return { collections: [] };
      },
      browseDesignSystem: async () => {
        counters.browser += 1;
        return { componentGroups: [], styleGroups: [] };
      }
    });

    await client.generate();
    await client.generate();

    expect(counters).toEqual({
      summary: 1,
      dashboard: 1,
      audit: 1,
      tokens: 1,
      browser: 1
    });

    vi.advanceTimersByTime(1_001);

    await client.generate();

    expect(counters).toEqual({
      summary: 2,
      dashboard: 2,
      audit: 2,
      tokens: 2,
      browser: 2
    });
  });

  it("builds a figjam-first report even when design-system inventory calls fail", async () => {
    const client = createFigmaDesignSystemReportClient({
      getSummary: async () => {
        throw new Error("Tool execution failed: figma_get_styles");
      },
      getDashboard: async () => ({
        runtime: {
          editorType: "figjam"
        },
        health: {
          status: "healthy",
          topIssues: []
        },
        summary: {
          fileName: "Workshop Board",
          pageName: "Board",
          highlights: {
            topComponents: [],
            topStyles: [],
            topCollections: [],
            figJamSamples: ["Sticky A"]
          },
          figJam: {
            nodeCount: 5,
            typeCounts: {
              sticky: 2,
              shapeWithText: 1,
              connector: 1,
              codeBlock: 1,
              table: 0
            },
            sample: [{ id: "1:1", type: "STICKY", name: "Sticky A" }]
          }
        },
        audit: {
          score: null
        }
      }),
      getAudit: async () => {
        throw new Error("Tool execution failed: figma_get_styles");
      },
      browseTokens: async () => {
        throw new Error("Tool execution failed: figma_get_variables");
      },
      browseDesignSystem: async () => {
        throw new Error("Tool execution failed: figma_get_components");
      }
    });

    const result = await client.generate();

    expect(result.file).toMatchObject({
      fileName: "Workshop Board",
      pageName: "Board",
      editorType: "figjam"
    });
    expect(result.figJam).toMatchObject({
      nodeCount: 5,
      typeCounts: { sticky: 2 }
    });
    expect(result.health.recommendedActions[0]).toContain("FigJam board summary");
    expect(result.markdown).toContain("## FigJam Board");
    expect(result.markdown).toContain("- File: Workshop Board");
  });
});
