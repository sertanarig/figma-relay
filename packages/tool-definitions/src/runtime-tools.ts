export const runtimeTools = [
  {
    name: "figma_get_status",
    description: "Return the active Figma runtime connection state and capabilities."
  },
  {
    name: "figma_navigate",
    description: "Focus a node or the current selection in the active Figma runtime."
  },
  {
    name: "figma_list_open_files",
    description: "List files currently attached to active Figma runtime sessions."
  },
  {
    name: "figma_reconnect",
    description: "Request that the active Figma runtime re-establish its MCP session."
  }
] as const;
