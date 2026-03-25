type DispatchRequest = {
  requestId: string;
  sessionId: string;
  command: string;
  payload: Record<string, unknown>;
};

type DispatchResult = {
  requestId: string;
  sessionId: string;
  status: "succeeded";
  data: unknown;
};

type RuntimeDispatchAdapter = {
  getStatus: () => unknown;
  navigate?: (payload: Record<string, unknown>) => Promise<unknown> | unknown;
  getSelection: () => unknown;
  getFileForPlugin?: (payload: Record<string, unknown>) => Promise<unknown> | unknown;
  createNode: (payload: Record<string, unknown>) => Promise<unknown> | unknown;
  getBoundVariables?: (payload: Record<string, unknown>) => Promise<unknown> | unknown;
  getStyles?: (payload: Record<string, unknown>) => Promise<unknown> | unknown;
  setLayout?: (payload: Record<string, unknown>) => Promise<unknown> | unknown;
  setDescription?: (payload: Record<string, unknown>) => Promise<unknown> | unknown;
  setImageFill?: (payload: Record<string, unknown>) => Promise<unknown> | unknown;
  bindVariable?: (payload: Record<string, unknown>) => Promise<unknown> | unknown;
  setVariableMode?: (payload: Record<string, unknown>) => Promise<unknown> | unknown;
  applyStyle?: (payload: Record<string, unknown>) => Promise<unknown> | unknown;
  createStyle?: (payload: Record<string, unknown>) => Promise<unknown> | unknown;
  deleteStyle?: (payload: Record<string, unknown>) => Promise<unknown> | unknown;
  cleanupArtifacts?: (payload: Record<string, unknown>) => Promise<unknown> | unknown;
  createVariableCollection?: (payload: Record<string, unknown>) => Promise<unknown> | unknown;
  searchComponents?: (payload: Record<string, unknown>) => Promise<unknown> | unknown;
  getLibraryComponents?: (payload: Record<string, unknown>) => Promise<unknown> | unknown;
  arrangeComponentSet?: (payload: Record<string, unknown>) => Promise<unknown> | unknown;
  getConsoleLogs?: (payload: Record<string, unknown>) => Promise<unknown> | unknown;
  execute?: (payload: Record<string, unknown>) => Promise<unknown> | unknown;
  clearConsole?: (payload: Record<string, unknown>) => Promise<unknown> | unknown;
  reloadPlugin?: (payload: Record<string, unknown>) => Promise<unknown> | unknown;
};

export function createRuntimeDispatcher(adapter: RuntimeDispatchAdapter) {
  return {
    async dispatch(request: DispatchRequest): Promise<DispatchResult> {
      let data: unknown;

      switch (request.command) {
        case "figma_get_status":
          data = adapter.getStatus();
          break;
        case "figma_navigate":
          if (!adapter.navigate) throw new Error("UNKNOWN_COMMAND");
          data = await adapter.navigate(request.payload);
          break;
        case "figma_get_selection":
          data = adapter.getSelection();
          break;
        case "figma_get_file_for_plugin":
          if (!adapter.getFileForPlugin) throw new Error("UNKNOWN_COMMAND");
          data = await adapter.getFileForPlugin(request.payload);
          break;
        case "figma_get_styles":
          if (!adapter.getStyles) throw new Error("UNKNOWN_COMMAND");
          data = await adapter.getStyles(request.payload);
          break;
        case "figma_get_bound_variables":
          if (!adapter.getBoundVariables) throw new Error("UNKNOWN_COMMAND");
          data = await adapter.getBoundVariables(request.payload);
          break;
        case "figma_create_node":
          data = await adapter.createNode(request.payload);
          break;
        case "figma_set_layout":
          if (!adapter.setLayout) throw new Error("UNKNOWN_COMMAND");
          data = await adapter.setLayout(request.payload);
          break;
        case "figma_set_description":
          if (!adapter.setDescription) throw new Error("UNKNOWN_COMMAND");
          data = await adapter.setDescription(request.payload);
          break;
        case "figma_set_image_fill":
          if (!adapter.setImageFill) throw new Error("UNKNOWN_COMMAND");
          data = await adapter.setImageFill(request.payload);
          break;
        case "figma_bind_variable":
          if (!adapter.bindVariable) throw new Error("UNKNOWN_COMMAND");
          data = await adapter.bindVariable(request.payload);
          break;
        case "figma_set_variable_mode":
          if (!adapter.setVariableMode) throw new Error("UNKNOWN_COMMAND");
          data = await adapter.setVariableMode(request.payload);
          break;
        case "figma_apply_style":
          if (!adapter.applyStyle) throw new Error("UNKNOWN_COMMAND");
          data = await adapter.applyStyle(request.payload);
          break;
        case "figma_create_style":
          if (!adapter.createStyle) throw new Error("UNKNOWN_COMMAND");
          data = await adapter.createStyle(request.payload);
          break;
        case "figma_delete_style":
          if (!adapter.deleteStyle) throw new Error("UNKNOWN_COMMAND");
          data = await adapter.deleteStyle(request.payload);
          break;
        case "figma_cleanup_artifacts":
          if (!adapter.cleanupArtifacts) throw new Error("UNKNOWN_COMMAND");
          data = await adapter.cleanupArtifacts(request.payload);
          break;
        case "figma_create_variable_collection":
          if (!adapter.createVariableCollection) throw new Error("UNKNOWN_COMMAND");
          data = await adapter.createVariableCollection(request.payload);
          break;
        case "figma_search_components":
          if (!adapter.searchComponents) throw new Error("UNKNOWN_COMMAND");
          data = await adapter.searchComponents(request.payload);
          break;
        case "figma_get_library_components":
          if (!adapter.getLibraryComponents) throw new Error("UNKNOWN_COMMAND");
          data = await adapter.getLibraryComponents(request.payload);
          break;
        case "figma_arrange_component_set":
          if (!adapter.arrangeComponentSet) throw new Error("UNKNOWN_COMMAND");
          data = await adapter.arrangeComponentSet(request.payload);
          break;
        case "figma_get_console_logs":
          if (!adapter.getConsoleLogs) throw new Error("UNKNOWN_COMMAND");
          data = await adapter.getConsoleLogs(request.payload);
          break;
        case "figma_execute":
          if (!adapter.execute) throw new Error("UNKNOWN_COMMAND");
          data = await adapter.execute(request.payload);
          break;
        case "figma_clear_console":
          if (!adapter.clearConsole) throw new Error("UNKNOWN_COMMAND");
          data = await adapter.clearConsole(request.payload);
          break;
        case "figma_reload_plugin":
          if (!adapter.reloadPlugin) throw new Error("UNKNOWN_COMMAND");
          data = await adapter.reloadPlugin(request.payload);
          break;
        default:
          throw new Error("UNKNOWN_COMMAND");
      }

      return {
        requestId: request.requestId,
        sessionId: request.sessionId,
        status: "succeeded",
        data
      };
    }
  };
}
