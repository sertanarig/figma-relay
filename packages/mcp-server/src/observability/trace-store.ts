import type { z } from "zod";
import type { traceEnvelopeSchema } from "@codex-figma/protocol";

type TraceRecord = z.infer<typeof traceEnvelopeSchema>;

export function createTraceStore() {
  const traces = new Map<string, TraceRecord>();

  return {
    record(trace: TraceRecord) {
      traces.set(trace.requestId, trace);
    },
    get(requestId: string) {
      return traces.get(requestId) ?? null;
    },
    list() {
      return Array.from(traces.values());
    }
  };
}
