type GetBoard = (options?: { depth?: number; nodeId?: string }) => Promise<any>;
type GetDashboard = () => Promise<any>;

function toCount(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function createFigmaFigJamReportClient({
  getBoard,
  getDashboard
}: {
  getBoard: GetBoard;
  getDashboard: GetDashboard;
}) {
  return {
    async generate(options: { depth?: number; nodeId?: string } = {}) {
      const [board, dashboard] = await Promise.all([
        getBoard({
          depth: typeof options.depth === "number" ? options.depth : undefined,
          nodeId: typeof options.nodeId === "string" ? options.nodeId : undefined
        }),
        getDashboard()
      ]);

      const typeCounts = board?.board?.typeCounts || {};
      const sample = Array.isArray(board?.board?.sample) ? board.board.sample.slice(0, 10) : [];
      const recommendations = [];

      if (toCount(typeCounts.sticky) === 0) {
        recommendations.push("Add sticky notes if the board should capture brainstorming context or decisions.");
      }
      if (toCount(typeCounts.connector) === 0 && toCount(board?.board?.nodeCount) > 2) {
        recommendations.push("Consider connectors to make relationships or flows easier to scan.");
      }
      if (recommendations.length === 0) {
        recommendations.push("No immediate FigJam-specific action is required.");
      }

      const markdown = [
        "# FigJam Report",
        "",
        "## Overview",
        `- File: ${board?.file?.fileName || "Unknown"}`,
        `- Page: ${board?.file?.pageName || "Unknown"}`,
        `- Editor: ${board?.editorType || "figjam"}`,
        `- Runtime health: ${dashboard?.health?.status || "unknown"}`,
        "",
        "## Board Counts",
        `- Nodes: ${toCount(board?.board?.nodeCount)}`,
        `- Sticky: ${toCount(typeCounts.sticky)}`,
        `- Shapes: ${toCount(typeCounts.shapeWithText)}`,
        `- Connectors: ${toCount(typeCounts.connector)}`,
        `- Code blocks: ${toCount(typeCounts.codeBlock)}`,
        `- Tables: ${toCount(typeCounts.table)}`,
        "",
        "## Selection",
        ...(Array.isArray(board?.selection) && board.selection.length > 0
          ? board.selection.slice(0, 10).map((node: any) => `- ${node?.name || "Unnamed"} (${node?.type || "Unknown"})`)
          : ["- None"]),
        "",
        "## Sample Nodes",
        ...(sample.length > 0
          ? sample.map((node: any) => `- ${node?.name || "Unnamed"} (${node?.type || "Unknown"})`)
          : ["- None"]),
        "",
        "## Recommended Actions",
        ...recommendations.map((item) => `- ${item}`)
      ].join("\n");

      return {
        file: board?.file || {
          fileKey: null,
          fileName: "Unknown",
          pageName: "Unknown"
        },
        editorType: board?.editorType || "figjam",
        health: {
          status: dashboard?.health?.status || "unknown",
          topIssues: Array.isArray(dashboard?.health?.topIssues) ? dashboard.health.topIssues.slice(0, 5) : []
        },
        board: {
          nodeCount: toCount(board?.board?.nodeCount),
          typeCounts,
          selection: Array.isArray(board?.selection) ? board.selection.slice(0, 10) : [],
          sample
        },
        recommendations,
        markdown
      };
    }
  };
}
