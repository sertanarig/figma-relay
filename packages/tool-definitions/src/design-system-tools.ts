export const designSystemTools = [
  {
    name: "figma_get_design_system_summary",
    description: "Return a compact overview of local styles, variables, and components."
  },
  {
    name: "figma_get_design_system_kit",
    description: "Return a combined design system payload with context, styles, variables, and components."
  },
  {
    name: "figma_browse_tokens",
    description: "Browse token inventory with grouped collections, type filtering, and search."
  },
  {
    name: "figma_browse_design_system",
    description: "Browse grouped styles and components with optional search filters."
  },
  {
    name: "figma_get_token_values",
    description: "Return filtered token values from the active Figma variable inventory."
  },
  {
    name: "figma_generate_design_system_report",
    description: "Generate a compact design-system report with inventory, health, highlights, and markdown handoff."
  }
] as const;
