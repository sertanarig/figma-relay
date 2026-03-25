type ExecuteTool = (toolName: string, args: Record<string, unknown>) => Promise<any>;
type GetComponentDetails = (options: {
  componentKey?: string;
  nodeId?: string;
  componentName?: string;
}) => Promise<any>;

export function createFigmaComponentDevelopmentClient({
  executeTool,
  getComponentDetails
}: {
  executeTool: ExecuteTool;
  getComponentDetails?: GetComponentDetails;
}) {
  return {
    async getComponentForDevelopment(options: {
      componentKey?: string;
      nodeId?: string;
      componentName?: string;
      includeScreenshot?: boolean;
    }) {
      const [details, styles, variables] = await Promise.all([
        getComponentDetails
          ? getComponentDetails({
              componentKey: options.componentKey,
              nodeId: options.nodeId,
              componentName: options.componentName
            })
          : executeTool("figma_get_component_details", {
              componentKey: options.componentKey,
              nodeId: options.nodeId,
              componentName: options.componentName
            }),
        executeTool("figma_get_styles", {}),
        executeTool("figma_get_variables", {})
      ]);

      const component = details?.component;
      if (!component?.id) {
        throw new Error("COMPONENT_NOT_FOUND");
      }

      const screenshot = options.includeScreenshot === false
        ? null
        : await executeTool("figma_take_screenshot", { nodeId: component.id }).catch(() => null);

      const styleNames = [
        ...(Array.isArray(styles?.textStyles) ? styles.textStyles.map((item: any) => item?.name).filter(Boolean) : []),
        ...(Array.isArray(styles?.paintStyles) ? styles.paintStyles.map((item: any) => item?.name).filter(Boolean) : []),
        ...(Array.isArray(styles?.effectStyles) ? styles.effectStyles.map((item: any) => item?.name).filter(Boolean) : [])
      ];

      const variableNames = Array.isArray(variables?.collections)
        ? variables.collections.flatMap((collection: any) => (collection.variables || []).map((item: any) => item?.name).filter(Boolean))
        : [];

      const lowerName = String(component.name || "").toLowerCase();
      const suggestedStyles = styleNames
        .filter((name: string) => String(name).toLowerCase().includes(lowerName.split(" ")[0]))
        .slice(0, 8);
      const suggestedVariables = variableNames.filter((name: string) => {
        const normalized = String(name).toLowerCase();
        return lowerName.includes("checkbox")
          ? normalized.includes("checkbox")
          : lowerName.includes("button")
            ? normalized.includes("button")
            : normalized.includes("color/") || normalized.includes("spacing/");
      }).slice(0, 12);

      return {
        runtimeSessionId: details.runtimeSessionId || null,
        component,
        screenshot,
        references: {
          suggestedStyles,
          suggestedVariables
        }
      };
    }
  };
}
