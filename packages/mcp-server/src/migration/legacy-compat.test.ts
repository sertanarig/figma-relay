import { describe, expect, it } from "vitest";
import { createLegacyBridgeShim } from "./legacy-compat.js";

describe("legacy bridge compatibility", () => {
  it("redirects legacy prompt traffic into MCP-first commands", () => {
    const shim = createLegacyBridgeShim();

    expect(
      shim.translate({
        text: "figma bir kare çiz 240x240 mavi"
      })
    ).toEqual({
      mode: "legacy-shim",
      target: "mcp",
      command: "figma_create_node"
    });
  });
});
