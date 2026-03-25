function roundToSingleDecimal(value) {
  return Math.round(value * 10) / 10;
}

export function summarizeDurations(samples) {
  if (samples.length === 0) {
    return {
      count: 0,
      minMs: 0,
      maxMs: 0,
      avgMs: 0,
      p95Ms: 0
    };
  }

  const sorted = [...samples].sort((left, right) => left - right);
  const index = Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1);
  const total = sorted.reduce((sum, value) => sum + value, 0);

  return {
    count: sorted.length,
    minMs: sorted[0],
    maxMs: sorted[sorted.length - 1],
    avgMs: roundToSingleDecimal(total / sorted.length),
    p95Ms: sorted[index]
  };
}
