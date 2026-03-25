import { describe, expect, it } from "vitest";
import { getConsoleLogs } from "./get-console-logs.js";
import { takeVerificationScreenshot } from "./take-screenshot.js";

describe("verification tools", () => {
  it("returns recent console logs", () => {
    const runtimeGateway = {
      getConsoleLogs(input: { level?: string; count?: number }) {
        return {
          runtimeSessionId: "runtime-1",
          logs: [
            {
              id: "log-1",
              level: input.level ?? "info",
              message: "Command executed",
              timestamp: 1710698400000
            }
          ].slice(0, input.count ?? 20)
        };
      }
    };

    expect(getConsoleLogs({ runtimeGateway, level: "info", count: 1 })).toEqual({
      runtimeSessionId: "runtime-1",
      logs: [
        {
          id: "log-1",
          level: "info",
          message: "Command executed",
          timestamp: 1710698400000
        }
      ]
    });
  });

  it("returns a verification screenshot payload", () => {
    const runtimeGateway = {
      captureVerificationScreenshot(input: { format: string; scale: number }) {
        return {
          runtimeSessionId: "runtime-1",
          format: input.format,
          scale: input.scale,
          imageRef: "memory://verification-1"
        };
      }
    };

    expect(
      takeVerificationScreenshot({
        runtimeGateway,
        format: "png",
        scale: 2
      })
    ).toEqual({
      runtimeSessionId: "runtime-1",
      format: "png",
      scale: 2,
      imageRef: "memory://verification-1"
    });
  });
});
