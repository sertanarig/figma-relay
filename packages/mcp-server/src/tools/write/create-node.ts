import type { RuntimeWriteGateway } from "@codex-figma/figma-runtime/src/commands/write/types.js";
import { createNodeSnapshot } from "@codex-figma/figma-runtime/src/commands/write/create-node.js";

export function createNode({
  runtimeGateway,
  type,
  name,
  parentId,
  x,
  y,
  width,
  height,
  text
}: {
  runtimeGateway: RuntimeWriteGateway;
  type: string;
  name: string;
  parentId?: string | null;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  text?: string;
}) {
  return createNodeSnapshot(runtimeGateway, {
    type,
    name,
    parentId,
    x,
    y,
    width,
    height,
    text
  });
}
