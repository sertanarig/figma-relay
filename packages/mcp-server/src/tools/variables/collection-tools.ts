import type { RuntimeVariablesGateway } from "@codex-figma/figma-runtime/src/commands/variables/types.js";
import { addModeSnapshot } from "@codex-figma/figma-runtime/src/commands/variables/add-mode.js";
import { createVariableCollectionSnapshot } from "@codex-figma/figma-runtime/src/commands/variables/create-collection.js";
import { renameModeSnapshot } from "@codex-figma/figma-runtime/src/commands/variables/rename-mode.js";

export function createVariableCollection({
  runtimeGateway,
  name,
  initialModeName,
  additionalModes
}: {
  runtimeGateway: RuntimeVariablesGateway;
  name: string;
  initialModeName?: string;
  additionalModes?: string[];
}) {
  return createVariableCollectionSnapshot(runtimeGateway, {
    name,
    initialModeName,
    additionalModes
  });
}

export function addMode({
  runtimeGateway,
  collectionId,
  modeName
}: {
  runtimeGateway: RuntimeVariablesGateway;
  collectionId: string;
  modeName: string;
}) {
  return addModeSnapshot(runtimeGateway, { collectionId, modeName });
}

export function renameMode({
  runtimeGateway,
  collectionId,
  modeId,
  newName
}: {
  runtimeGateway: RuntimeVariablesGateway;
  collectionId: string;
  modeId: string;
  newName: string;
}) {
  return renameModeSnapshot(runtimeGateway, { collectionId, modeId, newName });
}
