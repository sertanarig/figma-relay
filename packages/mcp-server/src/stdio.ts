import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { toolRegistry } from "@codex-figma/tool-definitions";
import { createRuntimeBridgeClient } from "./bridge/runtime-bridge-client.js";
import { resolveBridgeUrl } from "./bridge/resolve-bridge-url.js";
import { createToolExecutor } from "./tool-executor.js";
import { getToolInputSchema } from "./tool-schemas.js";
import { createFigmaCommentsClient } from "./figma-comments-client.js";
import { createFigmaAuditClient } from "./figma-audit-client.js";
import { createFigmaAuditWaiverStore } from "./figma-audit-waiver-store.js";
import { createFigmaParityClient } from "./figma-parity-client.js";
import { createFigmaComponentDocClient } from "./figma-component-doc-client.js";
import { createFigmaDocDriftClient } from "./figma-doc-drift-client.js";
import { createFigmaDesignSystemClient } from "./figma-design-system-client.js";
import { createFigmaDesignSystemReportClient } from "./figma-design-system-report-client.js";
import { createFigmaReleaseReadinessClient } from "./figma-release-readiness-client.js";
import { createFigmaReleaseReadinessTrendClient } from "./figma-release-readiness-trend-client.js";
import { createFigmaDashboardClient } from "./figma-dashboard-client.js";
import { createFigmaChangeImpactClient } from "./figma-change-impact-client.js";
import { createFigmaTroubleshootingClient } from "./figma-troubleshooting-client.js";
import { createFigmaComponentClient } from "./figma-component-client.js";
import { createFigmaComponentDetailsClient } from "./figma-component-details-client.js";
import { createFigmaComponentImageClient } from "./figma-component-image-client.js";
import { createFigmaComponentDevelopmentClient } from "./figma-component-development-client.js";
import { createFigmaComponentPropertyCatalogClient } from "./figma-component-property-catalog-client.js";
import { createFigmaComponentFamilyHealthClient } from "./figma-component-family-health-client.js";
import { createFigmaBatchVariablesClient } from "./figma-batch-variables-client.js";
import { createFigmaBatchStyleClient } from "./figma-batch-style-client.js";
import { createFigmaBatchComponentsClient } from "./figma-batch-components-client.js";
import { createFigmaBatchBindingsClient } from "./figma-batch-bindings-client.js";
import { createFigmaBatchInstancePropertiesClient } from "./figma-batch-instance-properties-client.js";
import { createFigmaVerificationReportClient } from "./figma-verification-report-client.js";
import { createFigmaSectionReportClient } from "./figma-section-report-client.js";
import { createFigmaWatchConsoleClient } from "./figma-watch-console-client.js";
import { createFigmaFigJamClient } from "./figma-figjam-client.js";
import { createFigmaFigJamReportClient } from "./figma-figjam-report-client.js";
import { loadLocalEnv } from "./local-env.js";

