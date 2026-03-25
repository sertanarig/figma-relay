import { describe, expect, it } from "vitest";
import { createRuntimeDispatcher } from "./runtime-dispatcher.js";

describe("runtime dispatcher", () => {
  it("dispatches read commands through the adapter", async () => {
    const dispatcher = createRuntimeDispatcher({
      getStatus: () => ({ connected: true, runtimeSessionId: "runtime-1", capabilities: ["runtime.status"] }),
      navigate: async () => ({ runtimeSessionId: "runtime-1", nodeIds: ["123:456"] }),
      getSelection: () => ({ runtimeSessionId: "runtime-1", nodes: [] }),
      createNode: async () => null
    });

    await expect(
      dispatcher.dispatch({
        requestId: "req-1",
        sessionId: "runtime-1",
        command: "figma_get_status",
        payload: {}
      })
    ).resolves.toEqual({
      requestId: "req-1",
      sessionId: "runtime-1",
      status: "succeeded",
      data: {
        connected: true,
        runtimeSessionId: "runtime-1",
        capabilities: ["runtime.status"]
      }
    });
  });

  it("dispatches write commands through the adapter", async () => {
    const dispatcher = createRuntimeDispatcher({
      getStatus: () => ({ connected: true, runtimeSessionId: "runtime-1", capabilities: ["runtime.status"] }),
      getSelection: () => ({ runtimeSessionId: "runtime-1", nodes: [] }),
      createNode: async (payload) => ({
        runtimeSessionId: "runtime-1",
        node: {
          id: "node-1",
          name: String(payload.name),
          type: String(payload.type),
          width: 100,
          height: 100,
          parentId: null,
          children: []
        }
      })
    });

    await expect(
      dispatcher.dispatch({
        requestId: "req-2",
        sessionId: "runtime-1",
        command: "figma_create_node",
        payload: {
          type: "RECTANGLE",
          name: "Card"
        }
      })
    ).resolves.toEqual({
      requestId: "req-2",
      sessionId: "runtime-1",
      status: "succeeded",
      data: {
        runtimeSessionId: "runtime-1",
        node: {
          id: "node-1",
          name: "Card",
          type: "RECTANGLE",
          width: 100,
          height: 100,
          parentId: null,
          children: []
        }
      }
    });
  });

  it("fails unknown commands explicitly", async () => {
    const dispatcher = createRuntimeDispatcher({
      getStatus: () => ({ connected: true, runtimeSessionId: "runtime-1", capabilities: ["runtime.status"] }),
      getSelection: () => ({ runtimeSessionId: "runtime-1", nodes: [] }),
      createNode: async () => null
    });

    await expect(
      dispatcher.dispatch({
        requestId: "req-3",
        sessionId: "runtime-1",
        command: "figma_unknown",
        payload: {}
      })
    ).rejects.toThrow("UNKNOWN_COMMAND");
  });

  it("dispatches variable, component, and debug commands", async () => {
    const dispatcher = createRuntimeDispatcher({
      getStatus: () => ({ connected: true, runtimeSessionId: "runtime-1", capabilities: ["runtime.status"] }),
      navigate: async () => ({ runtimeSessionId: "runtime-1", nodeIds: ["123:456"] }),
      getSelection: () => ({ runtimeSessionId: "runtime-1", nodes: [] }),
      getFileForPlugin: async () => ({
        runtimeSessionId: "runtime-1",
        fileName: "Comm. Design System",
        nodes: [{ id: "0:1", name: "Design System", type: "PAGE" }]
      }),
      getBoundVariables: async () => ({
        runtimeSessionId: "runtime-1",
        nodeId: "123:456",
        layout: { layoutMode: "VERTICAL" },
        boundVariables: { width: { id: "VariableID:1", name: "viewport/width" } }
      }),
      getStyles: async () => ({ runtimeSessionId: "runtime-1", textStyles: [] }),
      createNode: async () => null,
      setLayout: async (payload) => ({
        runtimeSessionId: "runtime-1",
        nodeId: String(payload.nodeId),
        layout: { layoutMode: String(payload.layoutMode), itemSpacing: Number(payload.itemSpacing) }
      }),
      setDescription: async (payload) => ({
        runtimeSessionId: "runtime-1",
        description: String(payload.description),
        nodeId: payload.nodeId ? String(payload.nodeId) : undefined
      }),
      setImageFill: async (payload) => ({
        runtimeSessionId: "runtime-1",
        nodeId: String(payload.nodeId),
        scaleMode: String(payload.scaleMode || "FILL"),
        imageHash: "image-hash"
      }),
      bindVariable: async (payload) => ({
        runtimeSessionId: "runtime-1",
        nodeId: String(payload.nodeId),
        field: String(payload.field),
        binding: { id: "VariableID:1", name: String(payload.variableName) }
      }),
      setVariableMode: async (payload) => ({
        runtimeSessionId: "runtime-1",
        nodeId: String(payload.nodeId),
        collectionName: String(payload.collectionName),
        modeName: String(payload.modeName)
      }),
      applyStyle: async (payload) => ({
        runtimeSessionId: "runtime-1",
        nodeId: String(payload.nodeId),
        styleType: String(payload.styleType),
        styleId: String(payload.styleId)
      }),
      createStyle: async (payload) => ({
        runtimeSessionId: "runtime-1",
        style: {
          id: "style-1",
          name: String(payload.name),
          styleType: String(payload.styleType)
        }
      }),
      deleteStyle: async (payload) => ({
        runtimeSessionId: "runtime-1",
        styleId: String(payload.styleId),
        deleted: true
      }),
      cleanupArtifacts: async (payload) => ({
        runtimeSessionId: "runtime-1",
        namePrefix: String(payload.namePrefix),
        deletedNodes: 2,
        deletedStyles: 1,
        deletedVariables: 1
      }),
      createVariableCollection: async (payload) => ({
        runtimeSessionId: "runtime-1",
        collection: {
          id: "collection-1",
          name: String(payload.name),
          modes: ["Light"]
        }
      }),
      searchComponents: async () => ({
        runtimeSessionId: "runtime-1",
        components: [{ id: "component-1", key: "button-primary", name: "Button/Primary" }]
      }),
      getLibraryComponents: async () => ({
        runtimeSessionId: "runtime-1",
        available: true,
        count: 1,
        components: [{ key: "library-button", name: "Button/Primary", libraryName: "Core UI" }]
      }),
      arrangeComponentSet: async (payload) => ({
        runtimeSessionId: "runtime-1",
        nodeId: String(payload.componentSetId || "component-set-1"),
        arrangedCount: 3,
        columns: Number(payload.columns || 2)
      }),
      getConsoleLogs: async () => ({
        runtimeSessionId: "runtime-1",
        logs: [{ id: "log-1", level: "info", message: "ok", timestamp: 1 }]
      }),
      execute: async (payload) => ({
        runtimeSessionId: "runtime-1",
        code: String(payload.code),
        result: { ok: true }
      }),
      clearConsole: async () => ({
        runtimeSessionId: "runtime-1",
        clearedCount: 2
      }),
      reloadPlugin: async () => ({
        runtimeSessionId: "runtime-1",
        reloaded: true
      })
    });

    await expect(
      dispatcher.dispatch({
        requestId: "req-4ab",
        sessionId: "runtime-1",
        command: "figma_get_file_for_plugin",
        payload: { depth: 2 }
      })
    ).resolves.toEqual({
      requestId: "req-4ab",
      sessionId: "runtime-1",
      status: "succeeded",
      data: {
        runtimeSessionId: "runtime-1",
        fileName: "Comm. Design System",
        nodes: [{ id: "0:1", name: "Design System", type: "PAGE" }]
      }
    });

    await expect(
      dispatcher.dispatch({
        requestId: "req-4aa",
        sessionId: "runtime-1",
        command: "figma_get_bound_variables",
        payload: { nodeId: "123:456" }
      })
    ).resolves.toEqual({
      requestId: "req-4aa",
      sessionId: "runtime-1",
      status: "succeeded",
      data: {
        runtimeSessionId: "runtime-1",
        nodeId: "123:456",
        layout: { layoutMode: "VERTICAL" },
        boundVariables: { width: { id: "VariableID:1", name: "viewport/width" } }
      }
    });

    await expect(
      dispatcher.dispatch({
        requestId: "req-4a00",
        sessionId: "runtime-1",
        command: "figma_navigate",
        payload: { nodeId: "123:456" }
      })
    ).resolves.toEqual({
      requestId: "req-4a00",
      sessionId: "runtime-1",
      status: "succeeded",
      data: {
        runtimeSessionId: "runtime-1",
        nodeIds: ["123:456"]
      }
    });

    await expect(
      dispatcher.dispatch({
        requestId: "req-4a0",
        sessionId: "runtime-1",
        command: "figma_set_description",
        payload: { nodeId: "123:456", description: "Runtime description" }
      })
    ).resolves.toEqual({
      requestId: "req-4a0",
      sessionId: "runtime-1",
      status: "succeeded",
      data: {
        runtimeSessionId: "runtime-1",
        description: "Runtime description",
        nodeId: "123:456"
      }
    });

    await expect(
      dispatcher.dispatch({
        requestId: "req-4a01",
        sessionId: "runtime-1",
        command: "figma_set_image_fill",
        payload: { nodeId: "123:456", dataUrl: "data:image/png;base64,AAAA" }
      })
    ).resolves.toEqual({
      requestId: "req-4a01",
      sessionId: "runtime-1",
      status: "succeeded",
      data: {
        runtimeSessionId: "runtime-1",
        nodeId: "123:456",
        scaleMode: "FILL",
        imageHash: "image-hash"
      }
    });

    await expect(
      dispatcher.dispatch({
        requestId: "req-4a",
        sessionId: "runtime-1",
        command: "figma_get_styles",
        payload: {}
      })
    ).resolves.toEqual({
      requestId: "req-4a",
      sessionId: "runtime-1",
      status: "succeeded",
      data: {
        runtimeSessionId: "runtime-1",
        textStyles: []
      }
    });

    await expect(
      dispatcher.dispatch({
        requestId: "req-4a2",
        sessionId: "runtime-1",
        command: "figma_execute",
        payload: { code: "return { ok: true };" }
      })
    ).resolves.toEqual({
      requestId: "req-4a2",
      sessionId: "runtime-1",
      status: "succeeded",
      data: {
        runtimeSessionId: "runtime-1",
        code: "return { ok: true };",
        result: { ok: true }
      }
    });

    await expect(
      dispatcher.dispatch({
        requestId: "req-4a3",
        sessionId: "runtime-1",
        command: "figma_clear_console",
        payload: {}
      })
    ).resolves.toEqual({
      requestId: "req-4a3",
      sessionId: "runtime-1",
      status: "succeeded",
      data: {
        runtimeSessionId: "runtime-1",
        clearedCount: 2
      }
    });

    await expect(
      dispatcher.dispatch({
        requestId: "req-4a4",
        sessionId: "runtime-1",
        command: "figma_reload_plugin",
        payload: {}
      })
    ).resolves.toEqual({
      requestId: "req-4a4",
      sessionId: "runtime-1",
      status: "succeeded",
      data: {
        runtimeSessionId: "runtime-1",
        reloaded: true
      }
    });

    await expect(
      dispatcher.dispatch({
        requestId: "req-4bb",
        sessionId: "runtime-1",
        command: "figma_set_layout",
        payload: { nodeId: "123:456", layoutMode: "VERTICAL", itemSpacing: 24 }
      })
    ).resolves.toEqual({
      requestId: "req-4bb",
      sessionId: "runtime-1",
      status: "succeeded",
      data: {
        runtimeSessionId: "runtime-1",
        nodeId: "123:456",
        layout: { layoutMode: "VERTICAL", itemSpacing: 24 }
      }
    });

    await expect(
      dispatcher.dispatch({
        requestId: "req-4bc",
        sessionId: "runtime-1",
        command: "figma_bind_variable",
        payload: { nodeId: "123:456", field: "width", variableName: "viewport/width" }
      })
    ).resolves.toEqual({
      requestId: "req-4bc",
      sessionId: "runtime-1",
      status: "succeeded",
      data: {
        runtimeSessionId: "runtime-1",
        nodeId: "123:456",
        field: "width",
        binding: { id: "VariableID:1", name: "viewport/width" }
      }
    });

    await expect(
      dispatcher.dispatch({
        requestId: "req-4bd",
        sessionId: "runtime-1",
        command: "figma_set_variable_mode",
        payload: { nodeId: "123:456", collectionName: "Responsive", modeName: "Desktop" }
      })
    ).resolves.toEqual({
      requestId: "req-4bd",
      sessionId: "runtime-1",
      status: "succeeded",
      data: {
        runtimeSessionId: "runtime-1",
        nodeId: "123:456",
        collectionName: "Responsive",
        modeName: "Desktop"
      }
    });

    await expect(
      dispatcher.dispatch({
        requestId: "req-4b",
        sessionId: "runtime-1",
        command: "figma_create_style",
        payload: { styleType: "paint", name: "Brand/Primary" }
      })
    ).resolves.toEqual({
      requestId: "req-4b",
      sessionId: "runtime-1",
      status: "succeeded",
      data: {
        runtimeSessionId: "runtime-1",
        style: {
          id: "style-1",
          name: "Brand/Primary",
          styleType: "paint"
        }
      }
    });

    await expect(
      dispatcher.dispatch({
        requestId: "req-4c",
        sessionId: "runtime-1",
        command: "figma_apply_style",
        payload: { nodeId: "123:456", styleType: "text", styleId: "S:1" }
      })
    ).resolves.toEqual({
      requestId: "req-4c",
      sessionId: "runtime-1",
      status: "succeeded",
      data: {
        runtimeSessionId: "runtime-1",
        nodeId: "123:456",
        styleType: "text",
        styleId: "S:1"
      }
    });

    await expect(
      dispatcher.dispatch({
        requestId: "req-4d1",
        sessionId: "runtime-1",
        command: "figma_get_library_components",
        payload: { query: "button" }
      })
    ).resolves.toEqual({
      requestId: "req-4d1",
      sessionId: "runtime-1",
      status: "succeeded",
      data: {
        runtimeSessionId: "runtime-1",
        available: true,
        count: 1,
        components: [{ key: "library-button", name: "Button/Primary", libraryName: "Core UI" }]
      }
    });

    await expect(
      dispatcher.dispatch({
        requestId: "req-4d2",
        sessionId: "runtime-1",
        command: "figma_arrange_component_set",
        payload: { componentSetId: "component-set-1", columns: 2 }
      })
    ).resolves.toEqual({
      requestId: "req-4d2",
      sessionId: "runtime-1",
      status: "succeeded",
      data: {
        runtimeSessionId: "runtime-1",
        nodeId: "component-set-1",
        arrangedCount: 3,
        columns: 2
      }
    });

    await expect(
      dispatcher.dispatch({
        requestId: "req-4d",
        sessionId: "runtime-1",
        command: "figma_delete_style",
        payload: { styleType: "paint", styleId: "S:1" }
      })
    ).resolves.toEqual({
      requestId: "req-4d",
      sessionId: "runtime-1",
      status: "succeeded",
      data: {
        runtimeSessionId: "runtime-1",
        styleId: "S:1",
        deleted: true
      }
    });

    await expect(
      dispatcher.dispatch({
        requestId: "req-4e",
        sessionId: "runtime-1",
        command: "figma_cleanup_artifacts",
        payload: { namePrefix: "Runtime MCP" }
      })
    ).resolves.toEqual({
      requestId: "req-4e",
      sessionId: "runtime-1",
      status: "succeeded",
      data: {
        runtimeSessionId: "runtime-1",
        namePrefix: "Runtime MCP",
        deletedNodes: 2,
        deletedStyles: 1,
        deletedVariables: 1
      }
    });

    await expect(
      dispatcher.dispatch({
        requestId: "req-4",
        sessionId: "runtime-1",
        command: "figma_create_variable_collection",
        payload: { name: "Brand Tokens" }
      })
    ).resolves.toEqual({
      requestId: "req-4",
      sessionId: "runtime-1",
      status: "succeeded",
      data: {
        runtimeSessionId: "runtime-1",
        collection: {
          id: "collection-1",
          name: "Brand Tokens",
          modes: ["Light"]
        }
      }
    });

    await expect(
      dispatcher.dispatch({
        requestId: "req-5",
        sessionId: "runtime-1",
        command: "figma_search_components",
        payload: { query: "button" }
      })
    ).resolves.toEqual({
      requestId: "req-5",
      sessionId: "runtime-1",
      status: "succeeded",
      data: {
        runtimeSessionId: "runtime-1",
        components: [{ id: "component-1", key: "button-primary", name: "Button/Primary" }]
      }
    });

    await expect(
      dispatcher.dispatch({
        requestId: "req-6",
        sessionId: "runtime-1",
        command: "figma_get_console_logs",
        payload: { level: "info" }
      })
    ).resolves.toEqual({
      requestId: "req-6",
      sessionId: "runtime-1",
      status: "succeeded",
      data: {
        runtimeSessionId: "runtime-1",
        logs: [{ id: "log-1", level: "info", message: "ok", timestamp: 1 }]
      }
    });
  });
});
