import type { RuntimeWriteGateway } from "./types.js";

export function cloneNodeSnapshot(
  gateway: RuntimeWriteGateway,
  input: { nodeId: string }
) {
  return gateway.cloneNode ? gateway.cloneNode(input) : null;
}
