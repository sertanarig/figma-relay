import { mkdtempSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createFigmaReleaseReadinessTrendClient } from "./figma-release-readiness-trend-client.js";

describe("figma release readiness trend client", () => {
  it("records readiness snapshots and reports improving trends", async () => {
    const cwd = mkdtempSync(path.join(os.tmpdir(), "figma-runtime-mcp-trend-"));
    let auditScore = 70;
    let status = "watch";

    const client = createFigmaReleaseReadinessTrendClient({
      cwd,
      getReadiness: async () => ({
        status,
        file: {
          fileName: "Comm. Design System",
          pageName: "Design System"
        },
        summary: {
          auditScore,
          blockingIssues: 0,
          warningIssues: status === "ready" ? 0 : 1
        }
      })
    });

    const first = await client.getTrend({ limit: 5 });
    auditScore = 85;
    status = "ready";
    const second = await client.getTrend({ limit: 5 });

    expect(first.trend.direction).toBe("new");
    expect(second.trend.direction).toBe("improving");
    expect(second.previous).toMatchObject({
      status: "watch",
      auditScore: 70
    });
    expect(second.current).toMatchObject({
      status: "ready",
      auditScore: 85
    });

    const historyPath = path.join(cwd, ".figma-runtime-mcp", "release-readiness-history.json");
    const saved = JSON.parse(readFileSync(historyPath, "utf8"));
    expect(saved).toHaveLength(2);
  });
});
