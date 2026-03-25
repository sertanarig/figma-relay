import type { RuntimeWriteGateway } from "@codex-figma/figma-runtime/src/commands/write/types.js";
import { moveNodeSnapshot } from "@codex-figma/figma-runtime/src/commands/write/move-node.js";
import { renameNodeSnapshot } from "@codex-figma/figma-runtime/src/commands/write/rename-node.js";
import { resizeNodeSnapshot } from "@codex-figma/figma-runtime/src/commands/write/resize-node.js";
import { setFillsSnapshot } from "@codex-figma/figma-runtime/src/commands/write/set-fills.js";
import { setStrokesSnapshot } from "@codex-figma/figma-runtime/src/commands/write/set-strokes.js";
import { setTextSnapshot } from "@codex-figma/figma-runtime/src/commands/write/set-text.js";

export function moveNode({
  runtimeGateway,
  nodeId,
  x,
  y
}: {
  runtimeGateway: RuntimeWriteGateway;
  nodeId: string;
  x: number;
  y: number;
}) {
  return moveNodeSnapshot(runtimeGateway, { nodeId, x, y });
}

export function resizeNode({
  runtimeGateway,
  nodeId,
  width,
  height
}: {
  runtimeGateway: RuntimeWriteGateway;
  nodeId: string;
  width: number;
  height: number;
}) {
  return resizeNodeSnapshot(runtimeGateway, { nodeId, width, height });
}

export function renameNode({
  runtimeGateway,
  nodeId,
  name
}: {
  runtimeGateway: RuntimeWriteGateway;
  nodeId: string;
  name: string;
}) {
  return renameNodeSnapshot(runtimeGateway, { nodeId, name });
}

export function setText({
  runtimeGateway,
  nodeId,
  text
}: {
  runtimeGateway: RuntimeWriteGateway;
  nodeId: string;
  text: string;
}) {
  return setTextSnapshot(runtimeGateway, { nodeId, text });
}

export function setFills({
  runtimeGateway,
  nodeId,
  fills
}: {
  runtimeGateway: RuntimeWriteGateway;
  nodeId: string;
  fills: Array<{ type: string; color: string; opacity?: number }>;
}) {
  return setFillsSnapshot(runtimeGateway, { nodeId, fills });
}

export function setStrokes({
  runtimeGateway,
  nodeId,
  strokes,
  strokeWeight
}: {
  runtimeGateway: RuntimeWriteGateway;
  nodeId: string;
  strokes: Array<{ type: string; color: string; opacity?: number }>;
  strokeWeight?: number;
}) {
  return setStrokesSnapshot(runtimeGateway, { nodeId, strokes, strokeWeight });
}
