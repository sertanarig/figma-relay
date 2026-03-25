type ExecuteTool = (toolName: string, args: Record<string, unknown>) => Promise<any>;

function pickExactComponent(
  components: any[],
  options: { componentKey?: string; nodeId?: string; componentName?: string }
) {
  if (options.componentKey) {
    const match = components.find((item) => item?.key === options.componentKey);
    if (match) return match;
  }
  if (options.nodeId) {
    const match = components.find((item) => item?.id === options.nodeId);
    if (match) return match;
  }
  if (options.componentName) {
    const exact = components.find((item) => item?.name === options.componentName);
    if (exact) return exact;
    const lower = options.componentName.toLowerCase();
    return components.find((item) => String(item?.name || "").toLowerCase() === lower) || null;
  }
  return null;
}

export function createFigmaComponentDetailsClient({
  executeTool
}: {
  executeTool: ExecuteTool;
}) {
  return {
    async getDetails(options: {
      componentKey?: string;
      nodeId?: string;
      componentName?: string;
    }) {
      const inventory = await executeTool("figma_get_components", {
        query: options.componentName || undefined
      });
      const components = Array.isArray(inventory?.components) ? inventory.components : [];
      const component = pickExactComponent(components, options);

      if (!component) {
        throw new Error("COMPONENT_NOT_FOUND");
      }

      let node = null;
      try {
        const nodePayload = await executeTool("figma_get_node", { nodeId: component.id });
        node = nodePayload?.node || null;
      } catch {
        node = null;
      }

      return {
        runtimeSessionId: inventory?.runtimeSessionId || null,
        component: {
          id: component.id,
          key: component.key || component.id,
          name: component.name,
          setName: component.setName || null,
          propertyNames: Array.isArray(component.propertyNames) ? component.propertyNames : [],
          nodeType: node?.type || null,
          width: typeof node?.width === "number" ? node.width : null,
          height: typeof node?.height === "number" ? node.height : null,
          parentId: node?.parentId || null
        }
      };
    }
  };
}
