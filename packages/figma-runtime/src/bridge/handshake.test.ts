import { describe, expect, it } from "vitest";
import {
  buildRuntimeHello,
  buildRuntimeReconnect
} from "./handshake.js";

describe("runtime handshake", () => {
  it("builds a typed hello payload", () => {
    const hello = buildRuntimeHello({
      runtimeSessionId: "runtime-1",
      fileKey: "file-1",
      fileName: "Core UI",
      pageName: "Buttons",
      capabilities: ["runtime.status", "variables.write"]
    });

    expect(hello.type).toBe("runtime:hello");
    expect(hello.payload.runtimeSessionId).toBe("runtime-1");
  });

  it("builds a reconnect event payload", () => {
    const reconnect = buildRuntimeReconnect("runtime-1");

    expect(reconnect.type).toBe("runtime:reconnect");
    expect(reconnect.payload.runtimeSessionId).toBe("runtime-1");
  });
});
