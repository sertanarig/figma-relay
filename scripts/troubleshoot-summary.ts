import { resolveBridgeUrl } from "../packages/mcp-server/src/bridge/resolve-bridge-url.js";
import { createRuntimeBridgeClient } from "../packages/mcp-server/src/bridge/runtime-bridge-client.js";
import { createToolExecutor } from "../packages/mcp-server/src/tool-executor.js";
import { createFigmaDesignSystemClient } from "../packages/mcp-server/src/figma-design-system-client.js";
import { createFigmaAuditClient } from "../packages/mcp-server/src/figma-audit-client.js";
import { createFigmaDashboardClient } from "../packages/mcp-server/src/figma-dashboard-client.js";
import { createFigmaDesignSystemReportClient } from "../packages/mcp-server/src/figma-design-system-report-client.js";
import { createFigmaReleaseReadinessClient } from "../packages/mcp-server/src/figma-release-readiness-client.js";
import { createFigmaTroubleshootingClient } from "../packages/mcp-server/src/figma-troubleshooting-client.js";

function printSection(title: string) {
  console.log(`\n${title}`);
}

async function main() {
  const bridgeUrl = await resolveBridgeUrl({
    explicitBridgeUrl: process.env.CODEX_FIGMA_BRIDGE_URL
  });

  const bridgeClient = createRuntimeBridgeClient({ bridgeUrl });
  const executor = createToolExecutor({
    bridgeClient,
    sessionId: process.env.CODEX_FIGMA_RUNTIME_SESSION_ID
  });

  const designSystemClient = createFigmaDesignSystemClient({
    executeTool: (toolName, args) => executor.execute(toolName, args)
  });
  const auditClient = createFigmaAuditClient({
    executeTool: (toolName, args) => executor.execute(toolName, args)
  });
  const dashboardClient = createFigmaDashboardClient({
    executeTool: (toolName, args) => executor.execute(toolName, args),
    getActiveRuntime: () => bridgeClient.getActiveRuntime(),
    getSummary: () => designSystemClient.getSummary(),
    getAudit: (options) => auditClient.audit(options)
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
  const troubleshootingClient = createFigmaTroubleshootingClient({
    getActiveRuntime: () => bridgeClient.getActiveRuntime(),
    getDashboard: () => dashboardClient.getDashboard(),
    getReadiness: () => releaseReadinessClient.getReadiness()
  });

  const summary = await troubleshootingClient.getSummary();

  console.log("Figma Runtime MCP Troubleshooting Summary");
  console.log(`bridge=${bridgeUrl}`);

  printSection("Runtime");
  if (summary.runtime) {
    console.log(`session=${summary.runtime.runtimeSessionId}`);
    console.log(`file=${summary.runtime.fileName || "Unknown"}`);
    console.log(`page=${summary.runtime.pageName || "Unknown"}`);
    console.log(`capabilities=${summary.runtime.capabilityCount}`);
  } else {
    console.log("runtime=none");
  }

  printSection("Health");
  console.log(`dashboard=${summary.dashboard?.healthStatus || "unknown"}`);
  console.log(`readiness=${summary.readiness?.status || "unknown"}`);
  console.log(
    `checks=${summary.readiness?.readyChecks ?? 0}/${summary.readiness?.totalChecks ?? 0}`
  );
  console.log(`blocking=${summary.readiness?.blockingIssues ?? 0}`);
  console.log(`warnings=${summary.readiness?.warningIssues ?? 0}`);

  printSection("Top Issues");
  const topIssues = Array.isArray(summary.dashboard?.topIssues) ? summary.dashboard.topIssues : [];
  if (topIssues.length === 0) {
    console.log("- none");
  } else {
    for (const issue of topIssues) {
      console.log(`- [${issue.severity || "info"}] ${issue.category || "general"}: ${issue.message || "No message"}`);
    }
  }

  printSection("Recommended Actions");
  for (const action of summary.recommendations || []) {
    console.log(`- ${action}`);
  }
}

main().catch((error) => {
  console.error(`troubleshoot.failed ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
