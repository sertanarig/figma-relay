type ExecuteTool = (toolName: string, args: Record<string, unknown>) => Promise<any>;
type GetComponentDetails = (options: {
  componentKey?: string;
  nodeId?: string;
  componentName?: string;
}) => Promise<any>;

export function createFigmaComponentClient({
  executeTool,
  getComponentDetails
}: {
  executeTool: ExecuteTool;
  getComponentDetails?: GetComponentDetails;
}) {
  return {
    async getComponent(options: {
      componentKey?: string;
      nodeId?: string;
      componentName?: string;
    }) {
      const details = getComponentDetails
        ? await getComponentDetails(options)
        : await executeTool("figma_get_component_details", {
            componentKey: options.componentKey,
            nodeId: options.nodeId,
            componentName: options.componentName
          });

      const component = details?.component;
      if (!component?.id) {
        throw new Error("COMPONENT_NOT_FOUND");
      }

      const boundVariables = await executeTool("figma_get_bound_variables", {
        nodeId: component.id
      }).catch(() => ({ bindings: [] }));

      return {
        runtimeSessionId: details?.runtimeSessionId || null,
        component,
        bindings: Array.isArray(boundVariables?.bindings) ? boundVariables.bindings : []
      };
    }
  };
}
