import type { RuntimeReadGateway } from "./types.js";

export function getNodeSnapshot(gateway: RuntimeReadGateway, nodeId: string) {
  return gateway.getNodeSnapshot ? gateway.getNodeSnapshot(nodeId) : null;
}
