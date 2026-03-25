import { describe, expect, it } from "vitest";
import { createSessionManager } from "../../runtime/session-manager.js";
import { getStatus } from "./get-status.js";
import { listOpenFiles } from "./list-open-files.js";
import { reconnectRuntime } from "./reconnect.js";

describe("runtime tools", () => {
  it("returns disconnected status when no runtime is active", () => {
    const sessionManager = createSessionManager();

    expect(getStatus({ sessionManager })).toEqual({
      connected: false,
      runtimeSessionId: null,
      capabilities: []
    });
  });

  it("lists open files from active runtimes", () => {
    const sessionManager = createSessionManager();
    sessionManager.connectRuntime({
      runtimeSessionId: "runtime-1",
      fileKey: "file-1",
      fileName: "Core UI",
      pageName: "Buttons",
      capabilities: ["runtime.status"]
    });

    expect(listOpenFiles({ sessionManager })).toEqual([
      {
        runtimeSessionId: "runtime-1",
        fileKey: "file-1",
        fileName: "Core UI",
        pageName: "Buttons"
      }
    ]);
  });

  it("returns reconnect instructions for the active runtime", () => {
    const sessionManager = createSessionManager();
    sessionManager.connectRuntime({
      runtimeSessionId: "runtime-1",
      fileKey: "file-1",
      fileName: "Core UI",
      pageName: "Buttons",
      capabilities: ["runtime.status"]
    });

    expect(reconnectRuntime({ sessionManager })).toEqual({
      requested: true,
      runtimeSessionId: "runtime-1"
    });
  });
});
