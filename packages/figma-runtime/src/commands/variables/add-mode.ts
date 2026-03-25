import type { RuntimeVariablesGateway } from "./types.js";

export function addModeSnapshot(
  gateway: RuntimeVariablesGateway,
  input: { collectionId: string; modeName: string }
) {
  return gateway.addMode ? gateway.addMode(input) : null;
}
