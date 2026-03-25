type ExecuteTool = (toolName: string, args: Record<string, unknown>) => Promise<any>;

type BatchBindVariablesInput = {
  bindings: Array<{
    nodeId: string;
    field: string;
    variableId?: string;
    variableName?: string;
    collectionId?: string;
    collectionName?: string;
    modeId?: string;
    modeName?: string;
    unbind?: boolean;
  }>;
};

export function createFigmaBatchBindingsClient({
  executeTool
}: {
  executeTool: ExecuteTool;
}) {
  return {
    async bindVariables(input: BatchBindVariablesInput) {
      const results = [];
      let runtimeSessionId = null;

      for (const binding of input.bindings) {
        const result = await executeTool("figma_bind_variable", binding);
        runtimeSessionId = result?.runtimeSessionId || runtimeSessionId;
        results.push(result);
      }

      return {
        runtimeSessionId,
        boundCount: results.length,
        results
      };
    }
  };
}
