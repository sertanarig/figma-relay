import type { RuntimeWriteGateway } from "./types.js";

export function resizeNodeSnapshot(
  gateway: RuntimeWriteGateway,
  input: { nodeId: string; width: number; height: number }
) {
  return gateway.resizeNode ? gateway.resizeNode(input) : null;
}
