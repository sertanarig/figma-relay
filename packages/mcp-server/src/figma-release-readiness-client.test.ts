import { describe, expect, it } from "vitest";
import { createFigmaReleaseReadinessClient } from "./figma-release-readiness-client.js";

describe("figma release readiness client", () => {
  it("builds readiness gates from dashboard and design-system report", async () => {
    const client = createFigmaReleaseReadinessClient({
      getDashboard: async () => ({
        health: {
          status: "watch",
          topIssues: [
            { severity: "warning", category: "components", message: "Duplicate component names detected." }
          ]
        }
      }),
      getDesignSystemReport: async () => ({
        file: {
          fileName: "Comm. Design System",
          pageName: "Design System"
        },
        health: {
          auditScore: 74
        },
        counts: {
          components: 389,
          variables: 299
        }
      })
    });

    const result = await client.getReadiness();

    expect(result).toMatchObject({
      status: "watch",
      file: {
        fileName: "Comm. Design System"
      },
      summary: {
        auditScore: 74,
        blockingIssues: 0,
        warningIssues: 1
      },
      readyChecks: 4,
      totalChecks: 4,
      blockingIssues: 0,
      warningIssues: 1
    });
    expect(result.gates).toHaveLength(4);
    expect(result.gates.find((gate: any) => gate.key === "inventory.components")?.passed).toBe(true);
  });
});
