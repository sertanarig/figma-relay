import type { RuntimeVariablesGateway } from "./types.js";

export function createVariableSnapshot(
  gateway: RuntimeVariablesGateway,
  input: {
    collectionId: string;
    name: string;
    resolvedType: string;
    valuesByMode?: Record<string, string>;
  }
) {
  return gateway.createVariable ? gateway.createVariable(input) : null;
}
