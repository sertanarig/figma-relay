import type { RuntimeReadGateway } from "@codex-figma/figma-runtime/src/commands/read/types.js";
import { getVariablesInventorySnapshot } from "@codex-figma/figma-runtime/src/commands/read/get-variables.js";

export function getVariables({
  runtimeGateway
}: {
  runtimeGateway: RuntimeReadGateway;
}) {
  return getVariablesInventorySnapshot(runtimeGateway);
}
