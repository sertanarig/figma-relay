type ExecuteTool = (toolName: string, args: Record<string, unknown>) => Promise<any>;

function flattenNodes(nodes: any[], output: any[] = []) {
  for (const node of Array.isArray(nodes) ? nodes : []) {
    output.push(node);
    if (Array.isArray(node?.children) && node.children.length > 0) {
      flattenNodes(node.children, output);
    }
  }
  return output;
}

function summarizeTypes(nodes: any[]) {
  const counts = {
    sticky: 0,
    shapeWithText: 0,
    connector: 0,
    codeBlock: 0,
    table: 0
  };

  for (const node of nodes) {
    switch (node?.type) {
      case "STICKY":
        counts.sticky += 1;
        break;
      case "SHAPE_WITH_TEXT":
        counts.shapeWithText += 1;
        break;
      case "CONNECTOR":
        counts.connector += 1;
        break;
      case "CODE_BLOCK":
        counts.codeBlock += 1;
        break;
      case "TABLE":
        counts.table += 1;
        break;
      default:
        break;
    }
  }

  return counts;
}

export function createFigmaFigJamClient({
  executeTool
}: {
  executeTool: ExecuteTool;
}) {
  return {
    async getBoard(options: { depth?: number; nodeId?: string } = {}) {
      const [status, context, selection, fileData] = await Promise.all([
        executeTool("figma_get_status", {}),
        executeTool("figma_get_file_context", {}),
        executeTool("figma_get_selection", {}).catch(() => ({ selection: [] })),
        executeTool("figma_get_file_data", {
          depth: typeof options.depth === "number" ? options.depth : 2,
          nodeIds: options.nodeId ? [String(options.nodeId)] : undefined,
          verbosity: "standard"
        })
      ]);

      if (status?.editorType !== "figjam") {
        throw new Error(`FIGJAM_REQUIRED:${status?.editorType || "unknown"}`);
      }

      const nodes = Array.isArray(fileData?.nodes) ? fileData.nodes : [];
      const flattened = flattenNodes(nodes);

      return {
        runtimeSessionId: status?.runtimeSessionId || context?.runtimeSessionId || null,
        editorType: "figjam",
        file: {
          fileKey: status?.fileKey || context?.fileKey || null,
          fileName: context?.fileName || status?.fileName || "Unknown",
          pageName: context?.pageName || status?.pageName || "Unknown"
        },
        selection: Array.isArray(selection?.selection) ? selection.selection.slice(0, 10) : [],
        board: {
          depth: typeof options.depth === "number" ? options.depth : 2,
          nodeCount: flattened.length,
          typeCounts: summarizeTypes(flattened),
          sample: flattened.slice(0, 20)
        }
      };
    }
  };
}
