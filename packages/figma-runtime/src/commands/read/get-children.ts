import type { RuntimeReadGateway } from "./types.js";

export function getChildrenSnapshots(gateway: RuntimeReadGateway, nodeId: string) {
  const node = gateway.getNodeSnapshot ? gateway.getNodeSnapshot(nodeId) : null;
  if (!node) {
    return [];
  }

  return node.children
    .map((childId) => (gateway.getNodeSnapshot ? gateway.getNodeSnapshot(childId) : null))
    .filter((child): child is NonNullable<typeof child> => child !== null);
}
