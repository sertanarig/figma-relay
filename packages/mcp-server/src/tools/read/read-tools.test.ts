import { describe, expect, it } from "vitest";
import { createSessionManager } from "../../runtime/session-manager.js";
import { getChildren } from "./get-children.js";
import { getNode } from "./get-node.js";
import { getSelection } from "./get-selection.js";

describe("read tools", () => {
  it("returns an empty selection when nothing is selected", () => {
    const sessionManager = createSessionManager();

    expect(getSelection({ sessionManager })).toEqual({
      runtimeSessionId: null,
      nodes: []
    });
  });

  it("returns the active node for the current runtime", () => {
    const sessionManager = createSessionManager();
    sessionManager.connectRuntime({
      runtimeSessionId: "runtime-1",
      fileKey: "file-1",
      fileName: "Core UI",
      pageName: "Buttons",
      capabilities: ["selection.read", "node.read"]
    });

    const nodeStore = new Map([
      [
        "button-primary",
        {
          id: "button-primary",
          name: "Primary Button",
          type: "COMPONENT",
          width: 140,
          height: 44,
          parentId: null,
          children: ["label-primary"]
        }
      ],
      [
        "label-primary",
        {
          id: "label-primary",
          name: "Button Label",
          type: "TEXT",
          width: 72,
          height: 16,
          parentId: "button-primary",
          children: []
        }
      ]
    ]);

    const runtimeGateway = {
      getSelectionSnapshot() {
        return {
          runtimeSessionId: "runtime-1",
          nodeIds: ["button-primary"]
        };
      },
      getNodeSnapshot(nodeId: string) {
        return nodeStore.get(nodeId) ?? null;
      }
    };

    expect(getSelection({ sessionManager, runtimeGateway })).toEqual({
      runtimeSessionId: "runtime-1",
      nodes: [
        {
          id: "button-primary",
          name: "Primary Button",
          type: "COMPONENT",
          width: 140,
          height: 44,
          parentId: null,
          children: ["label-primary"]
        }
      ]
    });

    expect(
      getNode({
        sessionManager,
        runtimeGateway,
        nodeId: "button-primary"
      })
    ).toEqual({
      runtimeSessionId: "runtime-1",
      node: {
        id: "button-primary",
        name: "Primary Button",
        type: "COMPONENT",
        width: 140,
        height: 44,
        parentId: null,
        children: ["label-primary"]
      }
    });

    expect(
      getChildren({
        sessionManager,
        runtimeGateway,
        nodeId: "button-primary"
      })
    ).toEqual({
      runtimeSessionId: "runtime-1",
      parentId: "button-primary",
      nodes: [
        {
          id: "label-primary",
          name: "Button Label",
          type: "TEXT",
          width: 72,
          height: 16,
          parentId: "button-primary",
          children: []
        }
      ]
    });
  });
});
