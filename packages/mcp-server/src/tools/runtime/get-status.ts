import type { createSessionManager } from "../../runtime/session-manager.js";

type SessionManager = ReturnType<typeof createSessionManager>;

export function getStatus({ sessionManager }: { sessionManager: SessionManager }) {
  const activeRuntime = sessionManager.getActiveRuntime();

  if (!activeRuntime) {
    return {
      connected: false,
      runtimeSessionId: null,
      capabilities: []
    };
  }

  return {
    connected: true,
    runtimeSessionId: activeRuntime.runtimeSessionId,
    capabilities: activeRuntime.capabilities
  };
}
