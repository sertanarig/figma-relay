import type { createSessionManager } from "../../runtime/session-manager.js";

type SessionManager = ReturnType<typeof createSessionManager>;

export function reconnectRuntime({ sessionManager }: { sessionManager: SessionManager }) {
  const activeRuntime = sessionManager.getActiveRuntime();

  return {
    requested: true,
    runtimeSessionId: activeRuntime?.runtimeSessionId ?? null
  };
}
