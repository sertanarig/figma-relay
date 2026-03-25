import { describe, expect, it } from "vitest";
import { protocolVersion } from "@codex-figma/protocol";
import { toolRegistry } from "@codex-figma/tool-definitions";

describe("mcp-server workspace smoke test", () => {
  it("wires protocol and tool definitions packages", () => {
    expect(protocolVersion).toBeDefined();
    expect(Array.isArray(toolRegistry)).toBe(true);
  });
});
