import type { RuntimeVariablesGateway } from "@codex-figma/figma-runtime/src/commands/variables/types.js";
import { batchUpdateVariablesSnapshot } from "@codex-figma/figma-runtime/src/commands/variables/batch-update-variables.js";
import { createVariableSnapshot } from "@codex-figma/figma-runtime/src/commands/variables/create-variable.js";
import { deleteVariableSnapshot } from "@codex-figma/figma-runtime/src/commands/variables/delete-variable.js";
import { updateVariableSnapshot } from "@codex-figma/figma-runtime/src/commands/variables/update-variable.js";

export function createVariable({
  runtimeGateway,
  collectionId,
  name,
  resolvedType,
  valuesByMode
}: {
  runtimeGateway: RuntimeVariablesGateway;
  collectionId: string;
  name: string;
  resolvedType: string;
  valuesByMode?: Record<string, string>;
}) {
  return createVariableSnapshot(runtimeGateway, {
    collectionId,
    name,
    resolvedType,
    valuesByMode
  });
}

export function updateVariable({
  runtimeGateway,
  variableId,
  modeId,
  value
}: {
  runtimeGateway: RuntimeVariablesGateway;
  variableId: string;
  modeId: string;
  value: string;
}) {
  return updateVariableSnapshot(runtimeGateway, { variableId, modeId, value });
}

export function batchUpdateVariables({
  runtimeGateway,
  updates
}: {
  runtimeGateway: RuntimeVariablesGateway;
  updates: Array<{ variableId: string; modeId: string; value: string }>;
}) {
  return batchUpdateVariablesSnapshot(runtimeGateway, { updates });
}

export function deleteVariable({
  runtimeGateway,
  variableId
}: {
  runtimeGateway: RuntimeVariablesGateway;
  variableId: string;
}) {
  return deleteVariableSnapshot(runtimeGateway, { variableId });
}
