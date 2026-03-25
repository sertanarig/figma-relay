import { describe, expect, it } from "vitest";
import { createSessionManager } from "./session-manager.js";

describe("session manager", () => {
  it("connects and resolves an active runtime session", () => {
    const manager = createSessionManager();

    manager.connectRuntime({
      runtimeSessionId: "runtime-1",
      fileKey: "file-1",
      fileName: "Design System",
      pageName: "Buttons",
      capabilities: ["runtime.status", "variables.write"]
    });

    const active = manager.getActiveRuntime();
    expect(active?.runtimeSessionId).toBe("runtime-1");
    expect(active?.capabilities).toEqual(["runtime.status", "variables.write"]);
  });

  it("updates runtime capabilities", () => {
    const manager = createSessionManager();

    manager.connectRuntime({
      runtimeSessionId: "runtime-1",
      fileKey: "file-1",
      fileName: "Design System",
      pageName: "Buttons",
      capabilities: ["runtime.status"]
    });

    manager.updateCapabilities("runtime-1", ["runtime.status", "components.write"]);

    expect(manager.getActiveRuntime()?.capabilities).toEqual([
      "runtime.status",
      "components.write"
    ]);
  });

  it("disconnects runtime sessions", () => {
    const manager = createSessionManager();

    manager.connectRuntime({
      runtimeSessionId: "runtime-1",
      fileKey: "file-1",
      fileName: "Design System",
      pageName: "Buttons",
      capabilities: ["runtime.status"]
    });

    manager.disconnectRuntime("runtime-1");

    expect(manager.getActiveRuntime()).toBeNull();
  });
});
