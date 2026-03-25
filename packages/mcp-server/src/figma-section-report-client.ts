type ExecuteTool = (toolName: string, args: Record<string, unknown>) => Promise<any>;
type GenerateVerification = (options: {
  nodeId?: string;
  includeChildren?: boolean;
  includeScreenshot?: boolean;
}) => Promise<any>;

export function createFigmaSectionReportClient({
  executeTool,
  generateVerification
}: {
  executeTool: ExecuteTool;
  generateVerification: GenerateVerification;
}) {
  return {
    async generate(options: {
      nodeId: string;
      depth?: number;
    }) {
      const depth = typeof options.depth === "number" ? options.depth : 2;
      const [verification, fileData] = await Promise.all([
        generateVerification({
          nodeId: options.nodeId,
          includeChildren: true,
          includeScreenshot: false
        }),
        executeTool("figma_get_file_data", {
          depth,
          nodeIds: [options.nodeId],
          verbosity: "summary"
        })
      ]);

      const rootNode = Array.isArray(fileData?.nodes) ? fileData.nodes[0] : null;
      const childNodes = Array.isArray(rootNode?.nodes) ? rootNode.nodes : [];
      const sampleNames = childNodes.slice(0, 10).map((node: any) => node?.name || "Unnamed");
      const pageName = fileData?.pageName || fileData?.page?.name || "Unknown";

      const markdown = [
        `# Section Report`,
        ``,
        `## Overview`,
        `- File: ${fileData?.fileName || "Unknown"}`,
        `- Page: ${pageName}`,
        `- Section: ${rootNode?.name || verification?.node?.name || "Unknown"}`,
        `- Type: ${rootNode?.type || verification?.node?.type || "Unknown"}`,
        ``,
        `## Verification`,
        `- Score: ${verification?.summary?.score ?? "n/a"}`,
        `- Readiness: ${verification?.summary?.readinessStatus ?? "unknown"}`,
        `- Findings: ${verification?.summary?.findings ?? 0}`,
        `- Warnings: ${verification?.summary?.severityBreakdown?.warning ?? 0}`,
        `- Infos: ${verification?.summary?.severityBreakdown?.info ?? 0}`,
        `- Recommendations: ${verification?.summary?.recommendations ?? 0}`,
        ``,
        `## Child Sample`,
        ...(sampleNames.length > 0 ? sampleNames.map((name: string) => `- ${name}`) : ["- None"])
      ].join("\n");

      return {
        file: {
          fileName: fileData?.fileName || "Unknown",
          pageName
        },
        section: {
          nodeId: options.nodeId,
          name: rootNode?.name || verification?.node?.name || "Unknown",
          type: rootNode?.type || verification?.node?.type || "Unknown",
          directChildren: childNodes.length,
          sampleChildren: childNodes.slice(0, 10).map((node: any) => ({
            id: node?.id || null,
            name: node?.name || "Unnamed",
            type: node?.type || null
          }))
        },
        verification: {
          score: verification?.summary?.score ?? null,
          readinessStatus: verification?.summary?.readinessStatus ?? "unknown",
          findings: verification?.summary?.findings ?? 0,
          severityBreakdown: verification?.summary?.severityBreakdown || { warning: 0, info: 0 },
          recommendations: verification?.summary?.recommendations ?? 0,
          topFindings: Array.isArray(verification?.findings) ? verification.findings.slice(0, 5) : [],
          topRecommendations: Array.isArray(verification?.recommendations)
            ? verification.recommendations.slice(0, 5)
            : []
        },
        markdown
      };
    }
  };
}
