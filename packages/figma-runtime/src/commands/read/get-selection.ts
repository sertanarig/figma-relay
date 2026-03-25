import type { RuntimeReadGateway } from "./types.js";

export function getSelectionSnapshot(gateway: RuntimeReadGateway) {
  return gateway.getSelectionSnapshot ? gateway.getSelectionSnapshot() : null;
}
