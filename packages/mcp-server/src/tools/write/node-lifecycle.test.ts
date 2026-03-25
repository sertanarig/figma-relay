import { describe, expect, it } from "vitest";
import { createNode } from "./create-node.js";
import { deleteNode } from "./delete-node.js";

describe("node lifecycle tools", () => {
  it("creates rectangle and text nodes through the runtime gateway", () => {
    const created: Array<{ type: string; name: string }> = [];
    const runtimeGateway = {
      createNode(input: { type: string; name: string }) {
        created.push({ type: input.type, name: input.name });
        return {
          runtimeSessionId: "runtime-1",
          node: {
            id: `${input.type}-${created.length}`,
            name: input.name,
            type: input.type,
            width: input.type === "TEXT" ? 120 : 200,
            height: input.type === "TEXT" ? 24 : 100,
            parentId: null,
            children: []
          }
        };
      }
    };

    expect(
      createNode({
        runtimeGateway,
        type: "RECTANGLE",
        name: "Hero Card"
      })
    ).toEqual({
      runtimeSessionId: "runtime-1",
      node: {
        id: "RECTANGLE-1",
        name: "Hero Card",
        type: "RECTANGLE",
        width: 200,
        height: 100,
        parentId: null,
        children: []
      }
    });

    expect(
      createNode({
        runtimeGateway,
        type: "TEXT",
        name: "Headline"
      })
    ).toEqual({
      runtimeSessionId: "runtime-1",
      node: {
        id: "TEXT-2",
        name: "Headline",
        type: "TEXT",
        width: 120,
        height: 24,
        parentId: null,
        children: []
      }
    });
  });

  it("deletes a node through the runtime gateway", () => {
    const runtimeGateway = {
      deleteNode(nodeId: string) {
        return {
          runtimeSessionId: "runtime-1",
          deletedNodeId: nodeId,
          deleted: true
        };
      }
    };

    expect(deleteNode({ runtimeGateway, nodeId: "node-1" })).toEqual({
      runtimeSessionId: "runtime-1",
      deletedNodeId: "node-1",
      deleted: true
    });
  });
});
