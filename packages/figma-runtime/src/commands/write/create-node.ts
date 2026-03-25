import type { RuntimeWriteGateway } from "./types.js";

export function createNodeSnapshot(
  gateway: RuntimeWriteGateway,
  input: {
    type: string;
    name: string;
    parentId?: string | null;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    text?: string;
  }
) {
  return gateway.createNode ? gateway.createNode(input) : null;
}
