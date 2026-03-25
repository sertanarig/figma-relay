import type { RuntimeWriteGateway } from "./types.js";

export function deleteNodeSnapshot(gateway: RuntimeWriteGateway, nodeId: string) {
  return gateway.deleteNode ? gateway.deleteNode(nodeId) : null;
}
