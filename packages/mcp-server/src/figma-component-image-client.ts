type ExecuteTool = (toolName: string, args: Record<string, unknown>) => Promise<any>;

export function createFigmaComponentImageClient({
  executeTool,
  getComponentDetails
}: {
  executeTool: ExecuteTool;
  getComponentDetails?: (input: {
    componentKey?: string;
    nodeId?: string;
    componentName?: string;
  }) => Promise<any>;
}) {
  return {
    async getImage(options: {
      componentKey?: string;
      nodeId?: string;
      componentName?: string;
    }) {
      const details = getComponentDetails
        ? await getComponentDetails({
            componentKey: options.componentKey,
            nodeId: options.nodeId,
            componentName: options.componentName
          })
        : await executeTool("figma_get_component_details", {
            componentKey: options.componentKey,
            nodeId: options.nodeId,
            componentName: options.componentName
          });

      const component = details?.component;
      if (!component?.id) {
        throw new Error("COMPONENT_NOT_FOUND");
      }

      const image = await executeTool("figma_take_screenshot", {
        nodeId: component.id
      });

      return {
        runtimeSessionId: details?.runtimeSessionId || null,
        component,
        image
      };
    }
  };
}
