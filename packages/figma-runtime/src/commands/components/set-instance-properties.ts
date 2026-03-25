import type { RuntimeComponentsGateway } from "./types.js";

export function setInstancePropertiesSnapshot(
  gateway: RuntimeComponentsGateway,
  input: { nodeId: string; properties: Record<string, unknown> }
) {
  return gateway.setInstanceProperties ? gateway.setInstanceProperties(input) : null;
}
