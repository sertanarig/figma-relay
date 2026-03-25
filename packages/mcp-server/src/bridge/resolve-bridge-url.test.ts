import { describe, expect, it, vi } from "vitest";
import { resolveBridgeUrl } from "./resolve-bridge-url.js";

vi.mock("node:fs/promises", () => ({
  readFile: vi.fn()
}));

const { readFile } = await import("node:fs/promises");

describe("resolveBridgeUrl", () => {
  it("returns the explicit bridge url when provided", async () => {
    vi.mocked(readFile).mockRejectedValueOnce(new Error("missing"));
    const fetchMock = vi.fn();

    const result = await resolveBridgeUrl({
      explicitBridgeUrl: "http://127.0.0.1:3211/",
      fetchImpl: fetchMock
    });

    expect(result).toBe("http://127.0.0.1:3211");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("finds the codex bridge across candidate ports", async () => {
    vi.mocked(readFile).mockRejectedValueOnce(new Error("missing"));
    const fetchMock = vi.fn(async (input: string) => {
      if (input === "http://127.0.0.1:3211/health") {
        return {
          ok: true,
          json: async () => ({
            ok: true,
            bridge: {
              name: "figma-runtime-mcp",
              version: "0.2.0"
            }
          })
        };
      }

      return {
        ok: false,
        json: async () => ({ ok: false })
      };
    });

    const result = await resolveBridgeUrl({
      fetchImpl: fetchMock
    });

    expect(result).toBe("http://127.0.0.1:3211");
  });

  it("falls back to the default bridge url when no candidate matches", async () => {
    vi.mocked(readFile).mockRejectedValueOnce(new Error("missing"));
    const fetchMock = vi.fn(async () => {
      throw new Error("offline");
    });

    const result = await resolveBridgeUrl({
      fetchImpl: fetchMock
    });

    expect(result).toBe("http://127.0.0.1:3210");
  });

  it("prefers the persisted active bridge url when healthy", async () => {
    vi.mocked(readFile).mockResolvedValueOnce(
      JSON.stringify({
        bridge: {
          url: "http://127.0.0.1:3211"
        }
      })
    );
    const fetchMock = vi.fn(async (input: string) => {
      if (input === "http://127.0.0.1:3211/health") {
        return {
          ok: true,
          json: async () => ({
            ok: true,
            bridge: {
              name: "figma-runtime-mcp",
              version: "0.2.0"
            }
          })
        };
      }

      return {
        ok: false,
        json: async () => ({ ok: false })
      };
    });

    const result = await resolveBridgeUrl({
      fetchImpl: fetchMock
    });

    expect(result).toBe("http://127.0.0.1:3211");
    expect(fetchMock).toHaveBeenCalledWith("http://127.0.0.1:3211/health");
  });
});
