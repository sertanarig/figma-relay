import type { createSessionManager } from "../../runtime/session-manager.js";

type SessionManager = ReturnType<typeof createSessionManager>;

export function listOpenFiles({ sessionManager }: { sessionManager: SessionManager }) {
  return sessionManager.listRuntimes().map((runtime) => ({
    runtimeSessionId: runtime.runtimeSessionId,
    fileKey: runtime.fileKey,
    fileName: runtime.fileName,
    pageName: runtime.pageName
  }));
}
