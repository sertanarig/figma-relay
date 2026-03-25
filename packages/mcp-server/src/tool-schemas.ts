import { z } from "zod";

const noArgsSchema = z.object({});
const nodeIdSchema = z.object({
  nodeId: z.string().min(1)
});

const paintSchema = z.object({
  type: z.string().min(1),
  color: z.string().min(1),
  opacity: z.number().min(0).max(1).optional()
});

export const toolInputSchemas = {
  figma_get_status: noArgsSchema,
  figma_list_open_files: noArgsSchema,
  figma_reconnect: noArgsSchema,
  figma_execute: z.object({
    code: z.string().min(1),
    payload: z.record(z.string(), z.unknown()).optional()
  }),
  figma_clear_console: noArgsSchema,
  figma_watch_console: z.object({
    durationMs: z.number().int().positive().max(60_000).optional(),
    pollIntervalMs: z.number().int().positive().max(10_000).optional(),
    level: z.string().optional(),
    limit: z.number().int().positive().max(500).optional()
  }),
  figma_reload_plugin: noArgsSchema,
  ds_dashboard_refresh: noArgsSchema,
  token_browser_refresh: noArgsSchema,
  figma_navigate: z.object({
    nodeId: z.string().min(1).optional(),
    select: z.boolean().optional(),
    zoomIntoView: z.boolean().optional()
  }),
  figma_get_selection: noArgsSchema,
  figma_get_node: nodeIdSchema,
  figma_get_children: nodeIdSchema,
  figma_get_file_context: noArgsSchema,
  figma_get_file_data: z.object({
    depth: z.number().int().min(0).max(5).optional(),
    nodeIds: z.array(z.string().min(1)).optional(),
    verbosity: z.enum(["summary", "standard"]).optional()
  }),
  figma_get_file_for_plugin: z.object({
    depth: z.number().int().min(0).max(5).optional(),
    nodeIds: z.array(z.string().min(1)).optional()
  }),
  figma_get_figjam: z.object({
    nodeId: z.string().min(1).optional(),
    depth: z.number().int().min(0).max(5).optional()
  }),
  figma_generate_figjam_report: z.object({
    nodeId: z.string().min(1).optional(),
    depth: z.number().int().min(0).max(5).optional()
  }),
  figma_get_screenshot: z.object({
    nodeId: z.string().min(1).optional()
  }),
  figma_get_styles: noArgsSchema,
  figma_get_variables: noArgsSchema,
  figma_get_components: z.object({
    query: z.string().optional()
  }),
  figma_get_bound_variables: z.object({
    nodeId: z.string().min(1).optional()
  }),
  figma_create_node: z.object({
    nodeType: z.string().min(1),
    parentId: z.string().min(1).optional(),
    properties: z.record(z.string(), z.unknown()).optional()
  }),
  figma_delete_node: nodeIdSchema,
  figma_move_node: z.object({
    nodeId: z.string().min(1),
    x: z.number(),
    y: z.number()
  }),
  figma_resize_node: z.object({
    nodeId: z.string().min(1),
    width: z.number().positive(),
    height: z.number().positive(),
    withConstraints: z.boolean().optional()
  }),
  figma_rename_node: z.object({
    nodeId: z.string().min(1),
    newName: z.string().min(1)
  }),
  figma_set_text: z.object({
    nodeId: z.string().min(1),
    text: z.string(),
    fontSize: z.number().positive().optional()
  }),
  figma_update_figjam_node: z.object({
    nodeId: z.string().min(1),
    text: z.string().optional(),
    shapeType: z.string().min(1).optional(),
    language: z.string().min(1).optional(),
    code: z.string().optional(),
    startNodeId: z.string().min(1).optional(),
    endNodeId: z.string().min(1).optional()
  }),
  figma_set_description: z.object({
    nodeId: z.string().min(1).optional(),
    styleType: z.enum(["paint", "text", "effect", "grid"]).optional(),
    styleId: z.string().min(1).optional(),
    description: z.string()
  }).refine((value) => Boolean(value.nodeId || (value.styleType && value.styleId)), {
    message: "nodeId or styleType/styleId is required"
  }),
  figma_set_image_fill: z.object({
    nodeId: z.string().min(1),
    imageRef: z.string().min(1).optional(),
    dataUrl: z.string().min(1).optional(),
    url: z.string().url().optional(),
    scaleMode: z.enum(["FILL", "FIT", "CROP", "TILE"]).optional(),
    opacity: z.number().min(0).max(1).optional()
  }).refine((value) => Boolean(value.imageRef || value.dataUrl || value.url), {
    message: "imageRef, dataUrl, or url is required"
  }),
  figma_set_fills: z.object({
    nodeId: z.string().min(1),
    fills: z.array(paintSchema)
  }),
  figma_set_strokes: z.object({
    nodeId: z.string().min(1),
    strokes: z.array(paintSchema),
    strokeWeight: z.number().positive().optional()
  }),
  figma_set_layout: z.object({
    nodeId: z.string().min(1),
    layoutMode: z.enum(["NONE", "HORIZONTAL", "VERTICAL"]).optional(),
    layoutWrap: z.enum(["NO_WRAP", "WRAP"]).optional(),
    primaryAxisSizingMode: z.enum(["FIXED", "AUTO"]).optional(),
    counterAxisSizingMode: z.enum(["FIXED", "AUTO"]).optional(),
    primaryAxisAlignItems: z.enum(["MIN", "CENTER", "MAX", "SPACE_BETWEEN"]).optional(),
    counterAxisAlignItems: z.enum(["MIN", "CENTER", "MAX", "BASELINE"]).optional(),
    itemSpacing: z.number().optional(),
    counterAxisSpacing: z.number().optional(),
    paddingLeft: z.number().optional(),
    paddingRight: z.number().optional(),
    paddingTop: z.number().optional(),
    paddingBottom: z.number().optional(),
    width: z.number().positive().optional(),
    height: z.number().positive().optional()
  }),
  figma_bind_variable: z.object({
    nodeId: z.string().min(1),
    field: z.string().min(1),
    variableId: z.string().min(1).optional(),
    variableName: z.string().min(1).optional(),
    collectionId: z.string().min(1).optional(),
    collectionName: z.string().min(1).optional(),
    modeId: z.string().min(1).optional(),
    modeName: z.string().min(1).optional(),
    unbind: z.boolean().optional()
  }).refine((value) => value.unbind || value.variableId || value.variableName, {
    message: "variableId or variableName is required unless unbind is true"
  }),
  figma_batch_bind_variables: z.object({
    bindings: z.array(
      z.object({
        nodeId: z.string().min(1),
        field: z.string().min(1),
        variableId: z.string().min(1).optional(),
        variableName: z.string().min(1).optional(),
        collectionId: z.string().min(1).optional(),
        collectionName: z.string().min(1).optional(),
        modeId: z.string().min(1).optional(),
        modeName: z.string().min(1).optional(),
        unbind: z.boolean().optional()
      }).refine((value) => value.unbind || value.variableId || value.variableName, {
        message: "variableId or variableName is required unless unbind is true"
      })
    ).min(1)
  }),
  figma_set_variable_mode: z.object({
    nodeId: z.string().min(1).optional(),
    collectionId: z.string().min(1).optional(),
    collectionName: z.string().min(1).optional(),
    modeId: z.string().min(1).optional(),
    modeName: z.string().min(1).optional()
  }).refine((value) => value.collectionId || value.collectionName, {
    message: "collectionId or collectionName is required"
  }).refine((value) => value.modeId || value.modeName, {
    message: "modeId or modeName is required"
  }),
  figma_apply_style: z.object({
    nodeId: z.string().min(1),
    styleType: z.enum(["paint", "text", "effect", "grid"]),
    styleId: z.string().min(1)
  }),
  figma_batch_apply_styles: z.object({
    applications: z.array(
      z.object({
        nodeId: z.string().min(1),
        styleType: z.enum(["paint", "text", "effect", "grid"]),
        styleId: z.string().min(1)
      })
    ).min(1)
  }),
  figma_create_style: z.object({
    styleType: z.enum(["paint", "text"]),
    name: z.string().min(1),
    description: z.string().optional(),
    color: z.string().min(1).optional(),
    fontFamily: z.string().min(1).optional(),
    fontStyle: z.string().min(1).optional(),
    fontSize: z.number().positive().optional()
  }),
  figma_delete_style: z.object({
    styleType: z.enum(["paint", "text", "effect", "grid"]),
    styleId: z.string().min(1)
  }),
  figma_cleanup_artifacts: z.object({
    namePrefix: z.string().min(1).optional(),
    includeNodes: z.boolean().optional(),
    includeStyles: z.boolean().optional(),
    includeVariables: z.boolean().optional()
  }),
  figma_clone_node: nodeIdSchema,
  figma_create_child: z.object({
    parentId: z.string().min(1),
    nodeType: z.string().min(1),
    properties: z.record(z.string(), z.unknown()).optional()
  }),
  figma_create_variable_collection: z.object({
    name: z.string().min(1),
    initialModeName: z.string().min(1).optional(),
    additionalModes: z.array(z.string().min(1)).optional()
  }),
  figma_add_mode: z.object({
    collectionId: z.string().min(1),
    modeName: z.string().min(1)
  }),
  figma_rename_mode: z.object({
    collectionId: z.string().min(1),
    modeId: z.string().min(1),
    newName: z.string().min(1)
  }),
  figma_create_variable: z.object({
    collectionId: z.string().min(1),
    name: z.string().min(1),
    resolvedType: z.string().min(1),
    description: z.string().optional(),
    valuesByMode: z.record(z.string(), z.unknown()).optional()
  }),
  figma_batch_create_variables: z.object({
    collectionId: z.string().min(1),
    variables: z.array(
      z.object({
        name: z.string().min(1),
        resolvedType: z.string().min(1),
        description: z.string().optional(),
        valuesByMode: z.record(z.string(), z.unknown()).optional()
      })
    ).min(1)
  }),
  figma_update_variable: z.object({
    variableId: z.string().min(1),
    modeId: z.string().min(1),
    value: z.union([z.string(), z.number(), z.boolean()])
  }),
  figma_batch_update_variables: z.object({
    updates: z.array(
      z.object({
        variableId: z.string().min(1),
        modeId: z.string().min(1),
        value: z.union([z.string(), z.number(), z.boolean()])
      })
    ).min(1)
  }),
  figma_delete_variable: z.object({
    variableId: z.string().min(1)
  }),
  figma_rename_variable: z.object({
    variableId: z.string().min(1),
    newName: z.string().min(1)
  }),
  figma_delete_variable_collection: z.object({
    collectionId: z.string().min(1)
  }),
  figma_setup_design_tokens: z.object({
    collectionName: z.string().min(1),
    modes: z.array(z.string().min(1)).min(1),
    tokens: z.array(
      z.object({
        name: z.string().min(1),
        resolvedType: z.string().min(1),
        description: z.string().optional(),
        values: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
      })
    ).min(1)
  }),
  figma_create_component: z.object({
    nodeId: z.string().min(1),
    name: z.string().min(1).optional()
  }),
  figma_search_components: z.object({
    query: z.string().optional()
  }),
  figma_get_library_components: z.object({
    query: z.string().optional(),
    limit: z.number().int().positive().max(200).optional()
  }),
  figma_get_component_details: z.object({
    componentKey: z.string().min(1).optional(),
    nodeId: z.string().min(1).optional(),
    componentName: z.string().min(1).optional()
  }).refine((value) => value.componentKey || value.nodeId || value.componentName, {
    message: "componentKey, nodeId, or componentName is required"
  }),
  figma_get_component: z.object({
    componentKey: z.string().min(1).optional(),
    nodeId: z.string().min(1).optional(),
    componentName: z.string().min(1).optional()
  }).refine((value) => value.componentKey || value.nodeId || value.componentName, {
    message: "componentKey, nodeId, or componentName is required"
  }),
  figma_get_component_property_catalog: z.object({
    componentKey: z.string().min(1).optional(),
    nodeId: z.string().min(1).optional(),
    componentName: z.string().min(1).optional()
  }).refine((value) => value.componentKey || value.nodeId || value.componentName, {
    message: "componentKey, nodeId, or componentName is required"
  }),
  figma_get_component_family_health: z.object({
    componentKey: z.string().min(1).optional(),
    nodeId: z.string().min(1).optional(),
    componentName: z.string().min(1).optional(),
    familyName: z.string().min(1).optional()
  }).refine((value) => value.componentKey || value.nodeId || value.componentName || value.familyName, {
    message: "componentKey, nodeId, componentName, or familyName is required"
  }),
  figma_get_component_image: z.object({
    componentKey: z.string().min(1).optional(),
    nodeId: z.string().min(1).optional(),
    componentName: z.string().min(1).optional()
  }).refine((value) => value.componentKey || value.nodeId || value.componentName, {
    message: "componentKey, nodeId, or componentName is required"
  }),
  figma_add_component_property: z.object({
    nodeId: z.string().min(1),
    propertyName: z.string().min(1),
    type: z.enum(["BOOLEAN", "TEXT", "INSTANCE_SWAP", "VARIANT"]),
    defaultValue: z.union([z.string(), z.boolean()]).optional()
  }),
  figma_edit_component_property: z.object({
    nodeId: z.string().min(1),
    propertyName: z.string().min(1),
    newName: z.string().min(1).optional(),
    defaultValue: z.union([z.string(), z.boolean()]).optional(),
    preferredValues: z.array(
      z.object({
        type: z.string().min(1),
        key: z.string().min(1)
      })
    ).optional()
  }).refine(
    (value) => value.newName !== undefined || value.defaultValue !== undefined || value.preferredValues !== undefined,
    { message: "At least one property update is required" }
  ),
  figma_delete_component_property: z.object({
    nodeId: z.string().min(1),
    propertyName: z.string().min(1)
  }),
  figma_arrange_component_set: z.object({
    componentSetId: z.string().min(1).optional(),
    columns: z.number().int().positive().max(24).optional(),
    gapX: z.number().min(0).max(1000).optional(),
    gapY: z.number().min(0).max(1000).optional(),
    sortByName: z.boolean().optional()
  }),
  figma_instantiate_component: z.object({
    nodeId: z.string().min(1).optional(),
    componentKey: z.string().min(1).optional(),
    parentId: z.string().min(1).optional(),
    position: z.object({
      x: z.number(),
      y: z.number()
    }).optional(),
    variant: z.record(z.string(), z.unknown()).optional(),
    overrides: z.record(z.string(), z.unknown()).optional()
  }).refine((value) => Boolean(value.nodeId || value.componentKey), {
    message: "nodeId or componentKey is required"
  }),
  figma_batch_instantiate_components: z.object({
    instances: z.array(
      z.object({
        nodeId: z.string().min(1).optional(),
        componentKey: z.string().min(1).optional(),
        parentId: z.string().min(1).optional(),
        position: z.object({
          x: z.number(),
          y: z.number()
        }).optional(),
        variant: z.record(z.string(), z.unknown()).optional(),
        overrides: z.record(z.string(), z.unknown()).optional()
      }).refine((value) => Boolean(value.nodeId || value.componentKey), {
        message: "nodeId or componentKey is required"
      })
    ).min(1)
  }),
  figma_set_instance_properties: z.object({
    nodeId: z.string().min(1),
    properties: z.record(z.string(), z.unknown())
  }),
  figma_batch_set_instance_properties: z.object({
    updates: z.array(
      z.object({
        nodeId: z.string().min(1),
        properties: z.record(z.string(), z.unknown())
      })
    ).min(1)
  }),
  figma_get_comments: z.object({
    limit: z.number().int().positive().optional()
  }),
  figma_get_inline_comments: z.object({
    nodeId: z.string().min(1),
    includeReplies: z.boolean().optional(),
    limit: z.number().int().positive().optional()
  }),
  figma_get_comment_replies: z.object({
    commentId: z.string().min(1),
    limit: z.number().int().positive().optional()
  }),
  figma_get_comment_thread: z.object({
    commentId: z.string().min(1),
    limit: z.number().int().positive().optional()
  }),
  figma_get_node_comments: z.object({
    nodeId: z.string().min(1),
    includeReplies: z.boolean().optional(),
    limit: z.number().int().positive().optional()
  }),
  figma_get_design_system_summary: noArgsSchema,
  figma_get_dashboard: noArgsSchema,
  figma_generate_change_impact_summary: z.object({
    limit: z.number().int().positive().optional()
  }),
  figma_get_release_readiness: noArgsSchema,
  figma_get_release_readiness_trend: z.object({
    limit: z.number().int().positive().optional(),
    record: z.boolean().optional()
  }),
  figma_get_troubleshooting_summary: noArgsSchema,
  figma_get_design_system_kit: z.object({
    includeImage: z.boolean().optional(),
    componentNames: z.array(z.string().min(1)).optional(),
    componentLimit: z.number().int().positive().optional()
  }),
  figma_browse_tokens: z.object({
    filter: z.string().optional(),
    type: z.string().optional(),
    collection: z.string().optional(),
    limitPerCollection: z.number().int().positive().optional(),
    preset: z.enum(["alphabetical", "largest-groups", "smallest-groups"]).optional(),
    sortBy: z.enum(["name", "count"]).optional(),
    order: z.enum(["asc", "desc"]).optional()
  }),
  figma_browse_design_system: z.object({
    filter: z.string().optional(),
    componentLimit: z.number().int().positive().optional(),
    styleLimit: z.number().int().positive().optional(),
    preset: z.enum(["alphabetical", "largest-groups", "smallest-groups"]).optional(),
    sortBy: z.enum(["name", "count"]).optional(),
    order: z.enum(["asc", "desc"]).optional()
  }),
  figma_get_token_values: z.object({
    filter: z.string().optional(),
    type: z.string().optional(),
    limit: z.number().int().positive().optional()
  }),
  figma_generate_design_system_report: z.object({
    auditProfile: z.enum(["default", "release"]).optional()
  }),
  figma_lint_design: z.object({
    profile: z.enum(["default", "release"]).optional(),
    ignorePrefixes: z.array(z.string().min(1)).optional(),
    ignoreNamePatterns: z.array(z.string().min(1)).optional(),
    relaxedComponentNaming: z.boolean().optional()
  }),
  figma_audit_design_system: z.object({
    profile: z.enum(["default", "release"]).optional(),
    ignorePrefixes: z.array(z.string().min(1)).optional(),
    ignoreNamePatterns: z.array(z.string().min(1)).optional(),
    relaxedComponentNaming: z.boolean().optional()
  }),
  figma_get_audit_waivers: noArgsSchema,
  figma_upsert_audit_waiver: z.object({
    id: z.string().min(1).optional(),
    fileKey: z.string().min(1).optional(),
    profile: z.enum(["default", "release", "all"]).optional(),
    category: z.string().min(1),
    messagePattern: z.string().min(1),
    note: z.string().optional()
  }),
  figma_delete_audit_waiver: z.object({
    id: z.string().min(1)
  }),
  figma_get_component_for_development: z.object({
    componentKey: z.string().min(1).optional(),
    nodeId: z.string().min(1).optional(),
    componentName: z.string().min(1).optional(),
    includeScreenshot: z.boolean().optional()
  }).refine((value) => value.componentKey || value.nodeId || value.componentName, {
    message: "componentKey, nodeId, or componentName is required"
  }),
  figma_generate_component_doc: z.object({
    componentName: z.string().min(1)
  }),
  figma_detect_doc_drift: z.object({
    componentName: z.string().min(1),
    depth: z.number().int().min(1).max(5).optional()
  }),
  figma_check_design_parity: z.object({
    expectedComponents: z.array(z.string().min(1)).optional(),
    expectedVariables: z.array(z.string().min(1)).optional(),
    expectedStyles: z.array(z.string().min(1)).optional()
  }),
  figma_post_comment: z.object({
    message: z.string().min(1),
    nodeId: z.string().min(1).optional(),
    x: z.number().optional(),
    y: z.number().optional()
  }),
  figma_post_inline_comment: z.object({
    message: z.string().min(1),
    nodeId: z.string().min(1),
    x: z.number().optional(),
    y: z.number().optional(),
    regionWidth: z.number().positive().optional(),
    regionHeight: z.number().positive().optional(),
    commentPinCorner: z.enum(["bottom-left", "bottom-right", "top-left", "top-right"]).optional()
  }),
  figma_reply_to_comment: z.object({
    commentId: z.string().min(1),
    message: z.string().min(1)
  }),
  figma_delete_comment: z.object({
    commentId: z.string().min(1)
  }),
  figma_get_operation_trace: z.object({
    requestId: z.string().min(1).optional(),
    limit: z.number().int().positive().optional()
  }),
  figma_get_design_changes: z.object({
    clear: z.boolean().optional(),
    limit: z.number().int().positive().optional()
  }),
  figma_get_console_logs: z.object({
    level: z.string().optional(),
    limit: z.number().int().positive().optional()
  }),
  figma_take_screenshot: z.object({
    nodeId: z.string().min(1).optional()
  }),
  figma_generate_verification_report: z.object({
    nodeId: z.string().min(1).optional(),
    includeChildren: z.boolean().optional(),
    includeScreenshot: z.boolean().optional()
  }),
  figma_generate_section_report: z.object({
    nodeId: z.string().min(1),
    depth: z.number().int().min(1).max(5).optional()
  })
} satisfies Record<string, z.ZodTypeAny>;

export function getToolInputSchema(toolName: string) {
  return toolInputSchemas[toolName as keyof typeof toolInputSchemas] ?? z.object({}).catchall(z.unknown());
}
