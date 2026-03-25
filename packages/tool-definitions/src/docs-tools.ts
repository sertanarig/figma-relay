export const docsTools = [
  {
    name: "figma_get_component_for_development",
    description: "Return component details, screenshot, and related references for development."
  },
  {
    name: "figma_generate_figjam_report",
    description: "Generate a compact FigJam board report with counts, sample nodes, and recommendations."
  },
  {
    name: "figma_generate_component_doc",
    description: "Generate compact markdown documentation for a component from the active Figma inventories."
  },
  {
    name: "figma_detect_doc_drift",
    description: "Compare a component family against a matching documentation section and report likely documentation drift."
  }
] as const;
