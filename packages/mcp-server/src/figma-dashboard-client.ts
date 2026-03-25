type ExecuteTool = (toolName: string, args: Record<string, unknown>) => Promise<any>;
type GetActiveRuntime = () => Promise<{
  runtimeSessionId: string;
  editorType?: string;
  fileKey?: string;
  fileName?: string;
  pageName?: string;
  capabilities?: string[];
  updatedAt?: string;
} | null>;
type GetSummary = () => Promise<any>;
type GetAudit = (options?: { profile?: "default" | "release" }) => Promise<any>;
type GetFigJam = () => Promise<any>;
type CacheEntry = {
  value: Promise<any>;
  expiresAt: number;
};

function normalizeNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function buildNextActions(options: {
  runtimeConnected: boolean;
  capabilityCount: number;
  topIssues: Array<{ category: string; severity: string; message: string }>;
  counts: {
    components: number;
    variables: number;
    styles: number;
  };
}) {
  const actions: string[] = [];

  if (!options.runtimeConnected) {
    actions.push("Reconnect the active Figma runtime before attempting live reads or writes.");
  }

  if (options.capabilityCount < 10) {
    actions.push("Refresh the plugin session so the full capability surface is advertised.");
  }

  const duplicateComponentIssue = options.topIssues.find(
    (issue) => issue.category === "components" && /duplicate component names/i.test(issue.message)
  );
  if (duplicateComponentIssue) {
    actions.push("Resolve duplicate component names to reduce authoring ambiguity and parity drift.");
  }

  const missingPaintStylesIssue = options.topIssues.find(
    (issue) => issue.category === "styles" && /no paint styles/i.test(issue.message)
  );
  if (missingPaintStylesIssue) {
    actions.push("Add or document paint styles if color decisions should be reusable across the system.");
  }

  if (options.counts.components > 0 && options.counts.styles === 0) {
    actions.push("Review whether this file intentionally avoids local styles or if style extraction is missing.");
  }

  if (actions.length === 0) {
    actions.push("No urgent action is required; continue with normal design-system maintenance.");
  }

  return actions.slice(0, 5);
}

