import { describe, expect, it } from "vitest";
import { summarizeDurations } from "./stress-metrics.js";

describe("stress metrics", () => {
  it("summarizes latency samples with p95", () => {
    const result = summarizeDurations([12, 10, 15, 40, 22, 18, 14, 13, 11, 19]);

    expect(result).toEqual({
      count: 10,
      minMs: 10,
      maxMs: 40,
      avgMs: 17.4,
      p95Ms: 40
    });
  });

  it("returns zeros for empty samples", () => {
    expect(summarizeDurations([])).toEqual({
      count: 0,
      minMs: 0,
      maxMs: 0,
      avgMs: 0,
      p95Ms: 0
    });
  });
});
