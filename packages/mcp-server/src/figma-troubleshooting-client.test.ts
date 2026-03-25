import { describe, expect, it } from "vitest";
import { createFigmaTroubleshootingClient } from "./figma-troubleshooting-client.js";

describe("figma troubleshooting client", () => {
  it("builds a compact troubleshooting summary", async () => {
    const client = createFigmaTroubleshootingClient({
      getActiveRuntime: async () => ({
        runtimeSessionId: "runtime-1",
        editorType: "figjam",
        fileKey: "file-1",
        fileName: "Comm. Design System",
        pageName: "Design System",
        capabilities: ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k"]
      }),
      getDashboard: async () => ({
        health: {
          status: "watch",
          topIssues: [
            { category: "components", severity: "warning", message: "12 duplicate component names detected." }
          ],
          nextActions: ["Resolve duplicate component names."]
        }
      }),
      getReadiness: async () => ({
        status: "watch",
        readyChecks: 8,
        totalChecks: 10,
        blockingIssues: 0,
        warningIssues: 2
      })
    });

    const result = await client.getSummary();

    expect(result).toMatchObject({
      runtime: {
        runtimeSessionId: "runtime-1",
        editorType: "figjam",
        capabilityCount: 11
      },
      dashboard: {
        healthStatus: "watch"
      },
      readiness: {
        status: "watch",
        totalChecks: 10
      }
    });
    expect(result.recommendations).toContain("Run `npm run smoke:mixed-stress -- --iterations=2` before making broader changes.");
    expect(result.recommendations).toContain("Use `npm run smoke:figjam` when validating FigJam primitives and routing.");
    expect(result.recommendations).toContain(
      "Resolve duplicate component names to keep docs, parity, and search deterministic."
    );
  });
});
