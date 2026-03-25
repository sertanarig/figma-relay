import type { RuntimeReadGateway } from "@codex-figma/figma-runtime/src/commands/read/types.js";
import { getComponentsInventorySnapshot } from "@codex-figma/figma-runtime/src/commands/read/get-components.js";

export function getComponents({
  runtimeGateway
}: {
  runtimeGateway: RuntimeReadGateway;
}) {
  return getComponentsInventorySnapshot(runtimeGateway);
}
