import type { RuntimeReadGateway } from "@codex-figma/figma-runtime/src/commands/read/types.js";
import { getSelectionSnapshot as readSelectionSnapshot } from "@codex-figma/figma-runtime/src/commands/read/get-selection.js";
import type { createSessionManager } from "../../runtime/session-manager.js";

type SessionManager = ReturnType<typeof createSessionManager>;

export function getSelection({
  sessionManager,
  runtimeGateway
}: {
  sessionManager: SessionManager;
  runtimeGateway?: RuntimeReadGateway;
}) {
  const activeRuntime = sessionManager.getActiveRuntime();
  if (!activeRuntime || !runtimeGateway) {
    return {
      runtimeSessionId: null,
      nodes: []
    };
  }

  const selection = readSelectionSnapshot(runtimeGateway);
  if (!selection) {
    return {
      runtimeSessionId: activeRuntime.runtimeSessionId,
      nodes: []
    };
  }

  return {
    runtimeSessionId: selection.runtimeSessionId,
    nodes: selection.nodeIds
      .map((nodeId) => (runtimeGateway.getNodeSnapshot ? runtimeGateway.getNodeSnapshot(nodeId) : null))
      .filter((node): node is NonNullable<typeof node> => node !== null)
  };
}
