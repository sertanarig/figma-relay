import { describe, expect, it } from "vitest";
import { createTraceStore } from "../../observability/trace-store.js";
import { getDesignChanges } from "./get-design-changes.js";
import { getOperationTrace } from "./get-operation-trace.js";

describe("debug tools", () => {
  it("returns stored operation traces by request id", () => {
    const traceStore = createTraceStore();
    traceStore.record({
      requestId: "req-1",
      sessionId: "runtime-1",
      toolName: "figma_create_node",
      status: "succeeded",
      targetNodeIds: ["node-1"],
      startedAt: "2026-03-17T18:00:00.000Z",
      endedAt: "2026-03-17T18:00:00.120Z",
      durationMs: 120
    });

    expect(getOperationTrace({ traceStore, requestId: "req-1" })).toEqual({
      requestId: "req-1",
      sessionId: "runtime-1",
      toolName: "figma_create_node",
      status: "succeeded",
      targetNodeIds: ["node-1"],
      startedAt: "2026-03-17T18:00:00.000Z",
      endedAt: "2026-03-17T18:00:00.120Z",
      durationMs: 120
    });
  });

  it("returns recent design change events", () => {
    const runtimeGateway = {
      getDesignChanges(input: { since?: number; count?: number }) {
        return {
          runtimeSessionId: "runtime-1",
          events: [
            {
              id: "change-1",
              nodeId: "node-1",
              type: "NODE_UPDATED",
              timestamp: 1710698400000
            }
          ].slice(0, input.count ?? 20)
        };
      }
    };

    expect(getDesignChanges({ runtimeGateway, count: 1 })).toEqual({
      runtimeSessionId: "runtime-1",
      events: [
        {
          id: "change-1",
          nodeId: "node-1",
          type: "NODE_UPDATED",
          timestamp: 1710698400000
        }
      ]
    });
  });
});
