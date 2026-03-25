export type RuntimeVariablesGateway = {
  createVariableCollection?(input: {
    name: string;
    initialModeName?: string;
    additionalModes?: string[];
  }): {
    runtimeSessionId: string;
    collection: {
      id: string;
      name: string;
      modes: string[];
    };
  } | null;
  addMode?(input: { collectionId: string; modeName: string }): {
    runtimeSessionId: string;
    collectionId: string;
    modeId: string;
    modeName: string;
  } | null;
  renameMode?(input: {
    collectionId: string;
    modeId: string;
    newName: string;
  }): {
    runtimeSessionId: string;
    collectionId: string;
    modeId: string;
    modeName: string;
  } | null;
  createVariable?(input: {
    collectionId: string;
    name: string;
    resolvedType: string;
    valuesByMode?: Record<string, string>;
  }): {
    runtimeSessionId: string;
    variable: {
      id: string;
      collectionId: string;
      name: string;
      resolvedType: string;
      valuesByMode: Record<string, string>;
    };
  } | null;
  updateVariable?(input: {
    variableId: string;
    modeId: string;
    value: string;
  }): {
    runtimeSessionId: string;
    variableId: string;
    modeId: string;
    value: string;
  } | null;
  batchUpdateVariables?(input: {
    updates: Array<{
      variableId: string;
      modeId: string;
      value: string;
    }>;
  }): {
    runtimeSessionId: string;
    updates: Array<{
      variableId: string;
      modeId: string;
      value: string;
    }>;
  } | null;
  deleteVariable?(input: { variableId: string }): {
    runtimeSessionId: string;
    variableId: string;
    deleted: boolean;
  } | null;
};
