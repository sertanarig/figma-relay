type GetActiveRuntime = () => Promise<{
  runtimeSessionId: string;
  editorType?: string;
  fileKey?: string;
  fileName?: string;
  pageName?: string;
  capabilities?: string[];
  updatedAt?: string;
} | null>;

type GetDashboard = () => Promise<any>;
type GetReadiness = () => Promise<any>;

export function createFigmaTroubleshootingClient({
  getActiveRuntime,
  getDashboard,
  getReadiness
}: {
  getActiveRuntime: GetActiveRuntime;
  getDashboard: GetDashboard;
  getReadiness: GetReadiness;
}) {
  return {
    async getSummary() {
      const [runtime, dashboard, readiness] = await Promise.all([
        getActiveRuntime().catch(() => null),
        getDashboard().catch(() => null),
        getReadiness().catch(() => null)
      ]);

      const capabilityCount = Array.isArray(runtime?.capabilities) ? runtime.capabilities.length : 0;
      const editorType = runtime?.editorType || "figma";
      const healthStatus = dashboard?.health?.status || "unknown";
      const readinessStatus = readiness?.status || "unknown";
      const topIssues = Array.isArray(dashboard?.health?.topIssues) ? dashboard.health.topIssues.slice(0, 5) : [];

      const recommendations: string[] = [];

      if (!runtime?.runtimeSessionId) {
        recommendations.push("Open the Figma Relay plugin and confirm the runtime reconnects.");
        recommendations.push("Run `npm run bridge:doctor` to confirm the local bridge is healthy.");
      }

      if (runtime?.runtimeSessionId && editorType === "figjam") {
        recommendations.push("Use `npm run smoke:figjam` when validating FigJam primitives and routing.");
      }

      if (runtime?.runtimeSessionId && capabilityCount < 10) {
        recommendations.push("Refresh the plugin session so the full capability set is advertised again.");
      }

      if (healthStatus === "needs-attention" || readinessStatus === "not-ready") {
        recommendations.push("Run `npm run release:summary` and address the top blockers before continuing.");
      } else if (healthStatus === "watch" || readinessStatus === "watch") {
        recommendations.push("Run `npm run smoke:mixed-stress -- --iterations=2` before making broader changes.");
      }

      if (topIssues.some((issue: any) => /duplicate component names/i.test(String(issue?.message || "")))) {
        recommendations.push("Resolve duplicate component names to keep docs, parity, and search deterministic.");
      }

      if (recommendations.length === 0) {
        recommendations.push("No immediate troubleshooting action is required.");
      }

      return {
        runtime: runtime
          ? {
              runtimeSessionId: runtime.runtimeSessionId,
              editorType,
              fileKey: runtime.fileKey || null,
              fileName: runtime.fileName || null,
              pageName: runtime.pageName || null,
              capabilityCount
            }
          : null,
        dashboard: dashboard
          ? {
              healthStatus,
              topIssues,
              nextActions: Array.isArray(dashboard?.health?.nextActions) ? dashboard.health.nextActions.slice(0, 5) : []
            }
          : null,
        readiness: readiness
          ? {
              status: readiness.status || "unknown",
              readyChecks: readiness.readyChecks ?? 0,
              totalChecks: readiness.totalChecks ?? 0,
              blockingIssues: readiness.blockingIssues ?? 0,
              warningIssues: readiness.warningIssues ?? 0
            }
          : null,
        recommendations
      };
    }
  };
}
