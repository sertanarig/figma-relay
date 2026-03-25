import type { RuntimeComponentsGateway } from "./types.js";

export function instantiateComponentSnapshot(
  gateway: RuntimeComponentsGateway,
  input: {
    componentKey?: string;
    nodeId?: string;
    parentId?: string;
    overrides?: Record<string, unknown>;
    variant?: Record<string, string>;
  }
) {
  return gateway.instantiateComponent ? gateway.instantiateComponent(input) : null;
}
