type GetSummary = () => Promise<any>;
type GetDashboard = () => Promise<any>;
type GetAudit = (options?: { profile?: "default" | "release" }) => Promise<any>;
type BrowseTokens = (options: { limitPerCollection?: number }) => Promise<any>;
type BrowseDesignSystem = (options: { componentLimit?: number; styleLimit?: number }) => Promise<any>;
type CacheEntry = {
  value: Promise<any>;
  expiresAt: number;
};

function toCount(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function buildReportActions(options: {
  healthStatus: string;
  topIssues: Array<{ category?: string; severity?: string; message?: string }>;
  counts: {
    components: number;
    variables: number;
    variableCollections: number;
    styles: number;
  };
}) {
  const actions: string[] = [];

  if (options.healthStatus === "needs-attention") {
    actions.push("Treat the top issues as release blockers before broader rollout.");
  } else if (options.healthStatus === "watch") {
    actions.push("Resolve the top warnings before marking this file release-ready.");
  }

  if (options.counts.variableCollections === 0 && options.counts.variables > 0) {
    actions.push("Group variables into collections so token ownership is easier to maintain.");
  }

  if (options.counts.components > 0 && options.counts.styles === 0) {
    actions.push("Confirm whether the file intentionally relies on variables only or if local styles are missing.");
  }

  const duplicateIssue = options.topIssues.find((issue) =>
    /duplicate component names/i.test(issue?.message || "")
  );
  if (duplicateIssue) {
    actions.push("Rename duplicate components to keep search, docs, and parity checks deterministic.");
  }

  if (actions.length === 0) {
    actions.push("No immediate remediation is required; keep monitoring changes through the dashboard.");
  }

  return actions.slice(0, 5);
}

export function createFigmaDesignSystemReportClient({
  getSummary,
  getDashboard,
  getAudit,
  browseTokens,
  browseDesignSystem,
  cacheTtlMs = 5_000
}: {
  getSummary: GetSummary;
  getDashboard: GetDashboard;
  getAudit: GetAudit;
  browseTokens: BrowseTokens;
  browseDesignSystem: BrowseDesignSystem;
  cacheTtlMs?: number;
}) {
  const cache = new Map<string, CacheEntry>();

  function getCachedValue(cacheKey: string, factory: () => Promise<any>) {
    const now = Date.now();
    const existing = cache.get(cacheKey);
    if (existing && existing.expiresAt > now) {
      return existing.value;
    }

    const value = factory();
    cache.set(cacheKey, {
      value,
      expiresAt: now + cacheTtlMs
    });

    return value;
  }

  return {
    async generate(options: { auditProfile?: "default" | "release" } = {}) {
      const auditProfile = options.auditProfile === "default" ? "default" : "release";
      const [summary, dashboard, audit, tokens, browser] = await Promise.all([
        getCachedValue("report-summary", () => getSummary().catch(() => null)),
        getCachedValue("report-dashboard", () => getDashboard()),
        getCachedValue(`report-audit:${auditProfile}`, () => getAudit({ profile: auditProfile }).catch(() => null)),
        getCachedValue("report-tokens", () => browseTokens({ limitPerCollection: 5 }).catch(() => ({ collections: [] }))),
        getCachedValue("report-browser", () =>
          browseDesignSystem({ componentLimit: 10, styleLimit: 10 }).catch(() => ({ componentGroups: [], styleGroups: [] }))
        )
      ]);

      const isFigJam = dashboard?.runtime?.editorType === "figjam";
      const counts = summary?.counts || {};
      const auditScore = audit?.summary?.score ?? dashboard?.audit?.score ?? null;
      const highlights = dashboard?.summary?.highlights || {};
      const topIssues = Array.isArray(dashboard?.health?.topIssues) ? dashboard.health.topIssues : [];
      const categoryScores = audit?.summary?.categoryScores || {};
      const tokenCollections = Array.isArray(tokens?.collections) ? tokens.collections : [];
      const componentGroups = Array.isArray(browser?.componentGroups) ? browser.componentGroups : [];
      const styleGroups = Array.isArray(browser?.styleGroups) ? browser.styleGroups : [];
      const figJamSummary = dashboard?.summary?.figJam || null;
      const totalStyles =
        toCount(counts.textStyles) +
        toCount(counts.paintStyles) +
        toCount(counts.effectStyles) +
        toCount(counts.gridStyles);
      const recommendedActions = buildReportActions({
        healthStatus: dashboard?.health?.status || "unknown",
        topIssues,
        counts: {
          components: toCount(counts.components),
          variables: toCount(counts.variables),
          variableCollections: toCount(counts.variableCollections),
          styles: totalStyles
        }
      });
      const finalRecommendedActions =
        isFigJam && figJamSummary
          ? [
              "Use the FigJam board summary to track board object growth before adding more workshop content.",
              ...(topIssues.length > 0
                ? ["Review dashboard warnings, but treat design-system inventory gaps as non-blocking for FigJam boards."]
                : ["No immediate FigJam-specific remediation is required."])
            ].slice(0, 5)
          : recommendedActions;

      const markdown = [
        `# Design System Report`,
        ``,
        `## Overview`,
        `- File: ${summary?.fileName || dashboard?.summary?.fileName || "Unknown"}`,
        `- Page: ${summary?.pageName || dashboard?.summary?.pageName || "Unknown"}`,
        `- Editor: ${dashboard?.runtime?.editorType || "figma"}`,
        `- Health: ${dashboard?.health?.status || "unknown"}`,
        `- Audit score: ${typeof auditScore === "number" ? auditScore : "n/a"}`,
        ``,
        ...(dashboard?.runtime?.editorType === "figjam"
          ? [
              `## FigJam Board`,
              `- Nodes: ${toCount(figJamSummary?.nodeCount)}`,
              `- Sticky: ${toCount(figJamSummary?.typeCounts?.sticky)}`,
              `- Shapes: ${toCount(figJamSummary?.typeCounts?.shapeWithText)}`,
              `- Connectors: ${toCount(figJamSummary?.typeCounts?.connector)}`,
              `- Code blocks: ${toCount(figJamSummary?.typeCounts?.codeBlock)}`,
              `- Tables: ${toCount(figJamSummary?.typeCounts?.table)}`,
              ``
            ]
          : []),
        `## Inventory`,
        `- Components: ${toCount(counts.components)}`,
        `- Variables: ${toCount(counts.variables)}`,
        `- Variable collections: ${toCount(counts.variableCollections)}`,
        `- Text styles: ${toCount(counts.textStyles)}`,
        `- Paint styles: ${toCount(counts.paintStyles)}`,
        `- Effect styles: ${toCount(counts.effectStyles)}`,
        `- Grid styles: ${toCount(counts.gridStyles)}`,
        ``,
        `## Highlights`,
        `- Top components: ${(Array.isArray(highlights.topComponents) ? highlights.topComponents : []).slice(0, 5).join(", ") || "None"}`,
        `- Top styles: ${(Array.isArray(highlights.topStyles) ? highlights.topStyles : []).slice(0, 5).join(", ") || "None"}`,
        `- Top collections: ${(Array.isArray(highlights.topCollections) ? highlights.topCollections : []).slice(0, 5).join(", ") || "None"}`,
        ``,
        `## Audit`,
        `- Naming: ${typeof categoryScores.naming === "number" ? categoryScores.naming : "n/a"}`,
        `- Structure: ${typeof categoryScores.structure === "number" ? categoryScores.structure : "n/a"}`,
        `- Coverage: ${typeof categoryScores.coverage === "number" ? categoryScores.coverage : "n/a"}`,
        ``,
        `## Top Issues`,
        ...(topIssues.length > 0
          ? topIssues.map((issue: any) => `- [${issue.severity || "info"}] ${issue.category || "general"}: ${issue.message || "No message"}`)
          : ["- None"]),
        ``,
        `## Recommended Actions`,
        ...finalRecommendedActions.map((action) => `- ${action}`),
        ``,
        `## Token Groups`,
        ...(tokenCollections.length > 0
          ? tokenCollections.slice(0, 5).map((collection: any) => `- ${collection.name || "Unnamed"} (${toCount(collection.variableCount)})`)
          : ["- None"]),
        ``,
        `## Component Groups`,
        ...(componentGroups.length > 0
          ? componentGroups.slice(0, 5).map((group: any) => `- ${group.group || "Ungrouped"} (${toCount(group.count)})`)
          : ["- None"]),
        ``,
        `## Style Groups`,
        ...(styleGroups.length > 0
          ? styleGroups.slice(0, 5).map((group: any) => `- ${group.group || "Ungrouped"} (${toCount(group.count)})`)
          : ["- None"])
      ].join("\n");

      return {
        file: {
          fileName: summary?.fileName || dashboard?.summary?.fileName || "Unknown",
          pageName: summary?.pageName || dashboard?.summary?.pageName || "Unknown",
          editorType: dashboard?.runtime?.editorType || "figma"
        },
        health: {
          status: dashboard?.health?.status || "unknown",
          auditScore,
          topIssues,
          recommendedActions: finalRecommendedActions
        },
        counts,
        highlights,
        categoryScores,
        groups: {
          tokenCollections: tokenCollections.slice(0, 10),
          componentGroups: componentGroups.slice(0, 10),
          styleGroups: styleGroups.slice(0, 10)
        },
        figJam: figJamSummary
          ? {
              nodeCount: toCount(figJamSummary.nodeCount),
              typeCounts: figJamSummary.typeCounts || {},
              sample: Array.isArray(figJamSummary.sample) ? figJamSummary.sample.slice(0, 10) : []
            }
          : null,
        markdown
      };
    }
  };
}
