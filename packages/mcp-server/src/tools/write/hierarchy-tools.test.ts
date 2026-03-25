import { describe, expect, it } from "vitest";
import { cloneNode } from "./clone-node.js";
import { createChild } from "./create-child.js";

describe("hierarchy tools", () => {
  it("clones a node through the runtime gateway", () => {
    const runtimeGateway = {
      cloneNode(input: { nodeId: string }) {
        return {
          runtimeSessionId: "runtime-1",
          node: {
            id: `${input.nodeId}-clone`,
            name: "Card Copy",
            type: "FRAME",
            width: 320,
            height: 180,
            parentId: null,
            children: []
          }
        };
      }
    };

    expect(cloneNode({ runtimeGateway, nodeId: "card-1" })).toEqual({
      runtimeSessionId: "runtime-1",
      node: {
        id: "card-1-clone",
        name: "Card Copy",
        type: "FRAME",
        width: 320,
        height: 180,
        parentId: null,
        children: []
      }
    });
  });

  it("creates a child inside a parent container", () => {
    const runtimeGateway = {
      createChild(input: {
        parentId: string;
        type: string;
        name: string;
        width?: number;
        height?: number;
      }) {
        return {
          runtimeSessionId: "runtime-1",
          node: {
            id: `${input.parentId}-child-1`,
            name: input.name,
            type: input.type,
            width: input.width ?? 100,
            height: input.height ?? 100,
            parentId: input.parentId,
            children: []
          }
        };
      }
    };

    expect(
      createChild({
        runtimeGateway,
        parentId: "frame-1",
        type: "RECTANGLE",
        name: "Badge",
        width: 80,
        height: 24
      })
    ).toEqual({
      runtimeSessionId: "runtime-1",
      node: {
        id: "frame-1-child-1",
        name: "Badge",
        type: "RECTANGLE",
        width: 80,
        height: 24,
        parentId: "frame-1",
        children: []
      }
    });
  });
});
