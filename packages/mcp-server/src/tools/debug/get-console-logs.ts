import type { RuntimeDebugGateway } from "@codex-figma/figma-runtime/src/observability/change-feed.js";

export function getConsoleLogs({
  runtimeGateway,
  level,
  count
}: {
  runtimeGateway: RuntimeDebugGateway;
  level?: string;
  count?: number;
}) {
  return runtimeGateway.getConsoleLogs
    ? runtimeGateway.getConsoleLogs({ level, count })
    : null;
}
