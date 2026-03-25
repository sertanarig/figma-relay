import type { RuntimeWriteGateway } from "./types.js";

export function setTextSnapshot(
  gateway: RuntimeWriteGateway,
  input: { nodeId: string; text: string }
) {
  return gateway.setText ? gateway.setText(input) : null;
}
