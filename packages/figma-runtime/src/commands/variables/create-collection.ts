import type { RuntimeVariablesGateway } from "./types.js";

export function createVariableCollectionSnapshot(
  gateway: RuntimeVariablesGateway,
  input: {
    name: string;
    initialModeName?: string;
    additionalModes?: string[];
  }
) {
  return gateway.createVariableCollection ? gateway.createVariableCollection(input) : null;
}
