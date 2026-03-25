import type { RuntimeComponentsGateway } from "./types.js";

export function createComponentSnapshot(
  gateway: RuntimeComponentsGateway,
  input: { name: string }
) {
  return gateway.createComponent ? gateway.createComponent(input) : null;
}