export function createFigmaDashboardClient({
  executeTool,
  getActiveRuntime,
  getSummary,
  getAudit,
  getFigJam,
  cacheTtlMs = 5_000
}: {
  executeTool: ExecuteTool;
  getActiveRuntime: GetActiveRuntime;
  getSummary: GetSummary;
  getAudit: GetAudit;
  getFigJam?: GetFigJam;
  cacheTtlMs?: number;
}) {
  let dashboardCache: CacheEntry | null = null;

  return {
    async getDashboard(options: { refresh?: boolean } = {}) {
      const now = Date.now();
      if (!options.refresh && dashboardCache && dashboardCache.expiresAt > now) {
        return dashboardCache.value;
      }

      const dashboardValue = (async () => {
        const runtime: Awaited<ReturnType<GetActiveRuntime>> = await getActiveRuntime().catch(() => null);
        const isFigJam = runtime?.editorType === "figjam";
        const figJamPromise =
          getFigJam && runtime?.editorType === "figjam" ? getFigJam().catch(() => null) : Promise.resolve(null);
        const [summary, audit, changes, figJam] = await Promise.all([
          isFigJam ? getSummary().catch(() => null) : getSummary(),
          isFigJam ? getAudit({ profile: "release" }).catch(() => null) : getAudit({ profile: "release" }),
          executeTool("figma_get_design_changes", { limit: 10 }).catch(() => null),
          figJamPromise
        ]);

        const events = Array.isArray(changes?.events) ? changes.events : [];
        const counts = summary?.counts || {};
        const categoryScores = audit?.summary?.categoryScores || {};
        const auditScore = audit?.summary?.score ?? null;
        const healthStatus =
          typeof auditScore === "number"
            ? auditScore >= 80
              ? "healthy"
              : auditScore >= 60
                ? "watch"
                : "needs-attention"
            : isFigJam
              ? runtime?.runtimeSessionId
                ? "healthy"
                : "disconnected"
            : "unknown";
        const topIssues = Array.isArray(audit?.findings)
          ? audit.findings.slice(0, 3).map((finding: any) => ({
              category: finding?.category || "unknown",
              severity: finding?.severity || "info",
              message: finding?.message || "No message"
            }))
          : [];
        const sample = summary?.sample || {};
        const highlights = {
          topComponents: Array.isArray(sample.components) ? sample.components.slice(0, 5) : [],
          topStyles: Array.isArray(sample.styles) ? sample.styles.slice(0, 5) : [],
          topCollections: Array.isArray(sample.collections) ? sample.collections.slice(0, 5) : [],
          figJamSamples: Array.isArray(figJam?.board?.sample) ? figJam.board.sample.slice(0, 5) : []
        };
        const capabilityCount = Array.isArray(runtime?.capabilities) ? runtime.capabilities.length : 0;
        const styleCount =
          normalizeNumber(counts.textStyles) +
          normalizeNumber(counts.effectStyles) +
          normalizeNumber(counts.paintStyles) +
          normalizeNumber(counts.gridStyles);
        const nextActions = buildNextActions({
          runtimeConnected: Boolean(runtime?.runtimeSessionId),
          capabilityCount,
          topIssues,
          counts: {
            components: normalizeNumber(counts.components),
            variables: normalizeNumber(counts.variables),
            styles: styleCount
          }
        });
        const panels = [
          {
            id: "runtime",
            title: "Runtime",
            status: runtime?.runtimeSessionId ? "connected" : "disconnected",
            items: [
              { label: "Session", value: runtime?.runtimeSessionId || "None" },
              { label: "Editor", value: runtime?.editorType || "figma" },
              { label: "Capabilities", value: capabilityCount },
              { label: "Updated", value: runtime?.updatedAt || "Unknown" }
            ]
          },
          {
            id: "inventory",
            title: "Inventory",
            status: healthStatus,
            items: [
              { label: "Components", value: normalizeNumber(counts.components) },
              { label: "Variables", value: normalizeNumber(counts.variables) },
              { label: "Styles", value: styleCount }
            ]
          },
          ...(runtime?.editorType === "figjam"
            ? [{
                id: "figjam",
                title: "FigJam",
                status: "connected",
                items: [
                  { label: "Sticky", value: normalizeNumber(figJam?.board?.typeCounts?.sticky) },
                  { label: "Shapes", value: normalizeNumber(figJam?.board?.typeCounts?.shapeWithText) },
                  { label: "Connectors", value: normalizeNumber(figJam?.board?.typeCounts?.connector) },
                  { label: "Code Blocks", value: normalizeNumber(figJam?.board?.typeCounts?.codeBlock) },
                  { label: "Tables", value: normalizeNumber(figJam?.board?.typeCounts?.table) }
                ]
              }]
            : []),
          {
            id: "issues",
            title: "Top Issues",
            status: topIssues.length > 0 ? "needs-attention" : "healthy",
            items: topIssues.length > 0 ? topIssues.map((issue: { category: string; message: string }) => ({
              label: issue.category,
              value: issue.message
            })) : [{ label: "Issues", value: "None" }]
          },
          {
            id: "actions",
            title: "Next Actions",
            status: nextActions.length > 0 ? "watch" : "healthy",
            items: nextActions.map((action, index) => ({
              label: `Action ${index + 1}`,
              value: action
            }))
          }
        ];

        return {
          runtime: runtime
            ? {
                runtimeSessionId: runtime.runtimeSessionId,
                editorType: runtime.editorType || "figma",
                fileKey: runtime.fileKey || null,
                fileName: runtime.fileName || null,
                pageName: runtime.pageName || null,
                capabilities: Array.isArray(runtime.capabilities) ? runtime.capabilities : [],
                updatedAt: runtime.updatedAt || null
              }
            : null,
          summary: {
            fileName: summary?.fileName || audit?.file?.fileName || runtime?.fileName || "Unknown",
            pageName: summary?.pageName || audit?.file?.pageName || runtime?.pageName || "Unknown",
            counts,
            sample,
            highlights,
            figJam: figJam?.board
              ? {
                  nodeCount: normalizeNumber(figJam.board.nodeCount),
                  typeCounts: figJam.board.typeCounts || {},
                  sample: Array.isArray(figJam.board.sample) ? figJam.board.sample.slice(0, 10) : []
                }
              : null
          },
          audit: {
            score: auditScore,
            categoryScores,
            findings: Array.isArray(audit?.findings) ? audit.findings.slice(0, 10) : []
          },
          changes: {
            count: events.length,
            recent: events.slice(0, 5)
          },
          health: {
            status: healthStatus,
            runtimeConnected: Boolean(runtime?.runtimeSessionId),
            capabilityCount,
            counts: {
              components: normalizeNumber(counts.components),
              variables: normalizeNumber(counts.variables),
              styles: styleCount
            },
            topIssues,
            nextActions
          },
          panels
        };
      })();

      dashboardCache = {
        value: dashboardValue,
        expiresAt: now + cacheTtlMs
      };

      return dashboardValue;
    }
  };
}
