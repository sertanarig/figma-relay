import type { RuntimeWriteGateway } from "@codex-figma/figma-runtime/src/commands/write/types.js";
import { deleteNodeSnapshot } from "@codex-figma/figma-runtime/src/commands/write/delete-node.js";

export function deleteNode({
  runtimeGateway,
  nodeId
}: {
  runtimeGateway: RuntimeWriteGateway;
  nodeId: string;
}) {
  return deleteNodeSnapshot(runtimeGateway, nodeId);
}
