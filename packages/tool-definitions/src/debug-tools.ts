export const debugTools = [
  {
    name: "figma_execute",
    description: "Execute custom async JavaScript against the active Figma plugin runtime as a last-resort escape hatch."
  },
  {
    name: "figma_clear_console",
    description: "Clear buffered plugin/runtime console logs."
  },
  {
    name: "figma_watch_console",
    description: "Watch plugin/runtime console logs for a short duration and return the collected entries."
  },
  {
    name: "figma_reload_plugin",
    description: "Soft-reload the active runtime by re-emitting runtime hello/context and returning the current build stamp."
  },
  {
    name: "figma_get_operation_trace",
    description: "Return a stored operation trace by request id."
  },
  {
    name: "figma_get_design_changes",
    description: "Return recent design change events."
  },
  {
    name: "figma_get_console_logs",
    description: "Return buffered plugin/runtime console logs."
  },
  {
    name: "figma_take_screenshot",
    description: "Capture a verification screenshot payload."
  },
  {
    name: "figma_generate_verification_report",
    description: "Return a compact verification payload for a node with screenshot, bindings, child summary, findings, and recommendations."
  },
  {
    name: "figma_generate_section_report",
    description: "Return a compact section/page-node report with verification summary, subtree sample, and markdown handoff."
  }
] as const;
