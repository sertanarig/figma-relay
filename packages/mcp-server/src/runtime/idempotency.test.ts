import { describe, expect, it } from "vitest";
import { createIdempotencyStore } from "./idempotency-store.js";
import { assertFreshSelection } from "@codex-figma/figma-runtime/src/guards/stale-state.js";

describe("idempotency and stale-state", () => {
  it("deduplicates repeated operation ids", () => {
    const store = createIdempotencyStore();

    expect(store.record("op-1", { ok: true })).toEqual({ accepted: true, replay: null });
    expect(store.record("op-1", { ok: true })).toEqual({
      accepted: false,
      replay: { ok: true }
    });
  });

  it("throws when a selection fingerprint is stale", () => {
    expect(() =>
      assertFreshSelection({
        expectedSelectionFingerprint: "selection-a",
        currentSelectionFingerprint: "selection-b"
      })
    ).toThrowError("STALE_SELECTION");
  });

  it("passes when the selection fingerprint is current", () => {
    expect(() =>
      assertFreshSelection({
        expectedSelectionFingerprint: "selection-a",
        currentSelectionFingerprint: "selection-a"
      })
    ).not.toThrow();
  });
});
