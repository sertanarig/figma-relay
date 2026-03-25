import type { RuntimeWriteGateway } from "./types.js";

export function setStrokesSnapshot(
  gateway: RuntimeWriteGateway,
  input: {
    nodeId: string;
    strokes: Array<{ type: string; color: string; opacity?: number }>;
    strokeWeight?: number;
  }
) {
  return gateway.setStrokes ? gateway.setStrokes(input) : null;
}
