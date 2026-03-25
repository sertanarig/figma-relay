import { describe, expect, it } from "vitest";
import {
  capabilitySchema,
  errorCodeSchema,
  requestEnvelopeSchema,
  successResponseEnvelopeSchema
} from "../index.js";

describe("protocol schemas", () => {
  it("validates a request envelope", () => {
    const result = requestEnvelopeSchema.parse({
      requestId: "req-123",
      sessionId: "session-123",
      command: "figma_get_status",
      payload: { verbose: true }
    });

    expect(result.command).toBe("figma_get_status");
  });

  it("validates a success response envelope", () => {
    const result = successResponseEnvelopeSchema.parse({
      requestId: "req-123",
      sessionId: "session-123",
      status: "succeeded",
      data: { ok: true }
    });

    expect(result.status).toBe("succeeded");
  });

  it("limits error codes to known values", () => {
    expect(() => errorCodeSchema.parse("NOT_REAL")).toThrow();
    expect(errorCodeSchema.parse("RUNTIME_NOT_CONNECTED")).toBe("RUNTIME_NOT_CONNECTED");
  });

  it("validates reported runtime capabilities", () => {
    const result = capabilitySchema.parse("variables.write");

    expect(result).toBe("variables.write");
  });
});
