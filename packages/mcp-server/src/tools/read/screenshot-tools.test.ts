import { describe, expect, it } from "vitest";
import { getFileContext } from "./get-file-context.js";
import { getScreenshot } from "./get-screenshot.js";

describe("screenshot and file context tools", () => {
  it("returns file and page context from the runtime gateway", () => {
    const runtimeGateway = {
      getFileContext() {
        return {
          runtimeSessionId: "runtime-1",
          fileKey: "file-1",
          fileName: "Core UI",
          pageName: "Buttons"
        };
      }
    };

    expect(getFileContext({ runtimeGateway })).toEqual({
      runtimeSessionId: "runtime-1",
      fileKey: "file-1",
      fileName: "Core UI",
      pageName: "Buttons"
    });
  });

  it("returns a screenshot payload reference", () => {
    const runtimeGateway = {
      captureScreenshot() {
        return {
          runtimeSessionId: "runtime-1",
          format: "png",
          scale: 2,
          imageRef: "memory://shot-1"
        };
      }
    };

    expect(getScreenshot({ runtimeGateway, format: "png", scale: 2 })).toEqual({
      runtimeSessionId: "runtime-1",
      format: "png",
      scale: 2,
      imageRef: "memory://shot-1"
    });
  });
});
