import type { RuntimeVariablesGateway } from "./types.js";

export function renameModeSnapshot(
  gateway: RuntimeVariablesGateway,
  input: { collectionId: string; modeId: string; newName: string }
) {
  return gateway.renameMode ? gateway.renameMode(input) : null;
}
