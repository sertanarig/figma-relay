type ExecuteTool = (toolName: string, args: Record<string, unknown>) => Promise<any>;

type BatchCreateVariablesInput = {
  collectionId: string;
  variables: Array<{
    name: string;
    resolvedType: string;
    description?: string;
    valuesByMode?: Record<string, unknown>;
  }>;
};

export function createFigmaBatchVariablesClient({
  executeTool
}: {
  executeTool: ExecuteTool;
}) {
  return {
    async createVariables(input: BatchCreateVariablesInput) {
      const created = [];
      let runtimeSessionId = null;

      for (const variable of input.variables) {
        const result = await executeTool("figma_create_variable", {
          collectionId: input.collectionId,
          name: variable.name,
          resolvedType: variable.resolvedType,
          description: variable.description,
          valuesByMode: variable.valuesByMode
        });

        runtimeSessionId = result?.runtimeSessionId || runtimeSessionId;
        if (result?.variable) {
          created.push(result.variable);
        }
      }

      return {
        runtimeSessionId,
        createdCount: created.length,
        variables: created
      };
    }
  };
}
