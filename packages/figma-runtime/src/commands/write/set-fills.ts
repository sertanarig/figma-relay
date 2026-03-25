import type { RuntimeWriteGateway } from "./types.js";

export function setFillsSnapshot(
  gateway: RuntimeWriteGateway,
  input: { nodeId: string; fills: Array<{ type: string; color: string; opacity?: number }> }
) {
  return gateway.setFills ? gateway.setFills(input) : null;
}
