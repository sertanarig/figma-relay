import type { RuntimeVariablesGateway } from "./types.js";

export function batchUpdateVariablesSnapshot(
  gateway: RuntimeVariablesGateway,
  input: {
    updates: Array<{ variableId: string; modeId: string; value: string }>;
  }
) {
  return gateway.batchUpdateVariables ? gateway.batchUpdateVariables(input) : null;
}
