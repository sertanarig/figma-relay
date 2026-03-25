import { afterEach, describe, expect, it, vi } from "vitest";
import { createFigmaVerificationReportClient } from "./figma-verification-report-client.js";

afterEach(() => {
  vi.useRealTimers();
});

describe("figma verification report client", () => {
  it("builds a compact verification payload", async () => {
    const client = createFigmaVerificationReportClient({
      executeTool: async (toolName, args) => {
        if (toolName === "figma_get_node") {
          return {
            runtimeSessionId: "runtime-1",
            node: {
              id: String(args.nodeId),
              name: "Button/Primary",
              type: "FRAME",
              visible: true,
              locked: false,
              x: 10,
              y: 20,
              width: 120,
              height: 48,
              layout: { layoutMode: "HORIZONTAL" }
            }
          };
        }

        if (toolName === "figma_get_bound_variables") {
          return {
            bindings: {
              width: {
                id: "V:1",
                name: "viewport/width"
              }
            }
          };
        }

        if (toolName === "figma_take_screenshot") {
          return {
            format: "png",
            imageRef: "memory://verification-1",
            dataUrl: "data:image/png;base64,abc",
            bytesLength: 123
          };
        }

        if (toolName === "figma_get_children") {
          return {
            children: [{ id: "1:2", name: "Label", type: "TEXT" }]
          };
        }

        throw new Error(`Unexpected tool ${toolName}`);
      }
    });

    const result = await client.generate({
      nodeId: "123:456",
      includeChildren: true,
      includeScreenshot: true
    });

    expect(result).toMatchObject({
      runtimeSessionId: "runtime-1",
      summary: {
        score: 100,
        findings: 0,
        bindingCount: 1,
        childCount: 1,
        recommendations: 0,
        severityBreakdown: {
          warning: 0,
          info: 0
        },
        readinessStatus: "ready"
      },
      node: {
        id: "123:456",
        name: "Button/Primary",
        type: "FRAME"
      },
      bindings: {
        width: {
          id: "V:1",
          name: "viewport/width"
        }
      },
      children: {
        count: 1
      },
      screenshot: {
        imageRef: "memory://verification-1",
        bytesLength: 123
      },
      findings: [],
      recommendations: []
    });
  });

  it("accepts runtime child payloads returned as nodes", async () => {
    const client = createFigmaVerificationReportClient({
      executeTool: async (toolName, args) => {
        if (toolName === "figma_get_node") {
          return {
            runtimeSessionId: "runtime-1",
            node: {
              id: String(args.nodeId),
              name: "Section/Buttons",
              type: "FRAME",
              visible: true,
              locked: false,
              x: 0,
              y: 0,
              width: 100,
              height: 100,
              layout: { layoutMode: "VERTICAL" }
            }
          };
        }
        if (toolName === "figma_get_bound_variables") {
          return { bindings: { width: { id: "V:1" } } };
        }
        if (toolName === "figma_get_children") {
          return {
            nodes: [{ id: "1:2", name: "Button/Primary", type: "COMPONENT" }]
          };
        }
        throw new Error(`Unexpected tool ${toolName}`);
      }
    });

    const result = await client.generate({
      nodeId: "123:456",
      includeChildren: true,
      includeScreenshot: false
    });

    expect(result.summary.childCount).toBe(1);
    expect(result.summary.findings).toBe(0);
  });

  it("reports warnings for hidden unbound containers", async () => {
    const client = createFigmaVerificationReportClient({
      executeTool: async (toolName, args) => {
        if (toolName === "figma_get_node") {
          return {
            runtimeSessionId: "runtime-1",
            node: {
              id: String(args.nodeId),
              name: "Hidden Frame",
              type: "FRAME",
              visible: false,
              locked: true,
              x: 0,
              y: 0,
              width: 100,
              height: 100,
              layout: { layoutMode: "VERTICAL" }
            }
          };
        }

        if (toolName === "figma_get_bound_variables") {
          return { bindings: {} };
        }

        if (toolName === "figma_get_children") {
          return { children: [] };
        }

        if (toolName === "figma_take_screenshot") {
          throw new Error("capture failed");
        }

        throw new Error(`Unexpected tool ${toolName}`);
      }
    });

    const result = await client.generate({
      nodeId: "123:456",
      includeChildren: true,
      includeScreenshot: true
    });

    expect(result.summary.findings).toBe(5);
    expect(result.summary.score).toBe(24);
    expect(result.summary.recommendations).toBe(5);
    expect(result.summary.severityBreakdown).toEqual({
      warning: 3,
      info: 2
    });
    expect(result.summary.readinessStatus).toBe("needs-attention");
    expect(result.findings).toEqual([
      { category: "visibility", severity: "warning", message: "Node is hidden." },
      { category: "locking", severity: "info", message: "Node is locked." },
      { category: "structure", severity: "info", message: "Container has no children." },
      { category: "bindings", severity: "warning", message: "Layout-capable node has no variable bindings." },
      { category: "screenshot", severity: "warning", message: "Screenshot could not be captured." }
    ]);
    expect(result.recommendations).toEqual([
      "Reveal the node before validation or handoff.",
      "Unlock the node if edits or automated adjustments are expected.",
      "Verify whether the container should hold documented child content.",
      "Bind responsive or spacing variables to layout fields for consistency.",
      "Retry screenshot capture after ensuring the node is visible and within the page."
    ]);
  });

  it("reuses cached verification payloads within the ttl window", async () => {
    vi.useFakeTimers();

    const counters = {
      node: 0,
      bindings: 0,
      screenshot: 0,
      children: 0
    };

    const client = createFigmaVerificationReportClient({
      cacheTtlMs: 1_000,
      executeTool: async (toolName, args) => {
        if (toolName === "figma_get_node") {
          counters.node += 1;
          return {
            runtimeSessionId: "runtime-1",
            node: {
              id: String(args.nodeId),
              name: "Button/Primary",
              type: "FRAME",
              visible: true,
              locked: false,
              x: 10,
              y: 20,
              width: 120,
              height: 48,
              layout: { layoutMode: "HORIZONTAL" }
            }
          };
        }

        if (toolName === "figma_get_bound_variables") {
          counters.bindings += 1;
          return { bindings: { width: { id: "V:1", name: "viewport/width" } } };
        }

        if (toolName === "figma_take_screenshot") {
          counters.screenshot += 1;
          return {
            format: "png",
            imageRef: "memory://verification-1",
            dataUrl: "data:image/png;base64,abc",
            bytesLength: 123
          };
        }

        if (toolName === "figma_get_children") {
          counters.children += 1;
          return {
            children: [{ id: "1:2", name: "Label", type: "TEXT" }]
          };
        }

        throw new Error(`Unexpected tool ${toolName}`);
      }
    });

    await client.generate({
      nodeId: "123:456",
      includeChildren: true,
      includeScreenshot: true
    });
    await client.generate({
      nodeId: "123:456",
      includeChildren: true,
      includeScreenshot: true
    });

    expect(counters).toEqual({
      node: 1,
      bindings: 1,
      screenshot: 1,
      children: 1
    });

    vi.advanceTimersByTime(1_001);

    await client.generate({
      nodeId: "123:456",
      includeChildren: true,
      includeScreenshot: true
    });

    expect(counters).toEqual({
      node: 2,
      bindings: 2,
      screenshot: 2,
      children: 2
    });
  });
});
