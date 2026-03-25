import type { RuntimeWriteGateway } from "./types.js";

export function createChildSnapshot(
  gateway: RuntimeWriteGateway,
  input: {
    parentId: string;
    type: string;
    name: string;
    width?: number;
    height?: number;
    x?: number;
    y?: number;
    text?: string;
  }
) {
  return gateway.createChild ? gateway.createChild(input) : null;
}
