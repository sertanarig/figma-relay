import process from "node:process";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { resolveBridgeUrl } from "./resolve-bridge-url.mjs";

const rootCwd = process.cwd();
const SHOWCASE_X = 36000;
const SHOWCASE_Y = 1800;
let currentStep = "boot";

function createTransport(bridgeUrl) {
  return new StdioClientTransport({
    command: `${rootCwd}/node_modules/.bin/tsx`,
    args: ["packages/mcp-server/src/stdio.ts"],
    cwd: rootCwd,
    stderr: "pipe",
    env: {
      ...process.env,
      CODEX_FIGMA_BRIDGE_URL: bridgeUrl
    }
  });
}

function getText(result) {
  return result?.content?.find((item) => item.type === "text")?.text || "{}";
}

function parseResult(result) {
  if (result?.isError) {
    throw new Error(getText(result) || "Unknown tool error");
  }

  return JSON.parse(getText(result));
}

function findFirstFloatVariable(collections, matcher) {
  for (const collection of Array.isArray(collections) ? collections : []) {
    for (const variable of Array.isArray(collection.variables) ? collection.variables : []) {
      if (String(variable.type || "").toUpperCase() !== "FLOAT") {
        continue;
      }
      if (matcher(variable, collection)) {
        return { variable, collection };
      }
    }
  }
  return null;
}

function findFirstColorVariable(collections) {
  for (const collection of Array.isArray(collections) ? collections : []) {
    for (const variable of Array.isArray(collection.variables) ? collection.variables : []) {
      if (String(variable.type || "").toUpperCase() === "COLOR") {
        return { variable, collection };
      }
    }
  }
  return null;
}

