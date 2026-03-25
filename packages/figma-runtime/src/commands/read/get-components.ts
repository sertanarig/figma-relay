import type { RuntimeReadGateway } from "./types.js";

export function getComponentsInventorySnapshot(gateway: RuntimeReadGateway) {
  return gateway.getComponentsInventory ? gateway.getComponentsInventory() : null;
}
