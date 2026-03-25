import { describe, expect, it, vi } from "vitest";
import { createFigmaWatchConsoleClient } from "./figma-watch-console-client.js";

describe("figma watch console client", () => {
  it("polls console logs, de-duplicates entries, and respects the limit", async () => {
    vi.useFakeTimers();

    const executeTool = vi
      .fn<
        (toolName: string, args: Record<string, unknown>) => Promise<{
          runtimeSessionId?: string;
          logs?: Array<{
            id?: string;
            level?: string;
            message?: string;
            timestamp?: number;
          }>;
        }>
      >()
      .mockResolvedValueOnce({
        runtimeSessionId: "runtime-1",
        logs: [
          { id: "log-1", level: "info", message: "A", timestamp: 1 },
          { id: "log-2", level: "warn", message: "B", timestamp: 2 }
        ]
      })
      .mockResolvedValueOnce({
        runtimeSessionId: "runtime-1",
        logs: [
          { id: "log-2", level: "warn", message: "B", timestamp: 2 },
          { id: "log-3", level: "error", message: "C", timestamp: 3 }
        ]
      });

    const client = createFigmaWatchConsoleClient({ executeTool });
    const watchPromise = client.watch({
      durationMs: 1_000,
      pollIntervalMs: 500,
      limit: 3
    });

    await vi.runAllTimersAsync();
    const result = await watchPromise;

    expect(executeTool).toHaveBeenCalledTimes(2);
    expect(result.runtimeSessionId).toBe("runtime-1");
    expect(result.count).toBe(3);
    expect(result.logs.map((entry) => entry.id)).toEqual(["log-1", "log-2", "log-3"]);

    vi.useRealTimers();
  });
});
