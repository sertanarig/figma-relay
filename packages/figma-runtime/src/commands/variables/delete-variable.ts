import type { RuntimeVariablesGateway } from "./types.js";

export function deleteVariableSnapshot(
  gateway: RuntimeVariablesGateway,
  input: { variableId: string }
) {
  return gateway.deleteVariable ? gateway.deleteVariable(input) : null;
}
