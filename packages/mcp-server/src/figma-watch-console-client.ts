import { setTimeout as delay } from "node:timers/promises";

type ConsoleEntry = {
  id?: string;
  level?: string;
  message?: string;
  timestamp?: number;
};

type ExecuteTool = (toolName: string, args: Record<string, unknown>) => Promise<{
  runtimeSessionId?: string;
  logs?: ConsoleEntry[];
}>;

export function createFigmaWatchConsoleClient({
  executeTool
}: {
  executeTool: ExecuteTool;
}) {
  return {
    async watch({
      durationMs = 5_000,
      pollIntervalMs = 500,
      level,
      limit = 100
    }: {
      durationMs?: number;
      pollIntervalMs?: number;
      level?: string;
      limit?: number;
    }) {
      const startedAt = Date.now();
      const seen = new Set<string>();
      const entries: ConsoleEntry[] = [];
      let lastRuntimeSessionId: string | null = null;

      while (Date.now() - startedAt < durationMs) {
        const response = await executeTool("figma_get_console_logs", {
          level,
          count: Math.max(limit, 200)
        });
        lastRuntimeSessionId = response.runtimeSessionId || lastRuntimeSessionId;

        for (const entry of Array.isArray(response.logs) ? response.logs : []) {
          const stableId =
            typeof entry.id === "string" && entry.id
              ? entry.id
              : `${entry.timestamp || 0}:${entry.level || "info"}:${entry.message || ""}`;
          if (seen.has(stableId)) {
            continue;
          }
          seen.add(stableId);
          entries.push(entry);
          if (entries.length >= limit) {
            break;
          }
        }

        if (entries.length >= limit) {
          break;
        }

        const remainingMs = durationMs - (Date.now() - startedAt);
        if (remainingMs <= 0) {
          break;
        }
        await delay(Math.min(pollIntervalMs, remainingMs));
      }

      return {
        runtimeSessionId: lastRuntimeSessionId,
        watchedMs: Date.now() - startedAt,
        pollIntervalMs,
        count: entries.length,
        logs: entries
      };
    }
  };
}
