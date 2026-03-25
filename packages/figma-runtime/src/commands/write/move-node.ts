import type { RuntimeWriteGateway } from "./types.js";

export function moveNodeSnapshot(
  gateway: RuntimeWriteGateway,
  input: { nodeId: string; x: number; y: number }
) {
  return gateway.moveNode ? gateway.moveNode(input) : null;
}
