import { describe, expect, it } from "vitest";
import { getToolInputSchema } from "./tool-schemas.js";

describe("tool input schemas", () => {
  it("requires nodeId for figma_get_node", () => {
    const schema = getToolInputSchema("figma_get_node");

    expect(() => schema.parse({})).toThrow();
    expect(schema.parse({ nodeId: "123:456" })).toEqual({ nodeId: "123:456" });
  });

  it("validates figma_get_file_data schema", () => {
    const schema = getToolInputSchema("figma_get_file_data");

    expect(
      schema.parse({ depth: 2, nodeIds: ["123:456"], verbosity: "summary" })
    ).toEqual({ depth: 2, nodeIds: ["123:456"], verbosity: "summary" });
  });

  it("accepts empty payload for runtime status", () => {
    const schema = getToolInputSchema("figma_get_status");

    expect(schema.parse({})).toEqual({});
  });

  it("validates style write schemas", () => {
    const applySchema = getToolInputSchema("figma_apply_style");
    const batchApplySchema = getToolInputSchema("figma_batch_apply_styles");
    const createSchema = getToolInputSchema("figma_create_style");
    const deleteSchema = getToolInputSchema("figma_delete_style");
    const cleanupSchema = getToolInputSchema("figma_cleanup_artifacts");
    const layoutSchema = getToolInputSchema("figma_set_layout");
    const bindSchema = getToolInputSchema("figma_bind_variable");
    const batchBindSchema = getToolInputSchema("figma_batch_bind_variables");
    const modeSchema = getToolInputSchema("figma_set_variable_mode");

    expect(
      applySchema.parse({ nodeId: "123:456", styleType: "text", styleId: "S:1" })
    ).toEqual({ nodeId: "123:456", styleType: "text", styleId: "S:1" });
    expect(
      batchApplySchema.parse({
        applications: [{ nodeId: "123:456", styleType: "text", styleId: "S:1" }]
      })
    ).toEqual({
      applications: [{ nodeId: "123:456", styleType: "text", styleId: "S:1" }]
    });
    expect(
      createSchema.parse({ styleType: "paint", name: "Brand/Primary", color: "#123ABC" })
    ).toEqual({ styleType: "paint", name: "Brand/Primary", color: "#123ABC" });
    expect(
      deleteSchema.parse({ styleType: "paint", styleId: "S:1" })
    ).toEqual({ styleType: "paint", styleId: "S:1" });
    expect(
      cleanupSchema.parse({ namePrefix: "Runtime MCP", includeStyles: true, includeVariables: false })
    ).toEqual({ namePrefix: "Runtime MCP", includeStyles: true, includeVariables: false });
    expect(
      layoutSchema.parse({ nodeId: "123:456", layoutMode: "VERTICAL", itemSpacing: 24, paddingLeft: 40 })
    ).toEqual({ nodeId: "123:456", layoutMode: "VERTICAL", itemSpacing: 24, paddingLeft: 40 });
    expect(
      bindSchema.parse({
        nodeId: "123:456",
        field: "width",
        variableName: "viewport/width",
        collectionName: "Responsive",
        modeName: "Desktop"
      })
    ).toEqual({
      nodeId: "123:456",
      field: "width",
      variableName: "viewport/width",
      collectionName: "Responsive",
      modeName: "Desktop"
    });
    expect(
      batchBindSchema.parse({
        bindings: [
          {
            nodeId: "123:456",
            field: "width",
            variableName: "viewport/width"
          }
        ]
      })
    ).toEqual({
      bindings: [
        {
          nodeId: "123:456",
          field: "width",
          variableName: "viewport/width"
        }
      ]
    });
    expect(
      modeSchema.parse({ nodeId: "123:456", collectionName: "Responsive", modeName: "Desktop" })
    ).toEqual({ nodeId: "123:456", collectionName: "Responsive", modeName: "Desktop" });
  });

  it("validates comments schemas", () => {
    const getSchema = getToolInputSchema("figma_get_comments");
    const inlineGetSchema = getToolInputSchema("figma_get_inline_comments");
    const repliesSchema = getToolInputSchema("figma_get_comment_replies");
    const threadSchema = getToolInputSchema("figma_get_comment_thread");
    const nodeCommentsSchema = getToolInputSchema("figma_get_node_comments");
    const batchCreateVariablesSchema = getToolInputSchema("figma_batch_create_variables");
    const renameVariableSchema = getToolInputSchema("figma_rename_variable");
    const deleteCollectionSchema = getToolInputSchema("figma_delete_variable_collection");
    const setupTokensSchema = getToolInputSchema("figma_setup_design_tokens");
    const componentDetailsSchema = getToolInputSchema("figma_get_component_details");
    const componentSchema = getToolInputSchema("figma_get_component");
    const componentPropertyCatalogSchema = getToolInputSchema("figma_get_component_property_catalog");
    const componentFamilyHealthSchema = getToolInputSchema("figma_get_component_family_health");
    const componentImageSchema = getToolInputSchema("figma_get_component_image");
    const addComponentPropertySchema = getToolInputSchema("figma_add_component_property");
    const editComponentPropertySchema = getToolInputSchema("figma_edit_component_property");
    const deleteComponentPropertySchema = getToolInputSchema("figma_delete_component_property");
    const componentDevSchema = getToolInputSchema("figma_get_component_for_development");
    const summarySchema = getToolInputSchema("figma_get_design_system_summary");
    const dashboardSchema = getToolInputSchema("figma_get_dashboard");
    const changeImpactSchema = getToolInputSchema("figma_generate_change_impact_summary");
    const readinessSchema = getToolInputSchema("figma_get_release_readiness");
    const readinessTrendSchema = getToolInputSchema("figma_get_release_readiness_trend");
    const designSystemKitSchema = getToolInputSchema("figma_get_design_system_kit");
    const browseTokensSchema = getToolInputSchema("figma_browse_tokens");
    const browseDesignSystemSchema = getToolInputSchema("figma_browse_design_system");
    const tokenValuesSchema = getToolInputSchema("figma_get_token_values");
    const designSystemReportSchema = getToolInputSchema("figma_generate_design_system_report");
    const auditSchema = getToolInputSchema("figma_audit_design_system");
    const getWaiversSchema = getToolInputSchema("figma_get_audit_waivers");
    const upsertWaiverSchema = getToolInputSchema("figma_upsert_audit_waiver");
    const deleteWaiverSchema = getToolInputSchema("figma_delete_audit_waiver");
    const docSchema = getToolInputSchema("figma_generate_component_doc");
    const docDriftSchema = getToolInputSchema("figma_detect_doc_drift");
    const paritySchema = getToolInputSchema("figma_check_design_parity");
    const postSchema = getToolInputSchema("figma_post_comment");
    const postInlineSchema = getToolInputSchema("figma_post_inline_comment");
    const replySchema = getToolInputSchema("figma_reply_to_comment");
    const deleteSchema = getToolInputSchema("figma_delete_comment");
    const verificationReportSchema = getToolInputSchema("figma_generate_verification_report");
    const sectionReportSchema = getToolInputSchema("figma_generate_section_report");
    const batchInstantiateSchema = getToolInputSchema("figma_batch_instantiate_components");
    const executeSchema = getToolInputSchema("figma_execute");
    const clearConsoleSchema = getToolInputSchema("figma_clear_console");
    const watchConsoleSchema = getToolInputSchema("figma_watch_console");
    const reloadPluginSchema = getToolInputSchema("figma_reload_plugin");

    expect(getSchema.parse({ limit: 5 })).toEqual({ limit: 5 });
    expect(inlineGetSchema.parse({ nodeId: "123:456", includeReplies: true, limit: 3 })).toEqual({
      nodeId: "123:456",
      includeReplies: true,
      limit: 3
    });
    expect(repliesSchema.parse({ commentId: "comment-1", limit: 3 })).toEqual({
      commentId: "comment-1",
      limit: 3
    });
    expect(threadSchema.parse({ commentId: "comment-1", limit: 3 })).toEqual({
      commentId: "comment-1",
      limit: 3
    });
    expect(nodeCommentsSchema.parse({ nodeId: "123:456", includeReplies: true, limit: 3 })).toEqual({
      nodeId: "123:456",
      includeReplies: true,
      limit: 3
    });
    expect(
      executeSchema.parse({
        code: "return { ok: true };",
        payload: { foo: "bar" }
      })
    ).toEqual({
      code: "return { ok: true };",
      payload: { foo: "bar" }
    });
    expect(clearConsoleSchema.parse({})).toEqual({});
    expect(watchConsoleSchema.parse({ durationMs: 1000, pollIntervalMs: 250, limit: 10 })).toEqual({
      durationMs: 1000,
      pollIntervalMs: 250,
      limit: 10
    });
    expect(reloadPluginSchema.parse({})).toEqual({});
    expect(
      batchCreateVariablesSchema.parse({
        collectionId: "VC:1",
        variables: [{ name: "color/primary", resolvedType: "COLOR" }]
      })
    ).toEqual({
      collectionId: "VC:1",
      variables: [{ name: "color/primary", resolvedType: "COLOR" }]
    });
    expect(
      renameVariableSchema.parse({ variableId: "VariableID:1", newName: "color/brand/primary" })
    ).toEqual({ variableId: "VariableID:1", newName: "color/brand/primary" });
    expect(
      deleteCollectionSchema.parse({ collectionId: "VariableCollectionId:1" })
    ).toEqual({ collectionId: "VariableCollectionId:1" });
    expect(
      setupTokensSchema.parse({
        collectionName: "Brand Tokens",
        modes: ["Light", "Dark"],
        tokens: [
          {
            name: "color/primary",
            resolvedType: "COLOR",
            values: {
              Light: "#0055FF",
              Dark: "#99BBFF"
            }
          }
        ]
      })
    ).toEqual({
      collectionName: "Brand Tokens",
      modes: ["Light", "Dark"],
      tokens: [
        {
          name: "color/primary",
          resolvedType: "COLOR",
          values: {
            Light: "#0055FF",
            Dark: "#99BBFF"
          }
        }
      ]
    });
    expect(getWaiversSchema.parse({})).toEqual({});
    expect(
      upsertWaiverSchema.parse({
        fileKey: "file-key",
        profile: "release",
        category: "styles",
        messagePattern: "No paint styles found",
        note: "accepted for now"
      })
    ).toEqual({
      fileKey: "file-key",
      profile: "release",
      category: "styles",
      messagePattern: "No paint styles found",
      note: "accepted for now"
    });
    expect(deleteWaiverSchema.parse({ id: "waiver-1" })).toEqual({ id: "waiver-1" });
    expect(componentDetailsSchema.parse({ componentName: "Button/Primary" })).toEqual({
      componentName: "Button/Primary"
    });
    expect(componentSchema.parse({ componentName: "Button/Primary" })).toEqual({
      componentName: "Button/Primary"
    });
    expect(componentPropertyCatalogSchema.parse({ componentName: "Button/Primary" })).toEqual({
      componentName: "Button/Primary"
    });
    expect(componentFamilyHealthSchema.parse({ componentName: "Checkbox 1.0.0" })).toEqual({
      componentName: "Checkbox 1.0.0"
    });
    expect(componentImageSchema.parse({ componentName: "Button/Primary" })).toEqual({
      componentName: "Button/Primary"
    });
    expect(
      addComponentPropertySchema.parse({
        nodeId: "123:456",
        propertyName: "Show Icon",
        type: "BOOLEAN",
        defaultValue: true
      })
    ).toEqual({
      nodeId: "123:456",
      propertyName: "Show Icon",
      type: "BOOLEAN",
      defaultValue: true
    });
    expect(
      editComponentPropertySchema.parse({
        nodeId: "123:456",
        propertyName: "Show Icon#123:456",
        newName: "Has Icon",
        defaultValue: false
      })
    ).toEqual({
      nodeId: "123:456",
      propertyName: "Show Icon#123:456",
      newName: "Has Icon",
      defaultValue: false
    });
    expect(
      deleteComponentPropertySchema.parse({
        nodeId: "123:456",
        propertyName: "Show Icon#123:456"
      })
    ).toEqual({
      nodeId: "123:456",
      propertyName: "Show Icon#123:456"
    });
    expect(
      batchInstantiateSchema.parse({
        instances: [{ nodeId: "123:456", parentId: "1:1", position: { x: 0, y: 0 } }]
      })
    ).toEqual({
      instances: [{ nodeId: "123:456", parentId: "1:1", position: { x: 0, y: 0 } }]
    });
    expect(componentDevSchema.parse({ componentName: "Button/Primary", includeScreenshot: true })).toEqual({
      componentName: "Button/Primary",
      includeScreenshot: true
    });
    expect(docSchema.parse({ componentName: "Button/Primary" })).toEqual({
      componentName: "Button/Primary"
    });
    expect(docDriftSchema.parse({ componentName: "Checkbox 1.0.0", depth: 2 })).toEqual({
      componentName: "Checkbox 1.0.0",
      depth: 2
    });
    expect(summarySchema.parse({})).toEqual({});
    expect(dashboardSchema.parse({})).toEqual({});
    expect(changeImpactSchema.parse({ limit: 5 })).toEqual({ limit: 5 });
    expect(readinessSchema.parse({})).toEqual({});
    expect(readinessTrendSchema.parse({ limit: 5, record: false })).toEqual({ limit: 5, record: false });
    expect(
      designSystemKitSchema.parse({
        includeImage: true,
        componentNames: ["Checkbox"],
        componentLimit: 5
      })
    ).toEqual({
      includeImage: true,
      componentNames: ["Checkbox"],
      componentLimit: 5
    });
    expect(
      browseTokensSchema.parse({
        filter: "page",
        type: "FLOAT",
        collection: "Responsive",
        limitPerCollection: 10
      })
    ).toEqual({
      filter: "page",
      type: "FLOAT",
      collection: "Responsive",
      limitPerCollection: 10
    });
    expect(
      browseDesignSystemSchema.parse({
        filter: "button",
        componentLimit: 10,
        styleLimit: 10
      })
    ).toEqual({
      filter: "button",
      componentLimit: 10,
      styleLimit: 10
    });
    expect(tokenValuesSchema.parse({ filter: "page", type: "FLOAT", limit: 10 })).toEqual({
      filter: "page",
      type: "FLOAT",
      limit: 10
    });
    expect(designSystemReportSchema.parse({})).toEqual({});
    expect(auditSchema.parse({})).toEqual({});
    expect(docSchema.parse({ componentName: "Button/Primary" })).toEqual({ componentName: "Button/Primary" });
    expect(
      paritySchema.parse({ expectedComponents: ["Button/Primary"], expectedVariables: ["color/primary"] })
    ).toEqual({ expectedComponents: ["Button/Primary"], expectedVariables: ["color/primary"] });
    expect(
      postSchema.parse({ message: "Looks good", nodeId: "123:456", x: 10, y: 20 })
    ).toEqual({ message: "Looks good", nodeId: "123:456", x: 10, y: 20 });
    expect(
      postInlineSchema.parse({
        message: "Inline looks good",
        nodeId: "123:456",
        x: 10,
        y: 20,
        regionWidth: 120,
        regionHeight: 24,
        commentPinCorner: "top-left"
      })
    ).toEqual({
      message: "Inline looks good",
      nodeId: "123:456",
      x: 10,
      y: 20,
      regionWidth: 120,
      regionHeight: 24,
      commentPinCorner: "top-left"
    });
    expect(
      replySchema.parse({ commentId: "comment-1", message: "Replying here" })
    ).toEqual({ commentId: "comment-1", message: "Replying here" });
    expect(deleteSchema.parse({ commentId: "comment-1" })).toEqual({ commentId: "comment-1" });
    expect(
      verificationReportSchema.parse({
        nodeId: "123:456",
        includeChildren: true,
        includeScreenshot: false
      })
    ).toEqual({
      nodeId: "123:456",
      includeChildren: true,
      includeScreenshot: false
    });
    expect(sectionReportSchema.parse({ nodeId: "123:456", depth: 2 })).toEqual({
      nodeId: "123:456",
      depth: 2
    });
  });
});
