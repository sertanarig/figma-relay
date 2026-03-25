export const readTools = [
  {
    name: "figma_get_selection",
    description: "Return the active selection as node snapshots."
  },
  {
    name: "figma_get_node",
    description: "Return a single node snapshot by node id."
  },
  {
    name: "figma_get_children",
    description: "Return child node snapshots for a parent node."
  },
  {
    name: "figma_get_file_context",
    description: "Return current file and page context from the runtime."
  },
  {
    name: "figma_get_file_data",
    description: "Return a depth-limited tree snapshot for the current page or specific nodes."
  },
  {
    name: "figma_get_file_for_plugin",
    description: "Return a plugin-focused file snapshot with structure, plugin data, and component relationships."
  },
  {
    name: "figma_get_figjam",
    description: "Return a FigJam board summary with selection, type counts, and sampled nodes."
  },
  {
    name: "figma_get_screenshot",
    description: "Capture a screenshot payload from the current runtime."
  },
  {
    name: "figma_get_styles",
    description: "Return local paint, text, effect, and grid style inventory."
  },
  {
    name: "figma_get_variables",
    description: "Return variable collection and token inventory."
  },
  {
    name: "figma_get_components",
    description: "Return component inventory from the runtime."
  },
  {
    name: "figma_get_bound_variables",
    description: "Return layout and variable bindings for a node or the current selection."
  }
] as const;
