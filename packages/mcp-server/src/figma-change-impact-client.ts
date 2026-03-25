type ExecuteTool = (toolName: string, args: Record<string, unknown>) => Promise<any>;

function inferArea(type: string) {
  if (/STYLE/i.test(type)) return "styles";
  if (/VARIABLE|MODE/i.test(type)) return "variables";
  if (/COMPONENT|INSTANCE/i.test(type)) return "components";
  if (/COMMENT/i.test(type)) return "comments";
  return "nodes";
}

function inferRecommendedChecks(areas: string[]) {
  const checks = new Set<string>(["npm run smoke:e2e"]);

  if (areas.includes("styles")) checks.add("npm run smoke:styles");
  if (areas.includes("comments")) checks.add("npm run smoke:comments");
  if (areas.includes("components")) checks.add("node scripts/component-properties-smoke.mjs");
  if (areas.includes("variables") || areas.includes("components") || areas.includes("nodes")) {
    checks.add("npm run smoke:mixed-stress -- --iterations=2");
  }

  return Array.from(checks);
}

export function createFigmaChangeImpactClient({
  executeTool
}: {
  executeTool: ExecuteTool;
}) {
  return {
    async generate(options: { limit?: number } = {}) {
      const limit = typeof options.limit === "number" ? options.limit : 10;
      const changes = await executeTool("figma_get_design_changes", { limit });
      const events = Array.isArray(changes?.events) ? changes.events : [];

      const byArea = new Map<string, number>();
      const byType = new Map<string, number>();
      const nodeIds = new Set<string>();

      for (const event of events) {
        const type = typeof event?.type === "string" ? event.type : "UNKNOWN";
        const area = inferArea(type);
        byArea.set(area, (byArea.get(area) || 0) + 1);
        byType.set(type, (byType.get(type) || 0) + 1);

        if (typeof event?.nodeId === "string" && event.nodeId) {
          nodeIds.add(event.nodeId);
        }
      }

      let impactedNodes: Array<{ id: string; name: string; type: string | null }> = [];
      if (nodeIds.size > 0) {
        const fileData = await executeTool("figma_get_file_data", {
          nodeIds: Array.from(nodeIds).slice(0, 10),
          depth: 1,
          verbosity: "summary"
        }).catch(() => null);

        const nodes = Array.isArray(fileData?.nodes) ? fileData.nodes : [];
        impactedNodes = nodes.map((node: any) => ({
          id: typeof node?.id === "string" ? node.id : "unknown",
          name: typeof node?.name === "string" ? node.name : "Unnamed",
          type: typeof node?.type === "string" ? node.type : null
        }));
      }

      const impactedAreas = Array.from(byArea.entries())
        .sort((left, right) => right[1] - left[1])
        .map(([area, count]) => ({ area, count }));

      const topEventTypes = Array.from(byType.entries())
        .sort((left, right) => right[1] - left[1])
        .slice(0, 5)
        .map(([type, count]) => ({ type, count }));

      return {
        runtimeSessionId: changes?.runtimeSessionId || null,
        summary: {
          totalEvents: events.length,
          impactedAreas: impactedAreas.length,
          impactedNodes: impactedNodes.length
        },
        impactedAreas,
        topEventTypes,
        impactedNodes,
        recommendedChecks: inferRecommendedChecks(impactedAreas.map((item) => item.area))
      };
    }
  };
}
