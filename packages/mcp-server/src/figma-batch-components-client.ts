type ExecuteTool = (toolName: string, args: Record<string, unknown>) => Promise<any>;

type BatchInstantiateInput = {
  instances: Array<{
    nodeId?: string;
    componentKey?: string;
    parentId?: string;
    position?: { x: number; y: number };
    variant?: Record<string, unknown>;
    overrides?: Record<string, unknown>;
  }>;
};

export function createFigmaBatchComponentsClient({
  executeTool
}: {
  executeTool: ExecuteTool;
}) {
  return {
    async instantiate(input: BatchInstantiateInput) {
      const results = [];
      let runtimeSessionId = null;

      for (const instance of input.instances) {
        const result = await executeTool("figma_instantiate_component", instance);
        runtimeSessionId = result?.runtimeSessionId || runtimeSessionId;
        results.push(result);
      }

      return {
        runtimeSessionId,
        instantiatedCount: results.length,
        results
      };
    }
  };
}
