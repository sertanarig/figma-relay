export const writeTools = [
  {
    name: "figma_create_node",
    description: "Create a new node in Figma or FigJam using typed properties. Supports design nodes plus FigJam primitives like sticky, connector, shape-with-text, code block, and table."
  },
  {
    name: "figma_delete_node",
    description: "Delete a node by node id."
  },
  {
    name: "figma_move_node",
    description: "Move a node to a new x/y position."
  },
  {
    name: "figma_resize_node",
    description: "Resize a node to the given width and height."
  },
  {
    name: "figma_rename_node",
    description: "Rename an existing node."
  },
  {
    name: "figma_set_text",
    description: "Update text content for a text-capable node."
  },
  {
    name: "figma_update_figjam_node",
    description: "Update FigJam-specific fields such as shape type, code block language, or connector endpoints."
  },
  {
    name: "figma_set_description",
    description: "Set a description on a node or local style."
  },
  {
    name: "figma_set_image_fill",
    description: "Apply an image fill to a node from a URL, data URL, or runtime image ref."
  },
  {
    name: "figma_set_fills",
    description: "Replace node fill paints."
  },
  {
    name: "figma_set_strokes",
    description: "Replace node stroke paints."
  },
  {
    name: "figma_set_layout",
    description: "Update auto-layout sizing, padding, and spacing for a layout-capable node."
  },
  {
    name: "figma_bind_variable",
    description: "Bind a variable to a layout field on a node and optionally set its collection mode."
  },
  {
    name: "figma_batch_bind_variables",
    description: "Bind many variables to nodes in one request."
  },
  {
    name: "figma_set_variable_mode",
    description: "Set the explicit variable mode for a collection on a node."
  },
  {
    name: "figma_apply_style",
    description: "Apply a local text, paint, effect, or grid style to a node."
  },
  {
    name: "figma_batch_apply_styles",
    description: "Apply many local styles to nodes in one request."
  },
  {
    name: "figma_create_style",
    description: "Create a local paint or text style."
  },
  {
    name: "figma_delete_style",
    description: "Delete a local style by id."
  },
  {
    name: "figma_cleanup_artifacts",
    description: "Delete temporary Runtime MCP nodes, styles, and variables by name prefix."
  },
  {
    name: "figma_clone_node",
    description: "Clone a node."
  },
  {
    name: "figma_create_child",
    description: "Create a child node under a parent container."
  }
] as const;
