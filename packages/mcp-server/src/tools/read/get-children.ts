import type { RuntimeReadGateway } from "@codex-figma/figma-runtime/src/commands/read/types.js";
import { getChildrenSnapshots } from "@codex-figma/figma-runtime/src/commands/read/get-children.js";
import type { createSessionManager } from "../../runtime/session-manager.js";

type SessionManager = ReturnType<typeof createSessionManager>;

export function getChildren({
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
    parentId: nodeId,
    nodes: getChildrenSnapshots(runtimeGateway, nodeId)
  };
}
