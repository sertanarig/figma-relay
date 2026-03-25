type ExecuteTool = (toolName: string, args: Record<string, unknown>) => Promise<any>;

type BatchSetInstancePropertiesInput = {
  updates: Array<{
    nodeId: string;
    properties: Record<string, unknown>;
  }>;
};

export function createFigmaBatchInstancePropertiesClient({
  executeTool
}: {
  executeTool: ExecuteTool;
}) {
  return {
    async setProperties(input: BatchSetInstancePropertiesInput) {
      const results = [];
      let runtimeSessionId = null;

      for (const update of input.updates) {
        const result = await executeTool("figma_set_instance_properties", update);
        runtimeSessionId = result?.runtimeSessionId || runtimeSessionId;
        results.push(result);
      }

      return {
        runtimeSessionId,
        updatedCount: results.length,
        results
      };
    }
  };
}
