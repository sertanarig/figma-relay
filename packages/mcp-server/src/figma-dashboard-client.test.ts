import { afterEach, describe, expect, it, vi } from "vitest";
import { createFigmaDashboardClient } from "./figma-dashboard-client.js";

afterEach(() => {
  vi.useRealTimers();
});

describe("figma dashboard client", () => {
  it("builds a compact dashboard payload", async () => {
    const client = createFigmaDashboardClient({
      getActiveRuntime: async () => ({
        runtimeSessionId: "runtime-1",
        editorType: "figjam",
        fileKey: "file-1",
        fileName: "Comm. Design System",
        pageName: "Design System",
        capabilities: ["runtime.status", "node.read"],
        updatedAt: "2026-03-23T21:00:00.000Z"
      }),
      getSummary: async () => ({
        fileName: "Comm. Design System",
        pageName: "Design System",
        counts: { components: 10, variables: 50, textStyles: 2, effectStyles: 1, paintStyles: 3, gridStyles: 0 },
        sample: {
          components: ["Button/Primary"],
          styles: ["Typography/Body"],
          collections: ["Responsive"]
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
        },
        findings: [{ category: "styles", severity: "warning", message: "No paint styles found." }]
      }),
      executeTool: async (toolName) => {
        if (toolName === "figma_get_design_changes") {
          return {
            events: [{ id: "event-1", type: "NODE_UPDATED" }, { id: "event-2", type: "STYLE_APPLIED" }]
          };
        }
        throw new Error(`Unexpected tool ${toolName}`);
      },
      getFigJam: async () => ({
        board: {
          nodeCount: 4,
          typeCounts: {
            sticky: 1,
            shapeWithText: 1,
            connector: 1,
            codeBlock: 1,
            table: 0
          },
          sample: [{ id: "1:1", type: "STICKY", name: "Sticky" }]
        }
      })
    });

    const result = await client.getDashboard();

    expect(result).toMatchObject({
      runtime: {
        runtimeSessionId: "runtime-1",
        editorType: "figjam",
        fileName: "Comm. Design System"
      },
      summary: {
        fileName: "Comm. Design System",
        counts: {
          components: 10,
          variables: 50
        }
      },
      audit: {
        score: 82
      },
      changes: {
        count: 2
      },
      health: {
        status: "healthy",
        runtimeConnected: true,
        capabilityCount: 2,
        counts: {
          components: 10,
          variables: 50,
          styles: 6
        }
      }
    });
    expect(result.summary.highlights.topComponents).toEqual(["Button/Primary"]);
    expect(result.summary.figJam).toMatchObject({
      nodeCount: 4,
      typeCounts: {
        sticky: 1
      }
    });
    expect(result.summary.highlights.figJamSamples).toHaveLength(1);
    expect(result.health.topIssues).toHaveLength(1);
    expect(result.health.nextActions).toContain(
      "Add or document paint styles if color decisions should be reusable across the system."
    );
    expect(result.panels).toHaveLength(5);
    expect(result.panels[0]).toMatchObject({
      id: "runtime",
      title: "Runtime",
      status: "connected"
    });
    expect(result.panels[0].items).toEqual(
      expect.arrayContaining([{ label: "Editor", value: "figjam" }])
    );
    expect(result.panels[2]).toMatchObject({
      id: "figjam",
      title: "FigJam",
      status: "connected"
    });
  });

  it("reuses cached dashboard dependencies within the ttl window", async () => {
    vi.useFakeTimers();

    const counters = {
      runtime: 0,
      summary: 0,
      audit: 0,
      changes: 0
    };

    const client = createFigmaDashboardClient({
      cacheTtlMs: 1_000,
      getActiveRuntime: async () => {
        counters.runtime += 1;
        return {
          runtimeSessionId: "runtime-1",
          editorType: "figma",
          fileKey: "file-1",
          fileName: "Comm. Design System",
          pageName: "Design System",
          capabilities: ["runtime.status"],
          updatedAt: "2026-03-23T21:00:00.000Z"
        };
      },
      getSummary: async () => {
        counters.summary += 1;
        return {
          fileName: "Comm. Design System",
          pageName: "Design System",
          counts: { components: 10, variables: 50, textStyles: 2, effectStyles: 1, paintStyles: 3, gridStyles: 0 },
          sample: { components: [], styles: [], collections: [] }
        };
      },
      getAudit: async () => {
        counters.audit += 1;
        return { summary: { score: 82, categoryScores: {} }, findings: [] };
      },
      executeTool: async (toolName) => {
        if (toolName === "figma_get_design_changes") {
          counters.changes += 1;
          return { events: [] };
        }
        throw new Error(`Unexpected tool ${toolName}`);
      },
      getFigJam: async () => ({
        board: {
          nodeCount: 0,
          typeCounts: {}
        }
      })
    });

    await client.getDashboard();
    await client.getDashboard();

    expect(counters).toEqual({
      runtime: 1,
      summary: 1,
      audit: 1,
      changes: 1
    });

    vi.advanceTimersByTime(1_001);

    await client.getDashboard();

    expect(counters).toEqual({
      runtime: 2,
      summary: 2,
      audit: 2,
      changes: 2
    });
  });

  it("falls back gracefully when figjam runtime cannot read design-system inventory", async () => {
    const client = createFigmaDashboardClient({
      getActiveRuntime: async () => ({
        runtimeSessionId: "runtime-figjam",
        editorType: "figjam",
        fileKey: "figjam-file",
        fileName: "Workshop Board",
        pageName: "Board",
        capabilities: ["runtime.status", "figjam.read"],
        updatedAt: "2026-03-25T09:00:00.000Z"
      }),
      getSummary: async () => {
        throw new Error("Tool execution failed: figma_get_styles");
      },
      getAudit: async () => {
        throw new Error("Tool execution failed: figma_get_styles");
      },
      executeTool: async () => ({ events: [] }),
      getFigJam: async () => ({
        board: {
          nodeCount: 3,
          typeCounts: {
            sticky: 1,
            shapeWithText: 1,
            connector: 1,
            codeBlock: 0,
            table: 0
          },
          sample: [{ id: "1:1", type: "STICKY", name: "Sticky A" }]
        }
      })
    });

    const result = await client.getDashboard();

    expect(result.summary.fileName).toBe("Workshop Board");
    expect(result.summary.pageName).toBe("Board");
    expect(result.summary.counts).toEqual({});
    expect(result.summary.figJam).toMatchObject({
      nodeCount: 3,
      typeCounts: { sticky: 1 }
    });
    expect(result.health.runtimeConnected).toBe(true);
    expect(result.audit.score).toBeNull();
    expect(result.health.status).toBe("healthy");
  });
});
