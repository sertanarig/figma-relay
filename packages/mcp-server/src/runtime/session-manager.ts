import type { z } from "zod";
import type { capabilitySchema } from "@codex-figma/protocol";
import { createInMemoryRuntimeStore } from "./in-memory-runtime-store.js";

export type RuntimeCapability = z.infer<typeof capabilitySchema>;

export type RuntimeSessionInput = {
  runtimeSessionId: string;
  fileKey: string;
  fileName: string;
  pageName: string;
  capabilities: RuntimeCapability[];
};

export type RuntimeSessionRecord = RuntimeSessionInput & {
  connectedAt: number;
  updatedAt: number;
};

export function createSessionManager() {
  const store = createInMemoryRuntimeStore();

  return {
    connectRuntime(input: RuntimeSessionInput): RuntimeSessionRecord {
      const now = Date.now();
      const record: RuntimeSessionRecord = {
        ...input,
        connectedAt: now,
        updatedAt: now
      };
      store.set(record);
      return record;
    },

    disconnectRuntime(runtimeSessionId: string) {
      store.delete(runtimeSessionId);
    },

    updateCapabilities(runtimeSessionId: string, capabilities: RuntimeCapability[]) {
      const current = store.get(runtimeSessionId);
      if (!current) {
        return null;
      }

      const updated: RuntimeSessionRecord = {
        ...current,
        capabilities,
        updatedAt: Date.now()
      };
      store.set(updated);
      return updated;
    },

    listRuntimes(): RuntimeSessionRecord[] {
      return store.list();
    },

    getActiveRuntime(): RuntimeSessionRecord | null {
      const [active] = store.list();
      return active ?? null;
    },

    getRuntime(runtimeSessionId: string): RuntimeSessionRecord | null {
      return store.get(runtimeSessionId);
    }
  };
}
