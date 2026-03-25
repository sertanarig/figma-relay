import { afterEach, describe, expect, it, vi } from "vitest";
import { createFigmaDesignSystemClient } from "./figma-design-system-client.js";

afterEach(() => {
  vi.useRealTimers();
});

describe("figma design system client", () => {
  it("builds a compact design system summary", async () => {
    const client = createFigmaDesignSystemClient({
      executeTool: async (toolName) => {
        if (toolName === "figma_get_file_context") {
          return { runtimeSessionId: "runtime-1", fileName: "System", pageName: "Tokens" };
        }
        if (toolName === "figma_get_styles") {
          return {
            textStyles: [{ name: "Typography/Body/M" }],
            paintStyles: [{ name: "Brand/Primary" }],
            effectStyles: [],
            gridStyles: []
          };
        }
        if (toolName === "figma_get_variables") {
          return {
            collections: [
              {
                name: "Responsive",
                variables: [{ name: "viewport/width" }, { name: "page/padding/x" }]
              }
            ]
          };
        }
        if (toolName === "figma_get_components") {
          return {
            components: [{ name: "Button/Primary" }, { name: "Input/Default" }]
          };
        }
        throw new Error(`Unexpected tool ${toolName}`);
      }
    });

    const result = await client.getSummary();

    expect(result.fileName).toBe("System");
    expect(result.counts.variables).toBe(2);
    expect(result.counts.components).toBe(2);
    expect(result.collections).toEqual(["Responsive"]);
  });

  it("filters token values", async () => {
    const client = createFigmaDesignSystemClient({
      executeTool: async (toolName) => {
        if (toolName === "figma_get_variables") {
          return {
            collections: [
              {
                name: "Responsive",
                variables: [
                  {
                    id: "1",
                    name: "viewport/width",
                    type: "FLOAT",
                    valuesByMode: { Desktop: "1360" }
                  },
                  {
                    id: "2",
                    name: "page/padding/x",
                    type: "FLOAT",
                    valuesByMode: { Desktop: "40" }
                  },
                  {
                    id: "3",
                    name: "background/surface",
                    type: "COLOR",
                    valuesByMode: { Default: "#FFFFFF" }
                  }
                ]
              }
            ]
          };
        }
        throw new Error(`Unexpected tool ${toolName}`);
      }
    });

    const result = await client.getTokenValues({ filter: "page", type: "float", limit: 10 });

    expect(result.count).toBe(1);
    expect(result.tokens[0]).toMatchObject({
      name: "page/padding/x",
      type: "FLOAT",
      collection: "Responsive"
    });
  });

  it("browses tokens by collection and type", async () => {
    const client = createFigmaDesignSystemClient({
      executeTool: async (toolName) => {
        if (toolName === "figma_get_variables") {
          return {
            collections: [
              {
                id: "collection-1",
                name: "Responsive",
                variables: [
                  {
                    id: "1",
                    name: "viewport/width",
                    type: "FLOAT",
                    valuesByMode: { Desktop: "1360" }
                  },
                  {
                    id: "2",
                    name: "page/padding/x",
                    type: "FLOAT",
                    valuesByMode: { Desktop: "40" }
                  },
                  {
                    id: "3",
                    name: "surface/background",
                    type: "COLOR",
                    valuesByMode: { Default: "#FFFFFF" }
                  }
                ]
              }
            ]
          };
        }
        throw new Error(`Unexpected tool ${toolName}`);
      }
    });

    const result = await client.browseTokens({ type: "float", collection: "responsive", limitPerCollection: 10 });

    expect(result.count).toBe(2);
    expect(result.collections).toHaveLength(1);
    expect(result.collections[0]).toMatchObject({
      name: "Responsive",
      variableCount: 2
    });
    expect((result.collections[0] as any).groups[0].group).toBe("page");
  });

  it("supports count-based sorting for token collections and design-system groups", async () => {
    const client = createFigmaDesignSystemClient({
      executeTool: async (toolName) => {
        if (toolName === "figma_get_variables") {
          return {
            collections: [
              {
                id: "collection-1",
                name: "Small",
                variables: [{ id: "1", name: "alpha/one", type: "FLOAT", valuesByMode: { Default: 1 } }]
              },
              {
                id: "collection-2",
                name: "Large",
                variables: [
                  { id: "2", name: "beta/one", type: "FLOAT", valuesByMode: { Default: 1 } },
                  { id: "3", name: "beta/two", type: "FLOAT", valuesByMode: { Default: 2 } }
                ]
              }
            ]
          };
        }
        if (toolName === "figma_get_styles") {
          return {
            textStyles: [{ id: "style-1", name: "Typography/Body/M" }],
            paintStyles: [{ id: "style-2", name: "Brand/Primary" }],
            effectStyles: [],
            gridStyles: []
          };
        }
        if (toolName === "figma_get_components") {
          return {
            components: [
              { id: "node-1", name: "Button/Primary" },
              { id: "node-2", name: "Button/Secondary" },
              { id: "node-3", name: "Input/Default" }
            ]
          };
        }
        throw new Error(`Unexpected tool ${toolName}`);
      }
    });

    const tokenResult = await client.browseTokens({ sortBy: "count", order: "desc", limitPerCollection: 10 });
    const browserResult = await client.browseDesignSystem({ sortBy: "count", order: "desc", componentLimit: 10, styleLimit: 10 });

    expect((tokenResult.collections[0] as any).name).toBe("Large");
    expect((browserResult.componentGroups[0] as any).group).toBe("Button");
  });

  it("supports browse presets for grouped views", async () => {
    const client = createFigmaDesignSystemClient({
      executeTool: async (toolName) => {
        if (toolName === "figma_get_variables") {
          return {
            collections: [
              { id: "c1", name: "Zeta", variables: [{ id: "1", name: "z/a", type: "FLOAT", valuesByMode: {} }] },
              {
                id: "c2",
                name: "Alpha",
                variables: [
                  { id: "2", name: "a/a", type: "FLOAT", valuesByMode: {} },
                  { id: "3", name: "a/b", type: "FLOAT", valuesByMode: {} }
                ]
              }
            ]
          };
        }
        if (toolName === "figma_get_styles") {
          return { textStyles: [], paintStyles: [], effectStyles: [], gridStyles: [] };
        }
        if (toolName === "figma_get_components") {
          return {
            components: [
              { id: "1", name: "Beta/One" },
              { id: "2", name: "Beta/Two" },
              { id: "3", name: "Alpha/One" }
            ]
          };
        }
        throw new Error(`Unexpected tool ${toolName}`);
      }
    });

    const alphaFirst = await client.browseTokens({ preset: "alphabetical", limitPerCollection: 10 });
    const largestFirst = await client.browseDesignSystem({ preset: "largest-groups", componentLimit: 10, styleLimit: 10 });

    expect((alphaFirst.collections[0] as any).name).toBe("Alpha");
    expect((largestFirst.componentGroups[0] as any).group).toBe("Beta");
  });

  it("browses grouped design system inventory", async () => {
    const client = createFigmaDesignSystemClient({
      executeTool: async (toolName) => {
        if (toolName === "figma_get_styles") {
          return {
            textStyles: [{ id: "style-1", name: "Typography/Body/M" }],
            paintStyles: [{ id: "style-2", name: "Brand/Primary" }],
            effectStyles: [],
            gridStyles: []
          };
        }
        if (toolName === "figma_get_components") {
          return {
            components: [
              {
                id: "node-1",
                key: "key-1",
                name: "Button/Primary",
                setName: "Button",
                nodeType: "COMPONENT",
                width: 120,
                height: 48,
                propertyNames: ["Size", "State"]
              }
            ]
          };
        }
        throw new Error(`Unexpected tool ${toolName}`);
      }
    });

    const result = await client.browseDesignSystem({ filter: "body", componentLimit: 10, styleLimit: 10 });

    expect(result.counts.styles).toBe(1);
    expect(result.counts.components).toBe(0);
    expect((result.styleGroups[0] as any).group).toBe("Typography");
    expect(result.styles[0]).toMatchObject({
      name: "Typography/Body/M",
      styleType: "TEXT"
    });
  });

  it("builds a combined design system kit payload", async () => {
    const client = createFigmaDesignSystemClient({
      executeTool: async (toolName, args) => {
        if (toolName === "figma_get_file_context") {
          return {
            runtimeSessionId: "runtime-1",
            fileKey: "file-1",
            fileName: "System",
            pageName: "Components"
          };
        }
        if (toolName === "figma_get_styles") {
          return {
            textStyles: [{ name: "Typography/Body/M" }],
            paintStyles: [{ name: "Brand/Primary" }],
            effectStyles: [{ name: "Card/Shadow" }],
            gridStyles: []
          };
        }
        if (toolName === "figma_get_variables") {
          return {
            collections: [
              {
                id: "collection-1",
                name: "Responsive",
                variables: [{ id: "var-1", name: "viewport/width", type: "FLOAT", valuesByMode: { Desktop: "1360" } }]
              }
            ]
          };
        }
        if (toolName === "figma_get_components") {
          return {
            components: [
              {
                id: "node-1",
                key: "key-1",
                name: "Button/Primary",
                setName: "Button",
                nodeType: "COMPONENT",
                width: 120,
                height: 48,
                propertyNames: ["Size", "State"]
              },
              {
                id: "node-2",
                key: "key-2",
                name: "Input/Default",
                setName: "Input",
                nodeType: "COMPONENT",
                width: 240,
                height: 56,
                propertyNames: ["State"]
              }
            ]
          };
        }
        if (toolName === "figma_get_component_details") {
          return {
            id: "node-1",
            key: "key-1",
            name: "Button/Primary",
            setName: "Button",
            nodeType: "COMPONENT",
            width: 120,
            height: 48,
            propertyNames: ["Size", "State"]
          };
        }
        if (toolName === "figma_get_component_image") {
          return {
            imageRef: "memory://component/node-1",
            dataUrl: "data:image/png;base64,abc"
          };
        }
        throw new Error(`Unexpected tool ${toolName} with args ${JSON.stringify(args)}`);
      }
    });

    const result = await client.getKit({
      includeImage: true,
      componentNames: ["Button"],
      componentLimit: 10
    });

    expect(result.fileKey).toBe("file-1");
    expect(result.counts.components).toBe(2);
    expect(result.counts.returnedComponents).toBe(1);
    expect(result.components[0]).toMatchObject({
      id: "node-1",
      name: "Button/Primary",
      image: {
        hasImage: true,
        imageRef: "memory://component/node-1"
      }
    });
  });

  it("reuses cached inventory across repeated calls within the ttl window", async () => {
    vi.useFakeTimers();

    const calls = new Map<string, number>();
    const increment = (toolName: string) => {
      calls.set(toolName, (calls.get(toolName) || 0) + 1);
    };

    const client = createFigmaDesignSystemClient({
      cacheTtlMs: 1_000,
      executeTool: async (toolName) => {
        increment(toolName);

        if (toolName === "figma_get_file_context") {
          return { runtimeSessionId: "runtime-1", fileName: "System", pageName: "Page" };
        }
        if (toolName === "figma_get_styles") {
          return { textStyles: [], paintStyles: [], effectStyles: [], gridStyles: [] };
        }
        if (toolName === "figma_get_variables") {
          return { collections: [] };
        }
        if (toolName === "figma_get_components") {
          return { components: [] };
        }

        throw new Error(`Unexpected tool ${toolName}`);
      }
    });

    await client.getSummary();
    await client.browseDesignSystem({});
    await client.getTokenValues({});

    expect(calls.get("figma_get_file_context")).toBe(1);
    expect(calls.get("figma_get_styles")).toBe(1);
    expect(calls.get("figma_get_variables")).toBe(1);
    expect(calls.get("figma_get_components")).toBe(1);

    vi.advanceTimersByTime(1_001);

    await client.getSummary();

    expect(calls.get("figma_get_file_context")).toBe(2);
    expect(calls.get("figma_get_styles")).toBe(2);
    expect(calls.get("figma_get_variables")).toBe(2);
    expect(calls.get("figma_get_components")).toBe(2);
  });

  it("reuses cached component details and images across repeated kit calls within the ttl window", async () => {
    vi.useFakeTimers();

    const calls = new Map<string, number>();
    const increment = (toolName: string) => {
      calls.set(toolName, (calls.get(toolName) || 0) + 1);
    };

    const client = createFigmaDesignSystemClient({
      cacheTtlMs: 1_000,
      executeTool: async (toolName) => {
        increment(toolName);

        if (toolName === "figma_get_file_context") {
          return { runtimeSessionId: "runtime-1", fileKey: "file-1", fileName: "System", pageName: "Components" };
        }
        if (toolName === "figma_get_styles") {
          return { textStyles: [], paintStyles: [], effectStyles: [], gridStyles: [] };
        }
        if (toolName === "figma_get_variables") {
          return { collections: [] };
        }
        if (toolName === "figma_get_components") {
          return {
            components: [
              {
                id: "node-1",
                key: "key-1",
                name: "Button/Primary",
                setName: "Button",
                nodeType: "COMPONENT",
                width: 120,
                height: 48,
                propertyNames: ["Size", "State"]
              }
            ]
          };
        }
        if (toolName === "figma_get_component_details") {
          return {
            id: "node-1",
            key: "key-1",
            name: "Button/Primary",
            setName: "Button",
            nodeType: "COMPONENT",
            width: 120,
            height: 48,
            propertyNames: ["Size", "State"]
          };
        }
        if (toolName === "figma_get_component_image") {
          return {
            imageRef: "memory://component/node-1",
            dataUrl: "data:image/png;base64,abc"
          };
        }

        throw new Error(`Unexpected tool ${toolName}`);
      }
    });

    await client.getKit({ includeImage: true, componentNames: ["Button"], componentLimit: 10 });
    await client.getKit({ includeImage: true, componentNames: ["Button"], componentLimit: 10 });

    expect(calls.get("figma_get_component_details")).toBe(1);
    expect(calls.get("figma_get_component_image")).toBe(1);

    vi.advanceTimersByTime(1_001);

    await client.getKit({ includeImage: true, componentNames: ["Button"], componentLimit: 10 });

    expect(calls.get("figma_get_component_details")).toBe(2);
    expect(calls.get("figma_get_component_image")).toBe(2);
  });
});
