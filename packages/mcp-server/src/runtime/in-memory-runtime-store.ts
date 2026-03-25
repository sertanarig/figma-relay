import type { RuntimeSessionRecord } from "./session-manager.js";

export function createInMemoryRuntimeStore() {
  const sessions = new Map<string, RuntimeSessionRecord>();

  return {
    list(): RuntimeSessionRecord[] {
      return Array.from(sessions.values()).sort((a, b) => b.connectedAt - a.connectedAt);
    },
    get(runtimeSessionId: string): RuntimeSessionRecord | null {
      return sessions.get(runtimeSessionId) ?? null;
    },
    set(record: RuntimeSessionRecord) {
      sessions.set(record.runtimeSessionId, record);
    },
    delete(runtimeSessionId: string) {
      sessions.delete(runtimeSessionId);
    }
  };
}
