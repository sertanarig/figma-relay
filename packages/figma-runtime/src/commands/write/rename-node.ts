import type { RuntimeWriteGateway } from "./types.js";

export function renameNodeSnapshot(
  gateway: RuntimeWriteGateway,
  input: { nodeId: string; name: string }
) {
  return gateway.renameNode ? gateway.renameNode(input) : null;
}
