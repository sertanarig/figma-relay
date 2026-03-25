import type { RuntimeWriteGateway } from "@codex-figma/figma-runtime/src/commands/write/types.js";
import { cloneNodeSnapshot } from "@codex-figma/figma-runtime/src/commands/write/clone-node.js";

export function cloneNode({
  runtimeGateway,
  nodeId
}: {
  runtimeGateway: RuntimeWriteGateway;
  nodeId: string;
}) {
  return cloneNodeSnapshot(runtimeGateway, { nodeId });
}
