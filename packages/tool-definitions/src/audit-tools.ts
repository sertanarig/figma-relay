export const auditTools = [
  {
    name: "figma_lint_design",
    description: "Run a release-oriented design lint over the active file and return findings."
  },
  {
    name: "figma_audit_design_system",
    description: "Audit local styles, variables, and components to summarize design-system health, optionally using a stricter or release-oriented profile."
  },
  {
    name: "figma_get_audit_waivers",
    description: "List local audit waivers that suppress accepted findings for a file/profile."
  },
  {
    name: "figma_upsert_audit_waiver",
    description: "Create or update a local audit waiver by category and message pattern."
  },
  {
    name: "figma_delete_audit_waiver",
    description: "Delete a local audit waiver by id."
  }
] as const;
