import { describe, expect, it } from "vitest";
import {
  moveNode,
  renameNode,
  resizeNode,
  setFills,
  setStrokes,
  setText
} from "./mutation-tools.js";

describe("mutation tools", () => {
  it("moves, resizes, renames, updates text, fills, and strokes", () => {
    const runtimeGateway = {
      moveNode(input: { nodeId: string; x: number; y: number }) {
        return { runtimeSessionId: "runtime-1", ...input };
      },
      resizeNode(input: { nodeId: string; width: number; height: number }) {
        return { runtimeSessionId: "runtime-1", ...input };
      },
      renameNode(input: { nodeId: string; name: string }) {
        return { runtimeSessionId: "runtime-1", ...input };
      },
      setText(input: { nodeId: string; text: string }) {
        return { runtimeSessionId: "runtime-1", ...input };
      },
      setFills(input: { nodeId: string; fills: Array<{ type: string; color: string }> }) {
        return { runtimeSessionId: "runtime-1", ...input };
      },
      setStrokes(input: {
        nodeId: string;
        strokes: Array<{ type: string; color: string }>;
        strokeWeight?: number;
      }) {
        return { runtimeSessionId: "runtime-1", ...input };
      }
    };

    expect(moveNode({ runtimeGateway, nodeId: "node-1", x: 100, y: 200 })).toEqual({
      runtimeSessionId: "runtime-1",
      nodeId: "node-1",
      x: 100,
      y: 200
    });

    expect(resizeNode({ runtimeGateway, nodeId: "node-1", width: 320, height: 180 })).toEqual({
      runtimeSessionId: "runtime-1",
      nodeId: "node-1",
      width: 320,
      height: 180
    });

    expect(renameNode({ runtimeGateway, nodeId: "node-1", name: "CTA" })).toEqual({
      runtimeSessionId: "runtime-1",
      nodeId: "node-1",
      name: "CTA"
    });

    expect(setText({ runtimeGateway, nodeId: "node-2", text: "Continue" })).toEqual({
      runtimeSessionId: "runtime-1",
      nodeId: "node-2",
      text: "Continue"
    });

    expect(
      setFills({
        runtimeGateway,
        nodeId: "node-1",
        fills: [{ type: "SOLID", color: "#0055FF" }]
      })
    ).toEqual({
      runtimeSessionId: "runtime-1",
      nodeId: "node-1",
      fills: [{ type: "SOLID", color: "#0055FF" }]
    });

    expect(
      setStrokes({
        runtimeGateway,
        nodeId: "node-1",
        strokes: [{ type: "SOLID", color: "#111111" }],
        strokeWeight: 2
      })
    ).toEqual({
      runtimeSessionId: "runtime-1",
      nodeId: "node-1",
      strokes: [{ type: "SOLID", color: "#111111" }],
      strokeWeight: 2
    });
  });
});