export async function startStdioServer() {
  loadLocalEnv();

  const bridgeUrl = await resolveBridgeUrl({
    explicitBridgeUrl: process.env.CODEX_FIGMA_BRIDGE_URL
  });
  const server = new McpServer({
    name: "figma-runtime-mcp",
    version: "0.2.0"
  });

  const bridgeClient = createRuntimeBridgeClient({ bridgeUrl });
  const executor = createToolExecutor({
    bridgeClient,
    sessionId: process.env.CODEX_FIGMA_RUNTIME_SESSION_ID
  });
  const auditWaiverStore = createFigmaAuditWaiverStore();
  const commentsClient = createFigmaCommentsClient({});
  const auditClient = createFigmaAuditClient({
    executeTool: (toolName, args) => executor.execute(toolName, args),
    listWaivers: () => auditWaiverStore.list()
  });
  const parityClient = createFigmaParityClient({
    executeTool: (toolName, args) => executor.execute(toolName, args)
  });
  const componentDocClient = createFigmaComponentDocClient({
    executeTool: (toolName, args) => executor.execute(toolName, args)
  });
  const docDriftClient = createFigmaDocDriftClient({
    executeTool: (toolName, args) => executor.execute(toolName, args),
    generateComponentDoc: (input) => componentDocClient.generate(input)
  });
  const designSystemClient = createFigmaDesignSystemClient({
    executeTool: (toolName, args) => executor.execute(toolName, args),
    getComponentDetails: (input) => componentDetailsClient.getDetails(input),
    getComponentImage: (input) => componentImageClient.getImage(input)
  });
  const dashboardClient = createFigmaDashboardClient({
    executeTool: (toolName, args) => executor.execute(toolName, args),
    getActiveRuntime: () => bridgeClient.getActiveRuntime(),
    getSummary: () => designSystemClient.getSummary(),
    getAudit: (options) => auditClient.audit(options),
    getFigJam: () => figJamClient.getBoard({})
  });
  const designSystemReportClient = createFigmaDesignSystemReportClient({
    getSummary: () => designSystemClient.getSummary(),
    getDashboard: () => dashboardClient.getDashboard(),
    getAudit: (options) => auditClient.audit(options),
    browseTokens: (input) => designSystemClient.browseTokens(input),
    browseDesignSystem: (input) => designSystemClient.browseDesignSystem(input)
  });
  const releaseReadinessClient = createFigmaReleaseReadinessClient({
    getDashboard: () => dashboardClient.getDashboard(),
    getDesignSystemReport: () => designSystemReportClient.generate()
  });
  const releaseReadinessTrendClient = createFigmaReleaseReadinessTrendClient({
    getReadiness: () => releaseReadinessClient.getReadiness()
  });
  const troubleshootingClient = createFigmaTroubleshootingClient({
    getActiveRuntime: () => bridgeClient.getActiveRuntime(),
    getDashboard: () => dashboardClient.getDashboard(),
    getReadiness: () => releaseReadinessClient.getReadiness()
  });
  const changeImpactClient = createFigmaChangeImpactClient({
    executeTool: (toolName, args) => executor.execute(toolName, args)
  });
  const componentDetailsClient = createFigmaComponentDetailsClient({
    executeTool: (toolName, args) => executor.execute(toolName, args)
  });
  const componentClient = createFigmaComponentClient({
    executeTool: (toolName, args) => executor.execute(toolName, args),
    getComponentDetails: (input) => componentDetailsClient.getDetails(input)
  });
  const componentImageClient = createFigmaComponentImageClient({
    executeTool: (toolName, args) => executor.execute(toolName, args),
    getComponentDetails: (input) => componentDetailsClient.getDetails(input)
  });
  const componentDevelopmentClient = createFigmaComponentDevelopmentClient({
    executeTool: (toolName, args) => executor.execute(toolName, args),
    getComponentDetails: (input) => componentDetailsClient.getDetails(input)
  });
  const componentPropertyCatalogClient = createFigmaComponentPropertyCatalogClient({
    getComponentDetails: (input) => componentDetailsClient.getDetails(input)
  });
  const componentFamilyHealthClient = createFigmaComponentFamilyHealthClient({
    executeTool: (toolName, args) => executor.execute(toolName, args),
    getComponentPropertyCatalog: (input) => componentPropertyCatalogClient.getCatalog(input)
  });
  const batchVariablesClient = createFigmaBatchVariablesClient({
    executeTool: (toolName, args) => executor.execute(toolName, args)
  });
  const batchStyleClient = createFigmaBatchStyleClient({
    executeTool: (toolName, args) => executor.execute(toolName, args)
  });
  const batchComponentsClient = createFigmaBatchComponentsClient({
    executeTool: (toolName, args) => executor.execute(toolName, args)
  });
  const batchBindingsClient = createFigmaBatchBindingsClient({
    executeTool: (toolName, args) => executor.execute(toolName, args)
  });
  const batchInstancePropertiesClient = createFigmaBatchInstancePropertiesClient({
    executeTool: (toolName, args) => executor.execute(toolName, args)
  });
  const verificationReportClient = createFigmaVerificationReportClient({
    executeTool: (toolName, args) => executor.execute(toolName, args)
  });
  const sectionReportClient = createFigmaSectionReportClient({
    executeTool: (toolName, args) => executor.execute(toolName, args),
    generateVerification: (input) => verificationReportClient.generate(input)
  });
  const watchConsoleClient = createFigmaWatchConsoleClient({
    executeTool: async (toolName, args) => {
      const response = await executor.execute(toolName, args);
      return typeof response === "object" && response ? response as {
        runtimeSessionId?: string;
        logs?: Array<{
          id?: string;
          level?: string;
          message?: string;
          timestamp?: number;
        }>;
      } : {};
    }
  });
  const figJamClient = createFigmaFigJamClient({
    executeTool: (toolName, args) => executor.execute(toolName, args)
  });
  const figJamReportClient = createFigmaFigJamReportClient({
    getBoard: (input) => figJamClient.getBoard(input),
    getDashboard: () => dashboardClient.getDashboard()
  });

  for (const tool of toolRegistry) {
    server.registerTool(
      tool.name,
      {
        description: tool.description,
        inputSchema: getToolInputSchema(tool.name)
      },
      async (args: Record<string, unknown>) => {
        let data;

        if (tool.name === "figma_get_comments") {
          data = await commentsClient.getComments(
            await bridgeClient.getActiveRuntime?.() || null,
            typeof args.limit === "number" ? args.limit : 20
          );
        } else if (tool.name === "figma_get_inline_comments") {
          data = await commentsClient.getInlineComments(
            await bridgeClient.getActiveRuntime?.() || null,
            String(args.nodeId || ""),
            {
              includeReplies: args.includeReplies === true,
              limit: typeof args.limit === "number" ? args.limit : 20
            }
          );
        } else if (tool.name === "figma_get_comment_replies") {
          data = await commentsClient.getReplies(
            await bridgeClient.getActiveRuntime?.() || null,
            String(args.commentId || ""),
            typeof args.limit === "number" ? args.limit : 20
          );
        } else if (tool.name === "figma_get_comment_thread") {
          data = await commentsClient.getThread(
            await bridgeClient.getActiveRuntime?.() || null,
            String(args.commentId || ""),
            typeof args.limit === "number" ? args.limit : 20
          );
        } else if (tool.name === "figma_get_node_comments") {
          data = await commentsClient.getNodeComments(
            await bridgeClient.getActiveRuntime?.() || null,
            String(args.nodeId || ""),
            {
              includeReplies: args.includeReplies === true,
              limit: typeof args.limit === "number" ? args.limit : 20
            }
          );
        } else if (tool.name === "figma_batch_create_variables") {
          data = await batchVariablesClient.createVariables({
            collectionId: String(args.collectionId || ""),
            variables: Array.isArray(args.variables)
              ? args.variables.map((item) => ({
                  name:
                    item && typeof item === "object" ? String(item.name || "") : "",
                  resolvedType:
                    item && typeof item === "object" ? String(item.resolvedType || "") : "",
                  description:
                    item && typeof item === "object" && typeof item.description === "string"
                      ? item.description
                      : undefined,
                  valuesByMode:
                    item && typeof item === "object" && item.valuesByMode && typeof item.valuesByMode === "object"
                      ? item.valuesByMode
                      : undefined
                }))
              : []
          });
        } else if (tool.name === "figma_batch_apply_styles") {
          data = await batchStyleClient.applyStyles({
            applications: Array.isArray(args.applications)
              ? args.applications.map((item) => ({
                  nodeId: item && typeof item === "object" ? String(item.nodeId || "") : "",
                  styleType: item && typeof item === "object" ? item.styleType : "text",
                  styleId: item && typeof item === "object" ? String(item.styleId || "") : ""
                }))
              : []
          });
        } else if (tool.name === "figma_batch_bind_variables") {
          data = await batchBindingsClient.bindVariables({
            bindings: Array.isArray(args.bindings)
              ? args.bindings.map((item) => ({
                  nodeId: item && typeof item === "object" ? String(item.nodeId || "") : "",
                  field: item && typeof item === "object" ? String(item.field || "") : "",
                  variableId:
                    item && typeof item === "object" && typeof item.variableId === "string"
                      ? item.variableId
                      : undefined,
                  variableName:
                    item && typeof item === "object" && typeof item.variableName === "string"
                      ? item.variableName
                      : undefined,
                  collectionId:
                    item && typeof item === "object" && typeof item.collectionId === "string"
                      ? item.collectionId
                      : undefined,
                  collectionName:
                    item && typeof item === "object" && typeof item.collectionName === "string"
                      ? item.collectionName
                      : undefined,
                  modeId:
                    item && typeof item === "object" && typeof item.modeId === "string"
                      ? item.modeId
                      : undefined,
                  modeName:
                    item && typeof item === "object" && typeof item.modeName === "string"
                      ? item.modeName
                      : undefined,
                  unbind:
                    item && typeof item === "object" && typeof item.unbind === "boolean"
                      ? item.unbind
                      : undefined
                }))
              : []
          });
        } else if (tool.name === "figma_get_design_system_summary") {
          data = await designSystemClient.getSummary();
        } else if (tool.name === "figma_get_figjam") {
          data = await figJamClient.getBoard({
            nodeId: typeof args.nodeId === "string" ? args.nodeId : undefined,
            depth: typeof args.depth === "number" ? args.depth : undefined
          });
        } else if (tool.name === "figma_generate_figjam_report") {
          data = await figJamReportClient.generate({
            nodeId: typeof args.nodeId === "string" ? args.nodeId : undefined,
            depth: typeof args.depth === "number" ? args.depth : undefined
          });
        } else if (tool.name === "ds_dashboard_refresh") {
          data = await dashboardClient.getDashboard({ refresh: true });
        } else if (tool.name === "token_browser_refresh") {
          data = await designSystemClient.browseTokens({
            filter: typeof args.filter === "string" ? args.filter : undefined,
            type: typeof args.type === "string" ? args.type : undefined,
            collection: typeof args.collection === "string" ? args.collection : undefined,
            limitPerCollection:
              typeof args.limitPerCollection === "number" ? args.limitPerCollection : undefined,
            refresh: true
          });
        } else if (tool.name === "figma_get_dashboard") {
          data = await dashboardClient.getDashboard();
        } else if (tool.name === "figma_generate_change_impact_summary") {
          data = await changeImpactClient.generate({
            limit: typeof args.limit === "number" ? args.limit : undefined
          });
        } else if (tool.name === "figma_get_release_readiness") {
          data = await releaseReadinessClient.getReadiness();
        } else if (tool.name === "figma_get_release_readiness_trend") {
          data = await releaseReadinessTrendClient.getTrend({
            limit: typeof args.limit === "number" ? args.limit : undefined,
            record: typeof args.record === "boolean" ? args.record : undefined
          });
        } else if (tool.name === "figma_get_troubleshooting_summary") {
          data = await troubleshootingClient.getSummary();
        } else if (tool.name === "figma_get_design_system_kit") {
          data = await designSystemClient.getKit({
            includeImage: typeof args.includeImage === "boolean" ? args.includeImage : undefined,
            componentNames: Array.isArray(args.componentNames)
              ? args.componentNames.map((item) => String(item))
              : undefined,
            componentLimit: typeof args.componentLimit === "number" ? args.componentLimit : undefined
          });
        } else if (tool.name === "figma_browse_tokens") {
          data = await designSystemClient.browseTokens({
            filter: typeof args.filter === "string" ? args.filter : undefined,
            type: typeof args.type === "string" ? args.type : undefined,
            collection: typeof args.collection === "string" ? args.collection : undefined,
            limitPerCollection:
              typeof args.limitPerCollection === "number" ? args.limitPerCollection : undefined,
            preset:
              args.preset === "largest-groups" || args.preset === "alphabetical" || args.preset === "smallest-groups"
                ? args.preset
                : undefined,
            sortBy: args.sortBy === "count" ? "count" : args.sortBy === "name" ? "name" : undefined,
            order: args.order === "desc" ? "desc" : args.order === "asc" ? "asc" : undefined
          });
        } else if (tool.name === "figma_browse_design_system") {
          data = await designSystemClient.browseDesignSystem({
            filter: typeof args.filter === "string" ? args.filter : undefined,
            componentLimit: typeof args.componentLimit === "number" ? args.componentLimit : undefined,
            styleLimit: typeof args.styleLimit === "number" ? args.styleLimit : undefined,
            preset:
              args.preset === "largest-groups" || args.preset === "alphabetical" || args.preset === "smallest-groups"
                ? args.preset
                : undefined,
            sortBy: args.sortBy === "count" ? "count" : args.sortBy === "name" ? "name" : undefined,
            order: args.order === "desc" ? "desc" : args.order === "asc" ? "asc" : undefined
          });
        } else if (tool.name === "figma_get_token_values") {
          data = await designSystemClient.getTokenValues({
            filter: typeof args.filter === "string" ? args.filter : undefined,
            type: typeof args.type === "string" ? args.type : undefined,
            limit: typeof args.limit === "number" ? args.limit : undefined
          });
        } else if (tool.name === "figma_generate_design_system_report") {
          data = await designSystemReportClient.generate({
            auditProfile: args.auditProfile === "default" ? "default" : args.auditProfile === "release" ? "release" : undefined
          });
        } else if (tool.name === "figma_lint_design") {
          data = await auditClient.audit({
            profile: args.profile === "default" ? "default" : args.profile === "release" ? "release" : "release",
            ignorePrefixes: Array.isArray(args.ignorePrefixes) ? args.ignorePrefixes.map((item) => String(item)) : undefined,
            ignoreNamePatterns: Array.isArray(args.ignoreNamePatterns) ? args.ignoreNamePatterns.map((item) => String(item)) : undefined,
            relaxedComponentNaming: typeof args.relaxedComponentNaming === "boolean" ? args.relaxedComponentNaming : undefined
          });
        } else if (tool.name === "figma_get_component_details") {
          data = await componentDetailsClient.getDetails({
            componentKey: typeof args.componentKey === "string" ? args.componentKey : undefined,
            nodeId: typeof args.nodeId === "string" ? args.nodeId : undefined,
            componentName: typeof args.componentName === "string" ? args.componentName : undefined
          });
        } else if (tool.name === "figma_get_component") {
          data = await componentClient.getComponent({
            componentKey: typeof args.componentKey === "string" ? args.componentKey : undefined,
            nodeId: typeof args.nodeId === "string" ? args.nodeId : undefined,
            componentName: typeof args.componentName === "string" ? args.componentName : undefined
          });
        } else if (tool.name === "figma_get_component_property_catalog") {
          data = await componentPropertyCatalogClient.getCatalog({
            componentKey: typeof args.componentKey === "string" ? args.componentKey : undefined,
            nodeId: typeof args.nodeId === "string" ? args.nodeId : undefined,
            componentName: typeof args.componentName === "string" ? args.componentName : undefined
          });
        } else if (tool.name === "figma_get_component_family_health") {
          data = await componentFamilyHealthClient.getHealth({
            componentKey: typeof args.componentKey === "string" ? args.componentKey : undefined,
            nodeId: typeof args.nodeId === "string" ? args.nodeId : undefined,
            componentName: typeof args.componentName === "string" ? args.componentName : undefined,
            familyName: typeof args.familyName === "string" ? args.familyName : undefined
          });
        } else if (tool.name === "figma_get_component_image") {
          data = await componentImageClient.getImage({
            componentKey: typeof args.componentKey === "string" ? args.componentKey : undefined,
            nodeId: typeof args.nodeId === "string" ? args.nodeId : undefined,
            componentName: typeof args.componentName === "string" ? args.componentName : undefined
          });
        } else if (tool.name === "figma_batch_instantiate_components") {
          data = await batchComponentsClient.instantiate({
            instances: Array.isArray(args.instances)
              ? args.instances.map((item) => ({
                  nodeId:
                    item && typeof item === "object" && typeof item.nodeId === "string"
                      ? item.nodeId
                      : undefined,
                  componentKey:
                    item && typeof item === "object" && typeof item.componentKey === "string"
                      ? item.componentKey
                      : undefined,
                  parentId:
                    item && typeof item === "object" && typeof item.parentId === "string"
                      ? item.parentId
                      : undefined,
                  position:
                    item && typeof item === "object" && item.position && typeof item.position === "object"
                      ? item.position
                      : undefined,
                  variant:
                    item && typeof item === "object" && item.variant && typeof item.variant === "object"
                      ? item.variant
                      : undefined,
                  overrides:
                    item && typeof item === "object" && item.overrides && typeof item.overrides === "object"
                      ? item.overrides
                      : undefined
                }))
              : []
          });
        } else if (tool.name === "figma_batch_set_instance_properties") {
          data = await batchInstancePropertiesClient.setProperties({
            updates: Array.isArray(args.updates)
              ? args.updates.map((item) => ({
                  nodeId:
                    item && typeof item === "object" && typeof item.nodeId === "string"
                      ? item.nodeId
                      : "",
                  properties:
                    item && typeof item === "object" && item.properties && typeof item.properties === "object"
                      ? item.properties as Record<string, unknown>
                      : {}
                }))
              : []
          });
        } else if (tool.name === "figma_get_component_for_development") {
          data = await componentDevelopmentClient.getComponentForDevelopment({
            componentKey: typeof args.componentKey === "string" ? args.componentKey : undefined,
            nodeId: typeof args.nodeId === "string" ? args.nodeId : undefined,
            componentName: typeof args.componentName === "string" ? args.componentName : undefined,
            includeScreenshot: typeof args.includeScreenshot === "boolean" ? args.includeScreenshot : undefined
          });
        } else if (tool.name === "figma_audit_design_system") {
          data = await auditClient.audit({
            profile: args.profile === "release" ? "release" : args.profile === "default" ? "default" : undefined,
            ignorePrefixes: Array.isArray(args.ignorePrefixes) ? args.ignorePrefixes.map((item) => String(item)) : undefined,
            ignoreNamePatterns: Array.isArray(args.ignoreNamePatterns) ? args.ignoreNamePatterns.map((item) => String(item)) : undefined,
            relaxedComponentNaming: typeof args.relaxedComponentNaming === "boolean" ? args.relaxedComponentNaming : undefined
          });
        } else if (tool.name === "figma_get_audit_waivers") {
          data = {
            waivers: await auditWaiverStore.list()
          };
        } else if (tool.name === "figma_upsert_audit_waiver") {
          data = await auditWaiverStore.upsert({
            id: typeof args.id === "string" ? args.id : undefined,
            fileKey: typeof args.fileKey === "string" ? args.fileKey : undefined,
            profile:
              args.profile === "default" || args.profile === "release" || args.profile === "all"
                ? args.profile
                : undefined,
            category: String(args.category || ""),
            messagePattern: String(args.messagePattern || ""),
            note: typeof args.note === "string" ? args.note : undefined
          });
        } else if (tool.name === "figma_delete_audit_waiver") {
          data = await auditWaiverStore.remove(String(args.id || ""));
        } else if (tool.name === "figma_check_design_parity") {
          data = await parityClient.check({
            expectedComponents: Array.isArray(args.expectedComponents)
              ? args.expectedComponents.map((item) => String(item))
              : undefined,
            expectedVariables: Array.isArray(args.expectedVariables)
              ? args.expectedVariables.map((item) => String(item))
              : undefined,
            expectedStyles: Array.isArray(args.expectedStyles)
              ? args.expectedStyles.map((item) => String(item))
              : undefined
          });
        } else if (tool.name === "figma_generate_component_doc") {
          data = await componentDocClient.generate({
            componentName: String(args.componentName || "")
          });
        } else if (tool.name === "figma_detect_doc_drift") {
          data = await docDriftClient.detect({
            componentName: String(args.componentName || ""),
            depth: typeof args.depth === "number" ? args.depth : undefined
          });
        } else if (tool.name === "figma_post_comment") {
          data = await commentsClient.postComment(
            await bridgeClient.getActiveRuntime?.() || null,
            {
              message: String(args.message || ""),
              nodeId: typeof args.nodeId === "string" ? args.nodeId : undefined,
              x: typeof args.x === "number" ? args.x : undefined,
              y: typeof args.y === "number" ? args.y : undefined
            }
          );
        } else if (tool.name === "figma_post_inline_comment") {
          data = await commentsClient.postInlineComment(
            await bridgeClient.getActiveRuntime?.() || null,
            {
              message: String(args.message || ""),
              nodeId: String(args.nodeId || ""),
              x: typeof args.x === "number" ? args.x : undefined,
              y: typeof args.y === "number" ? args.y : undefined,
              regionWidth: typeof args.regionWidth === "number" ? args.regionWidth : undefined,
              regionHeight: typeof args.regionHeight === "number" ? args.regionHeight : undefined,
              commentPinCorner:
                typeof args.commentPinCorner === "string"
                  ? args.commentPinCorner as "bottom-left" | "bottom-right" | "top-left" | "top-right"
                  : undefined
            }
          );
        } else if (tool.name === "figma_reply_to_comment") {
          data = await commentsClient.replyToComment(
            await bridgeClient.getActiveRuntime?.() || null,
            {
              commentId: String(args.commentId || ""),
              message: String(args.message || "")
            }
          );
        } else if (tool.name === "figma_delete_comment") {
          data = await commentsClient.deleteComment(
            await bridgeClient.getActiveRuntime?.() || null,
            String(args.commentId || "")
          );
        } else if (tool.name === "figma_generate_verification_report") {
          data = await verificationReportClient.generate({
            nodeId: typeof args.nodeId === "string" ? args.nodeId : undefined,
            includeChildren: typeof args.includeChildren === "boolean" ? args.includeChildren : undefined,
            includeScreenshot: typeof args.includeScreenshot === "boolean" ? args.includeScreenshot : undefined
          });
        } else if (tool.name === "figma_generate_section_report") {
          data = await sectionReportClient.generate({
            nodeId: String(args.nodeId || ""),
            depth: typeof args.depth === "number" ? args.depth : undefined
          });
        } else if (tool.name === "figma_watch_console") {
          data = await watchConsoleClient.watch({
            durationMs: typeof args.durationMs === "number" ? args.durationMs : undefined,
            pollIntervalMs: typeof args.pollIntervalMs === "number" ? args.pollIntervalMs : undefined,
            level: typeof args.level === "string" ? args.level : undefined,
            limit: typeof args.limit === "number" ? args.limit : undefined
          });
        } else {
          data = await executor.execute(tool.name, args as Record<string, unknown>);
        }

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(data)
            }
          ]
        };
      }
    );
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

if (
  process.argv[1] &&
  (process.argv[1].endsWith("/stdio.js") || process.argv[1].endsWith("/stdio.ts"))
) {
  startStdioServer().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
