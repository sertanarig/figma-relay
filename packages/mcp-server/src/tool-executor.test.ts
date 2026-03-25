import { describe, expect, it, vi } from "vitest";
import { createToolExecutor } from "./tool-executor.js";

describe("tool executor", () => {
  it("forwards tool calls to the runtime bridge client", async () => {
    const sendCommand = vi.fn(async () => ({
      status: "succeeded",
      data: { connected: true }
    }));

    const executor = createToolExecutor({
      bridgeClient: { sendCommand },
      sessionId: "runtime-1"
    });

    const result = await executor.execute("figma_get_status", {});

    expect(sendCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        command: "figma_get_status",
        sessionId: "runtime-1"
      })
    );
    expect(result).toEqual({ connected: true });
  });

  it("falls back to the active runtime session when no session override is provided", async () => {
    const sendCommand = vi.fn(async () => ({
      status: "succeeded",
      data: { connected: true }
    }));
    const getActiveRuntime = vi.fn(async () => ({
      runtimeSessionId: "runtime-live",
      capabilities: ["runtime.status"]
    }));

    const executor = createToolExecutor({
      bridgeClient: { sendCommand, getActiveRuntime }
    });

    await executor.execute("figma_get_status", {});

    expect(getActiveRuntime).toHaveBeenCalledTimes(1);
    expect(sendCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: "runtime-live"
      })
    );
  });

  it("rejects tool execution when the active runtime lacks the required capability", async () => {
    const sendCommand = vi.fn(async () => ({
      status: "succeeded",
      data: {}
    }));
    const getActiveRuntime = vi.fn(async () => ({
      runtimeSessionId: "runtime-live",
      capabilities: ["runtime.status"]
    }));

    const executor = createToolExecutor({
      bridgeClient: { sendCommand, getActiveRuntime }
    });

    await expect(executor.execute("figma_create_node", {})).rejects.toThrow(
      "Runtime missing required capability: node.write"
    );
    expect(sendCommand).not.toHaveBeenCalled();
  });
});
