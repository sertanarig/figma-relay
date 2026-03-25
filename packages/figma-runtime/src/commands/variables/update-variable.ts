import type { RuntimeVariablesGateway } from "./types.js";

export function updateVariableSnapshot(
  gateway: RuntimeVariablesGateway,
  input: { variableId: string; modeId: string; value: string }
) {
  return gateway.updateVariable ? gateway.updateVariable(input) : null;
}