async function main() {
  const bridgeUrl = await resolveBridgeUrl();
  const transport = createTransport(bridgeUrl);
  const client = new Client({ name: "figma-runtime-full-showcase", version: "0.2.0" });
  const timestamp = new Date().toISOString().slice(11, 19);
  const tempPrefix = `Runtime MCP Full Test ${Date.now()}`;
  const showcaseName = `Runtime Showcase ${new Date().toISOString().slice(0, 10)} ${timestamp}`;

  let showcaseRootId = null;
  let tempRootName = `${tempPrefix} Root`;
  let tempCollectionId = null;
  let tempCollectionName = `${tempPrefix} Tokens`;
  let setupCollectionId = null;
  let setupCollectionName = `${tempPrefix} Setup Tokens`;
  let tempPaintStyleId = null;
  let tempTextStyleId = null;
  let tempCommentId = null;
  let tempInlineCommentId = null;
  let tempWaiverId = null;

  const checks = {};
  async function call(name, args = {}) {
    const result = await client.callTool({ name, arguments: args });
    return parseResult(result);
  }

  try {
    await client.connect(transport);

    currentStep = "read-foundation";
    const status = await call("figma_get_status");
    const openFiles = await call("figma_list_open_files");
    const fileContext = await call("figma_get_file_context");
    const fileData = await call("figma_get_file_data", {
      depth: 2,
      verbosity: "summary"
    });
    const styles = await call("figma_get_styles");
    const variables = await call("figma_get_variables");
    const components = await call("figma_get_components", { query: "Checkbox" });
    const dashboard = await call("figma_get_dashboard");
    const summary = await call("figma_get_design_system_summary");
    const browserTokens = await call("figma_browse_tokens", {
      preset: "largest-groups",
      limitPerCollection: 3
    });
    const browserDesignSystem = await call("figma_browse_design_system", {
      preset: "largest-groups",
      componentLimit: 5,
      styleLimit: 5
    });
    const tokenValues = await call("figma_get_token_values", {
      type: "FLOAT",
      limit: 5
    });
    const kit = await call("figma_get_design_system_kit", {
      componentLimit: 3,
      includeImage: false
    });
    const designSystemReport = await call("figma_generate_design_system_report", {
      auditProfile: "release"
    });
    const audit = await call("figma_audit_design_system", {
      profile: "release"
    });
    const readiness = await call("figma_get_release_readiness");
    const readinessTrend = await call("figma_get_release_readiness_trend", {
      limit: 5,
      record: true
    });
    const troubleshooting = await call("figma_get_troubleshooting_summary");
    const changeImpact = await call("figma_generate_change_impact_summary", {
      limit: 10
    });

    checks.runtime = {
      sessionId: status.runtimeSessionId || null,
      fileName: fileContext.fileName,
      openFiles: Array.isArray(openFiles.files) ? openFiles.files.length : 0
    };
    checks.read = {
      pageName: fileContext.pageName,
      topLevelNodes: Array.isArray(fileData.nodes) ? fileData.nodes.length : 0
    };
    checks.designSystem = {
      collections: Array.isArray(summary.collections) ? summary.collections.length : 0,
      tokenCollections: Array.isArray(browserTokens.collections) ? browserTokens.collections.length : 0,
      componentGroups: Array.isArray(browserDesignSystem.components) ? browserDesignSystem.components.length : 0,
      tokenValues: Array.isArray(tokenValues.tokens) ? tokenValues.tokens.length : 0,
      kitComponents: Array.isArray(kit.components) ? kit.components.length : 0
    };
    checks.reports = {
      dashboard: dashboard.health?.status || null,
      auditScore: audit.score ?? null,
      readiness: readiness.status || null,
      readinessTrend: readinessTrend.direction || null,
      topIssues: Array.isArray(designSystemReport.health?.topIssues) ? designSystemReport.health.topIssues.length : 0,
      impactAreas: Array.isArray(changeImpact.areas) ? changeImpact.areas.length : 0,
      recommendations: Array.isArray(troubleshooting.recommendations) ? troubleshooting.recommendations.length : 0
    };

    const paddingCandidate =
      findFirstFloatVariable(variables.collections, (variable) =>
        String(variable.name || "").includes("padding/x")
      ) ||
      findFirstFloatVariable(variables.collections, (variable) =>
        String(variable.name || "").toLowerCase().includes("padding")
      );
    const gapCandidate =
      findFirstFloatVariable(variables.collections, (variable) =>
        String(variable.name || "").includes("section/gap")
      ) ||
      findFirstFloatVariable(variables.collections, (variable) =>
        String(variable.name || "").toLowerCase().includes("gap")
      );
    const textStyle = (Array.isArray(styles.textStyles) ? styles.textStyles : [])[0] || null;
    const effectStyle = (Array.isArray(styles.effectStyles) ? styles.effectStyles : [])[0] || null;
    const checkbox =
      (Array.isArray(components.components) ? components.components : []).find(
        (item) => item.name === "Checkbox 1.0.0"
      ) ||
      (Array.isArray(components.components) ? components.components : [])[0] ||
      null;

    if (!textStyle || !checkbox) {
      throw new Error("SHOWCASE_PREREQUISITES_MISSING");
    }

    currentStep = "create-showcase-root";
    const showcaseRoot = await call("figma_create_node", {
      nodeType: "FRAME",
      properties: {
        name: showcaseName,
        x: SHOWCASE_X,
        y: SHOWCASE_Y,
        width: 920,
        height: 720
      }
    });
    showcaseRootId = showcaseRoot.node.id;

    await call("figma_set_layout", {
      nodeId: showcaseRootId,
      layoutMode: "VERTICAL",
      primaryAxisSizingMode: "AUTO",
      counterAxisSizingMode: "FIXED",
      primaryAxisAlignItems: "MIN",
      counterAxisAlignItems: "MIN",
      paddingLeft: 24,
      paddingRight: 24,
      paddingTop: 24,
      paddingBottom: 24,
      itemSpacing: 16,
      width: 920,
      height: 720
    });

    if (paddingCandidate || gapCandidate) {
      currentStep = "bind-existing-variables";
      const bindings = [];
      if (paddingCandidate) {
        bindings.push({
          nodeId: showcaseRootId,
          field: "paddingLeft",
          variableName: paddingCandidate.variable.name
        });
        bindings.push({
          nodeId: showcaseRootId,
          field: "paddingRight",
          variableName: paddingCandidate.variable.name
        });
      }
      if (gapCandidate) {
        bindings.push({
          nodeId: showcaseRootId,
          field: "itemSpacing",
          variableName: gapCandidate.variable.name
        });
      }
      if (bindings.length > 0) {
        await call("figma_batch_bind_variables", { bindings });
      }
    }

    currentStep = "title-and-subtitle";
    const titleNode = await call("figma_create_child", {
      parentId: showcaseRootId,
      nodeType: "TEXT",
      properties: {
        name: `${showcaseName} Title`,
        text: "Figma Relay Capability Showcase"
      }
    });
    await call("figma_apply_style", {
      nodeId: titleNode.node.id,
      styleType: "text",
      styleId: textStyle.id
    });

    const subtitleNode = await call("figma_create_child", {
      parentId: showcaseRootId,
      nodeType: "TEXT",
      properties: {
        name: `${showcaseName} Subtitle`,
        text: "All core capabilities were exercised safely on this page."
      }
    });
    await call("figma_set_text", {
      nodeId: subtitleNode.node.id,
      text: `Runtime session ${status.runtimeSessionId} verified on ${fileContext.pageName}.`
    });

    currentStep = "card-visuals";
    const card = await call("figma_create_child", {
      parentId: showcaseRootId,
      nodeType: "FRAME",
      properties: {
        name: `${showcaseName} Card`,
        width: 420,
        height: 120
      }
    });
    await call("figma_set_fills", {
      nodeId: card.node.id,
      fills: [{ type: "SOLID", color: "#E53935" }]
    });
    await call("figma_set_strokes", {
      nodeId: card.node.id,
      strokes: [{ type: "SOLID", color: "#2D2B38" }],
      strokeWeight: 2
    });
    if (effectStyle) {
      await call("figma_apply_style", {
        nodeId: card.node.id,
        styleType: "effect",
        styleId: effectStyle.id
      });
    }
    const clonedCard = await call("figma_clone_node", {
      nodeId: card.node.id
    });
    await call("figma_move_node", {
      nodeId: clonedCard.node.id,
      x: SHOWCASE_X + 460,
      y: SHOWCASE_Y + 120
    });
    await call("figma_resize_node", {
      nodeId: clonedCard.node.id,
      width: 320,
      height: 96
    });
    await call("figma_rename_node", {
      nodeId: clonedCard.node.id,
      newName: `${showcaseName} Card Clone`
    });

    currentStep = "component-row";
    const componentsRow = await call("figma_create_child", {
      parentId: showcaseRootId,
      nodeType: "FRAME",
      properties: {
        name: `${showcaseName} Components`,
        width: 840,
        height: 180
      }
    });
    await call("figma_set_layout", {
      nodeId: componentsRow.node.id,
      layoutMode: "HORIZONTAL",
      primaryAxisSizingMode: "AUTO",
      counterAxisSizingMode: "AUTO",
      itemSpacing: 16,
      paddingLeft: 0,
      paddingRight: 0,
      paddingTop: 0,
      paddingBottom: 0,
      width: 840,
      height: 180
    });

    currentStep = "instantiate-existing-components";
    const instantiated = await call("figma_batch_instantiate_components", {
      instances: [
        {
          nodeId: checkbox.id,
          parentId: componentsRow.node.id,
          position: { x: 0, y: 0 }
        },
        {
          nodeId: checkbox.id,
          parentId: componentsRow.node.id,
          position: { x: 220, y: 0 }
        }
      ]
    });
    const instanceA = instantiated.results?.[0]?.instance?.id;
    const instanceB = instantiated.results?.[1]?.instance?.id;
    if (instanceA && instanceB) {
      await call("figma_batch_set_instance_properties", {
        updates: [
          {
            nodeId: instanceA,
            properties: { Label: "Relay A", State: "Error", Value: "Checked" }
          },
          {
            nodeId: instanceB,
            properties: { Label: "Relay B", State: "Warning", Value: "Indeterminate" }
          }
        ]
      });
    }

    currentStep = "custom-component-authoring";
    const componentSource = await call("figma_create_child", {
      parentId: showcaseRootId,
      nodeType: "FRAME",
      properties: {
        name: `${showcaseName} Source`,
        width: 160,
        height: 44
      }
    });
    await call("figma_set_fills", {
      nodeId: componentSource.node.id,
      fills: [{ type: "SOLID", color: "#111827" }]
    });
    const componentSourceLabel = await call("figma_create_child", {
      parentId: componentSource.node.id,
      nodeType: "TEXT",
      properties: {
        name: `${showcaseName} Source Label`,
        text: "Relay Chip",
        x: 16,
        y: 12,
        width: 120,
        height: 20
      }
    });
    await call("figma_set_fills", {
      nodeId: componentSourceLabel.node.id,
      fills: [{ type: "SOLID", color: "#FFFFFF" }]
    });
    const createdComponent = await call("figma_create_component", {
      nodeId: componentSource.node.id,
      name: `${tempPrefix} Component`
    });
    const addedProperty = await call("figma_add_component_property", {
      nodeId: createdComponent.component.id,
      propertyName: "Show Icon",
      type: "BOOLEAN",
      defaultValue: true
    });
    const editedProperty = await call("figma_edit_component_property", {
      nodeId: createdComponent.component.id,
      propertyName: addedProperty.propertyName,
      newName: "Has Icon",
      defaultValue: false
    });
    await call("figma_delete_component_property", {
      nodeId: createdComponent.component.id,
      propertyName: editedProperty.propertyName
    });
    const createdInstance = await call("figma_instantiate_component", {
      nodeId: createdComponent.component.id,
      parentId: showcaseRootId,
      position: { x: SHOWCASE_X + 24, y: SHOWCASE_Y + 420 }
    });
    if (createdInstance.instance?.id) {
      await call("figma_set_instance_properties", {
        nodeId: createdInstance.instance.id,
        properties: {}
      });
    }

    currentStep = "temp-variables";
    const collection = await call("figma_create_variable_collection", {
      name: tempCollectionName,
      initialModeName: "Base",
      additionalModes: ["Dark"]
    });
    tempCollectionId = collection.collection?.id || null;
    const collectionInventory = await call("figma_get_variables");
    const createdCollection = (collectionInventory.collections || []).find(
      (item) => item.id === tempCollectionId || item.name === tempCollectionName
    );
    if (!createdCollection) {
      throw new Error("SHOWCASE_TEMP_COLLECTION_NOT_FOUND");
    }
    const darkMode = (createdCollection.modes || []).find((item) => item.name === "Dark");
    if (darkMode) {
      await call("figma_rename_mode", {
        collectionId: createdCollection.id,
        modeId: darkMode.id,
        newName: "Night"
      });
    } else {
      await call("figma_add_mode", {
        collectionId: createdCollection.id,
        modeName: "Night"
      });
    }
    const variableA = await call("figma_create_variable", {
      collectionId: createdCollection.id,
      name: "spacing/card",
      resolvedType: "FLOAT"
    });
    const batchVariables = await call("figma_batch_create_variables", {
      collectionId: createdCollection.id,
      variables: [
        { name: "spacing/section", resolvedType: "FLOAT" },
        { name: "spacing/panel", resolvedType: "FLOAT" }
      ]
    });
    const baseMode = (createdCollection.modes || []).find((item) => item.name === "Base");
    const refreshedVariables = await call("figma_get_variables");
    const refreshedCollection = (refreshedVariables.collections || []).find(
      (item) => item.id === createdCollection.id
    );
    const tempVar = (refreshedCollection?.variables || []).find((item) => item.id === variableA.variable?.id);
    const batchVarA = (refreshedCollection?.variables || []).find((item) => item.name === "spacing/section");
    const batchVarB = (refreshedCollection?.variables || []).find((item) => item.name === "spacing/panel");
    if (tempVar && baseMode) {
      await call("figma_update_variable", {
        variableId: tempVar.id,
        modeId: baseMode.id,
        value: 24
      });
      await call("figma_rename_variable", {
        variableId: tempVar.id,
        newName: "spacing/card/primary"
      });
    }
    if (batchVarA && batchVarB && baseMode) {
      await call("figma_batch_update_variables", {
        updates: [
          { variableId: batchVarA.id, modeId: baseMode.id, value: 16 },
          { variableId: batchVarB.id, modeId: baseMode.id, value: 12 }
        ]
      });
      await call("figma_delete_variable", {
        variableId: batchVarB.id
      });
    }
    await call("figma_setup_design_tokens", {
      collectionName: setupCollectionName,
      modes: ["Light", "Dark"],
      tokens: [
        {
          name: "color/showcase/accent",
          resolvedType: "COLOR",
          values: { Light: "#FF5A5F", Dark: "#D90429" }
        },
        {
          name: "space/showcase/card",
          resolvedType: "FLOAT",
          values: { Light: 12, Dark: 14 }
        }
      ]
    });

    currentStep = "temp-styles";
    const createdPaintStyle = await call("figma_create_style", {
      styleType: "paint",
      name: `${tempPrefix} Accent`,
      color: "#FF5A5F",
      description: "temporary showcase accent"
    });
    tempPaintStyleId = createdPaintStyle.style?.id || null;
    const createdTextStyle = await call("figma_create_style", {
      styleType: "text",
      name: `${tempPrefix} Label`,
      fontFamily: "Inter",
      fontStyle: "Regular",
      fontSize: 14,
      description: "temporary showcase label"
    });
    tempTextStyleId = createdTextStyle.style?.id || null;
    if (tempTextStyleId) {
      await call("figma_apply_style", {
        nodeId: subtitleNode.node.id,
        styleType: "text",
        styleId: tempTextStyleId
      });
    }

    currentStep = "readback-and-reports";
    const selection = await call("figma_get_selection");
    const showcaseNode = await call("figma_get_node", { nodeId: showcaseRootId });
    const showcaseChildren = await call("figma_get_children", { nodeId: showcaseRootId });
    const boundVariables = await call("figma_get_bound_variables", { nodeId: showcaseRootId });
    const screenshot = await call("figma_get_screenshot", { nodeId: showcaseRootId });
    const screenshot2 = await call("figma_take_screenshot", { nodeId: showcaseRootId });
    const componentDoc = await call("figma_generate_component_doc", {
      componentName: checkbox.name
    });
    const docDrift = await call("figma_detect_doc_drift", {
      componentName: checkbox.name,
      depth: 2
    });
    const verification = await call("figma_generate_verification_report", {
      nodeId: showcaseRootId,
      includeChildren: true,
      includeScreenshot: true
    });
    const sectionReport = await call("figma_generate_section_report", {
      nodeId: showcaseRootId,
      depth: 2
    });
    const parity = await call("figma_check_design_parity", {
      expectedComponents: [checkbox.name],
      expectedVariables: [paddingCandidate?.variable?.name || "viewport/width"],
      expectedStyles: [textStyle.name]
    });

    currentStep = "comments";
    const comment = await call("figma_post_comment", {
      message: `${tempPrefix} comment`,
      nodeId: showcaseRootId
    });
    tempCommentId = comment.comment?.id || comment.id || null;
    const inlineComment = await call("figma_post_inline_comment", {
      message: `${tempPrefix} inline`,
      nodeId: showcaseRootId,
      x: SHOWCASE_X + 20,
      y: SHOWCASE_Y + 20,
      regionWidth: 140,
      regionHeight: 48,
      commentPinCorner: "top-right"
    });
    tempInlineCommentId = inlineComment.comment?.id || inlineComment.id || null;
    if (tempCommentId) {
      await call("figma_reply_to_comment", {
        commentId: tempCommentId,
        message: `${tempPrefix} reply`
      });
    }
    const comments = await call("figma_get_comments", { limit: 10 });
    const inlineComments = await call("figma_get_inline_comments", {
      nodeId: showcaseRootId,
      includeReplies: true,
      limit: 10
    });
    const nodeComments = await call("figma_get_node_comments", {
      nodeId: showcaseRootId,
      includeReplies: true,
      limit: 10
    });
    const commentReplies = tempCommentId
      ? await call("figma_get_comment_replies", { commentId: tempCommentId, limit: 10 })
      : { replies: [] };
    const commentThread = tempCommentId
      ? await call("figma_get_comment_thread", { commentId: tempCommentId, limit: 10 })
      : { replies: [] };

    currentStep = "waivers-and-debug";
    const waiversBefore = await call("figma_get_audit_waivers");
    const waiver = await call("figma_upsert_audit_waiver", {
      category: "components",
      messagePattern: `${tempPrefix} waiver`,
      note: "temporary full showcase waiver"
    });
    tempWaiverId = waiver.waiver?.id || waiver.id || null;
    const waiversAfter = await call("figma_get_audit_waivers");
    if (tempWaiverId) {
      await call("figma_delete_audit_waiver", { id: tempWaiverId });
      tempWaiverId = null;
    }

    const operationTrace = await call("figma_get_operation_trace", { limit: 10 });
    const designChanges = await call("figma_get_design_changes", { limit: 10, clear: false });
    const consoleLogs = await call("figma_get_console_logs", { limit: 10 });

    currentStep = "cleanup-temp-assets";
    if (tempCommentId) {
      await call("figma_delete_comment", { commentId: tempCommentId });
      tempCommentId = null;
    }
    if (tempInlineCommentId) {
      await call("figma_delete_comment", { commentId: tempInlineCommentId });
      tempInlineCommentId = null;
    }

    if (tempPaintStyleId) {
      await call("figma_delete_style", { styleType: "paint", styleId: tempPaintStyleId });
      tempPaintStyleId = null;
    }
    if (tempTextStyleId) {
      await call("figma_delete_style", { styleType: "text", styleId: tempTextStyleId });
      tempTextStyleId = null;
    }
    if (tempCollectionId) {
      await call("figma_delete_variable_collection", { collectionId: tempCollectionId });
      tempCollectionId = null;
    }
    const allVariablesPostDelete = await call("figma_get_variables");
    const setupCollection = (allVariablesPostDelete.collections || []).find(
      (item) => item.name === setupCollectionName
    );
    if (setupCollection?.id) {
      setupCollectionId = setupCollection.id;
      await call("figma_delete_variable_collection", { collectionId: setupCollectionId });
      setupCollectionId = null;
    }

    const afterCleanupAudit = await call("figma_audit_design_system", {
      profile: "release"
    });

    checks.write = {
      showcaseRootId,
      children: Array.isArray(showcaseChildren.nodes) ? showcaseChildren.nodes.length : 0,
      boundVariables:
        boundVariables.boundVariables && typeof boundVariables.boundVariables === "object"
          ? Object.keys(boundVariables.boundVariables).length
          : 0,
      selectionCount: Array.isArray(selection.nodes) ? selection.nodes.length : 0
    };
    checks.components = {
      searched: checkbox.name,
      instantiated: Array.isArray(instantiated.results) ? instantiated.results.length : 0,
      componentProperties: null,
      familyStatus: null,
      imageBytes: 0
    };
    checks.comments = {
      listed: Array.isArray(comments.comments) ? comments.comments.length : 0,
      nodeComments: Array.isArray(nodeComments.comments) ? nodeComments.comments.length : 0,
      inlineComments: Array.isArray(inlineComments.comments) ? inlineComments.comments.length : 0,
      replies: Array.isArray(commentReplies.replies) ? commentReplies.replies.length : 0,
      threadReplies: Array.isArray(commentThread.replies) ? commentThread.replies.length : 0
    };
    checks.audit = {
      waiversBefore: Array.isArray(waiversBefore.waivers) ? waiversBefore.waivers.length : 0,
      waiversAfter: Array.isArray(waiversAfter.waivers) ? waiversAfter.waivers.length : 0,
      auditScore: afterCleanupAudit.score ?? null,
      parityScore: parity.score ?? null
    };
    checks.debug = {
      screenshot: Boolean(screenshot.image || screenshot.dataUrl),
      takeScreenshot: Boolean(screenshot2.image || screenshot2.dataUrl),
      traceEntries: Array.isArray(operationTrace.entries) ? operationTrace.entries.length : 0,
      designChanges: Array.isArray(designChanges.entries) ? designChanges.entries.length : 0,
      consoleLogs: Array.isArray(consoleLogs.entries) ? consoleLogs.entries.length : 0
    };
    checks.docs = {
      componentDoc: Boolean(componentDoc.markdown),
      docDriftStatus: docDrift.status || null,
      verificationScore: verification.summary?.score ?? null,
      sectionScore: sectionReport.verification?.score ?? null,
      componentNodeType: null,
      devHasScreenshot: null
    };
    checks.cleanup = {
      tempCollectionsRemoved: true,
      tempStylesRemoved: true,
      tempCommentsRemoved: true
    };

    currentStep = "final-reconnect";
    await call("figma_reconnect");

    console.log(
      JSON.stringify(
        {
          ok: true,
          bridgeUrl,
          showcase: {
            nodeId: showcaseRootId,
            name: showcaseName,
            x: SHOWCASE_X,
            y: SHOWCASE_Y
          },
          checks
        },
        null,
        2
      )
    );
  } finally {
    if (tempWaiverId) {
      await call("figma_delete_audit_waiver", { id: tempWaiverId }).catch(() => {});
    }
    if (tempCommentId) {
      await call("figma_delete_comment", { commentId: tempCommentId }).catch(() => {});
    }
    if (tempInlineCommentId) {
      await call("figma_delete_comment", { commentId: tempInlineCommentId }).catch(() => {});
    }
    if (tempPaintStyleId) {
      await call("figma_delete_style", { styleType: "paint", styleId: tempPaintStyleId }).catch(() => {});
    }
    if (tempTextStyleId) {
      await call("figma_delete_style", { styleType: "text", styleId: tempTextStyleId }).catch(() => {});
    }
    if (tempCollectionId) {
      await call("figma_delete_variable_collection", { collectionId: tempCollectionId }).catch(() => {});
    }
    if (setupCollectionId) {
      await call("figma_delete_variable_collection", { collectionId: setupCollectionId }).catch(() => {});
    }
    await call("figma_cleanup_artifacts", {
      namePrefix: tempPrefix,
      includeNodes: true,
      includeStyles: false,
      includeVariables: false
    }).catch(() => {});

    await client.close().catch(() => {});
    await transport.close().catch(() => {});
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error && error.stack ? `\n${error.stack}` : "";
  console.error(`full-showcase.failed step=${currentStep} ${message}${stack}`);
  process.exit(1);
});
