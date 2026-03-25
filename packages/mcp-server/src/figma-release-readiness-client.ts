type GetDashboard = () => Promise<any>;
type GetDesignSystemReport = () => Promise<any>;

function gate(key: string, title: string, passed: boolean, detail: string) {
  return { key, title, passed, detail };
}

export function createFigmaReleaseReadinessClient({
  getDashboard,
  getDesignSystemReport
}: {
  getDashboard: GetDashboard;
  getDesignSystemReport: GetDesignSystemReport;
}) {
  return {
    async getReadiness() {
      const [dashboard, report] = await Promise.all([
        getDashboard(),
        getDesignSystemReport()
      ]);

      const topIssues = Array.isArray(dashboard?.health?.topIssues) ? dashboard.health.topIssues : [];
      const auditScore = typeof report?.health?.auditScore === "number" ? report.health.auditScore : null;
      const componentCount = typeof report?.counts?.components === "number" ? report.counts.components : 0;
      const variableCount = typeof report?.counts?.variables === "number" ? report.counts.variables : 0;
      const blockingIssues = topIssues.filter((issue: any) => issue?.severity === "error").length;
      const warningIssues = topIssues.filter((issue: any) => issue?.severity === "warning").length;

      const gates = [
        gate("audit.score", "Audit score is acceptable", typeof auditScore === "number" && auditScore >= 60, `score=${auditScore ?? "n/a"}`),
        gate("issues.blocking", "No blocking design-system issues", blockingIssues === 0, `blocking=${blockingIssues}`),
        gate("inventory.components", "Component inventory exists", componentCount > 0, `components=${componentCount}`),
        gate("inventory.variables", "Variable inventory exists", variableCount > 0, `variables=${variableCount}`)
      ];

      const readyChecks = gates.filter((item) => item.passed).length;
      const totalChecks = gates.length;
      const failed = totalChecks - readyChecks;
      const status = failed === 0
        ? warningIssues > 0 || dashboard?.health?.status === "watch"
          ? "watch"
          : "ready"
        : "not-ready";

      return {
        status,
        file: report?.file || {
          fileName: "Unknown",
          pageName: "Unknown"
        },
        summary: {
          auditScore,
          blockingIssues,
          warningIssues,
          componentCount,
          variableCount
        },
        readyChecks,
        totalChecks,
        blockingIssues,
        warningIssues,
        gates,
        topIssues
      };
    }
  };
}
