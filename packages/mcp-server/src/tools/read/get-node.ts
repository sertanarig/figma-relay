import type { RuntimeReadGateway } from "@codex-figma/figma-runtime/src/commands/read/types.js";
import { getNodeSnapshot as readNodeSnapshot } from "@codex-figma/figma-runtime/src/commands/read/get-node.js";
import type { createSessionManager } from "../../runtime/session-manager.js";

type SessionManager = ReturnType<typeof createSessionManager>;

export function getNode({
  sessionManager,
  runtimeGateway,
  nodeId
}: {
  sessionManager: SessionManager;
  runtimeGateway: RuntimeReadGateway;
  nodeId: string;
}) {
  const activeRuntime = sessionManager.getActiveRuntime();
  return {
    runtimeSessionId: activeRuntime?.runtimeSessionId ?? null,
    node: readNodeSnapshot(runtimeGateway, nodeId)
  };
}
