export type NodeSnapshot = {
  id: string;
  name: string;
  type: string;
  width: number;
  height: number;
  parentId: string | null;
  children: string[];
};

export type SelectionSnapshot = {
  runtimeSessionId: string;
  nodeIds: string[];
};

export type RuntimeReadGateway = {
  getSelectionSnapshot?(): SelectionSnapshot | null;
  getNodeSnapshot?(nodeId: string): NodeSnapshot | null;
  getFileContext?(): {
    runtimeSessionId: string;
    fileKey: string;
    fileName: string;
    pageName: string;
  } | null;
  captureScreenshot?(input: {
    format: string;
    scale: number;
  }): {
    runtimeSessionId: string;
    format: string;
    scale: number;
    imageRef: string;
  } | null;
  getVariablesInventory?(): {
    runtimeSessionId: string;
    collections: Array<{
      id: string;
      name: string;
      modes: string[];
      variables: Array<{
        id: string;
        name: string;
        type: string;
        valuesByMode: Record<string, string>;
      }>;
    }>;
  } | null;
  getComponentsInventory?(): {
    runtimeSessionId: string;
    components: Array<{
      id: string;
      key: string;
      name: string;
      setName: string | null;
      propertyNames: string[];
    }>;
  } | null;
};
