import type { RuntimeWriteGateway } from "@codex-figma/figma-runtime/src/commands/write/types.js";
import { createChildSnapshot } from "@codex-figma/figma-runtime/src/commands/write/create-child.js";

export function createChild({
  runtimeGateway,
  parentId,
  type,
  name,
  width,
  height,
  x,
  y,
  text
}: {
  runtimeGateway: RuntimeWriteGateway;
  parentId: string;
  type: string;
  name: string;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  text?: string;
}) {
  return createChildSnapshot(runtimeGateway, {
    parentId,
    type,
    name,
    width,
    height,
    x,
    y,
    text
  });
}
