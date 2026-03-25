import type { NodeSnapshot } from "../read/types.js";

export type RuntimeWriteGateway = {
  createNode?(input: {
    type: string;
    name: string;
    parentId?: string | null;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    text?: string;
  }): {
    runtimeSessionId: string;
    node: NodeSnapshot;
  } | null;
  deleteNode?(nodeId: string): {
    runtimeSessionId: string;
    deletedNodeId: string;
    deleted: boolean;
  } | null;
  moveNode?(input: { nodeId: string; x: number; y: number }): {
    runtimeSessionId: string;
    nodeId: string;
    x: number;
    y: number;
  } | null;
  resizeNode?(input: { nodeId: string; width: number; height: number }): {
    runtimeSessionId: string;
    nodeId: string;
    width: number;
    height: number;
  } | null;
  renameNode?(input: { nodeId: string; name: string }): {
    runtimeSessionId: string;
    nodeId: string;
    name: string;
  } | null;
  setText?(input: { nodeId: string; text: string }): {
    runtimeSessionId: string;
    nodeId: string;
    text: string;
  } | null;
  setFills?(input: { nodeId: string; fills: Array<{ type: string; color: string; opacity?: number }> }): {
    runtimeSessionId: string;
    nodeId: string;
    fills: Array<{ type: string; color: string; opacity?: number }>;
  } | null;
  setStrokes?(input: {
    nodeId: string;
    strokes: Array<{ type: string; color: string; opacity?: number }>;
    strokeWeight?: number;
  }): {
    runtimeSessionId: string;
    nodeId: string;
    strokes: Array<{ type: string; color: string; opacity?: number }>;
    strokeWeight?: number;
  } | null;
  cloneNode?(input: { nodeId: string }): {
    runtimeSessionId: string;
    node: NodeSnapshot;
  } | null;
  createChild?(input: {
    parentId: string;
    type: string;
    name: string;
    width?: number;
    height?: number;
    x?: number;
    y?: number;
    text?: string;
  }): {
    runtimeSessionId: string;
    node: NodeSnapshot;
  } | null;
};
