type ExecuteTool = (toolName: string, args: Record<string, unknown>) => Promise<any>;

type BatchApplyStylesInput = {
  applications: Array<{
    nodeId: string;
    styleType: "paint" | "text" | "effect" | "grid";
    styleId: string;
  }>;
};

export function createFigmaBatchStyleClient({
  executeTool
}: {
  executeTool: ExecuteTool;
}) {
  return {
    async applyStyles(input: BatchApplyStylesInput) {
      const results = [];
      let runtimeSessionId = null;

      for (const application of input.applications) {
        const result = await executeTool("figma_apply_style", application);
        runtimeSessionId = result?.runtimeSessionId || runtimeSessionId;
        results.push(result);
      }

      return {
        runtimeSessionId,
        appliedCount: results.length,
        results
      };
    }
  };
}
