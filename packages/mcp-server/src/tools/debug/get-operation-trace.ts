import { createTraceStore } from "../../observability/trace-store.js";

type TraceStore = ReturnType<typeof createTraceStore>;

export function getOperationTrace({
  traceStore,
  requestId
}: {
  traceStore: TraceStore;
  requestId: string;
}) {
  return traceStore.get(requestId);
}
