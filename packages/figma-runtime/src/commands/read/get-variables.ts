import type { RuntimeReadGateway } from "./types.js";

export function getVariablesInventorySnapshot(gateway: RuntimeReadGateway) {
  return gateway.getVariablesInventory ? gateway.getVariablesInventory() : null;
}
