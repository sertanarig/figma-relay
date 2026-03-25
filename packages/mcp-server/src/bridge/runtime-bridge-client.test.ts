import { describe, expect, it, vi } from "vitest";
import { createRuntimeBridgeClient } from "./runtime-bridge-client.js";

describe("runtime bridge client", () => {
  it("reads the active runtime session from the bridge", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        ok: true,
        runtime: {
          runtimeSessionId: "runtime-live",
          fileName: "Playground"
        }
      })
    }));

    const client = createRuntimeBridgeClient({
      bridgeUrl: "http://127.0.0.1:3210",
      fetchImpl: fetchMock
    });

    const runtime = await client.getActiveRuntime();

    expect(fetchMock).toHaveBeenCalledWith("http://127.0.0.1:3210/runtime/active");
    expect(runtime).toEqual({
      runtimeSessionId: "runtime-live",
      fileName: "Playground"
    });
  });

  it("posts typed commands to the local bridge", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        ok: true,
        result: {
          status: "succeeded",
          data: {
            connected: true
          }
        }
      })
    }));

    const client = createRuntimeBridgeClient({
      bridgeUrl: "http://127.0.0.1:3210",
      fetchImpl: fetchMock
    });

    const result = await client.sendCommand({
      requestId: "req-1",
      sessionId: "runtime-1",
      command: "figma_get_status",
      payload: {}
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:3210/command",
      expect.objectContaining({
        method: "POST"
      })
    );
    expect(result).toEqual({
      status: "succeeded",
      data: {
        connected: true
      }
    });
  });

  it("normalizes legacy bridge-style command responses", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        ok: true,
        result: {
          ok: true,
          data: {
            connected: true
          }
        }
      })
    }));

    const client = createRuntimeBridgeClient({
      bridgeUrl: "http://127.0.0.1:3210",
      fetchImpl: fetchMock
    });

    const result = await client.sendCommand({
      requestId: "req-2",
      sessionId: "runtime-1",
      command: "figma_get_status",
      payload: {}
    });

    expect(result).toEqual({
      status: "succeeded",
      data: {
        connected: true
      }
    });
  });
});
