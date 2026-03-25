import type { RuntimeComponentsGateway } from "./types.js";

export function searchComponentsSnapshot(
  gateway: RuntimeComponentsGateway,
  input: { query?: string }
) {
  return gateway.searchComponents ? gateway.searchComponents(input) : null;
}
