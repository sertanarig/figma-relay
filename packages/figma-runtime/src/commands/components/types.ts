export type RuntimeComponentsGateway = {
  createComponent?(input: { name: string }): {
    runtimeSessionId: string;
    component: {
      id: string;
      key: string;
      name: string;
    };
  } | null;
  searchComponents?(input: { query?: string }): {
    runtimeSessionId: string;
    components: Array<{
      id: string;
      key: string;
      name: string;
    }>;
  } | null;
  instantiateComponent?(input: {
    componentKey?: string;
    nodeId?: string;
    parentId?: string;
    overrides?: Record<string, unknown>;
    variant?: Record<string, string>;
  }): {
    runtimeSessionId: string;
    instance: {
      id: string;
      componentKey: string | null;
      nodeId: string | null;
      parentId: string | null;
    };
  } | null;
  setInstanceProperties?(input: {
    nodeId: string;
    properties: Record<string, unknown>;
  }): {
    runtimeSessionId: string;
    nodeId: string;
    properties: Record<string, unknown>;
  } | null;
};
