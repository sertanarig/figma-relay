export const dashboardTools = [
  {
    name: "ds_dashboard_refresh",
    description: "Refresh dashboard caches and return a fresh dashboard payload."
  },
  {
    name: "token_browser_refresh",
    description: "Refresh token browser caches and return a fresh grouped token payload."
  },
  {
    name: "figma_get_dashboard",
    description: "Return a compact dashboard payload with runtime health, summary highlights, audit signals, and recent design changes."
  },
  {
    name: "figma_generate_change_impact_summary",
    description: "Summarize recent design changes into impacted areas, impacted nodes, and recommended regression checks."
  },
  {
    name: "figma_get_release_readiness",
    description: "Return v1 release-readiness gates derived from dashboard health, audit, and design-system inventory."
  },
  {
    name: "figma_get_release_readiness_trend",
    description: "Record and summarize local readiness snapshots so you can see whether release health is improving or regressing over time."
  },
  {
    name: "figma_get_troubleshooting_summary",
    description: "Return a compact troubleshooting payload with runtime, dashboard health, readiness, and next recommended commands."
  }
] as const;
