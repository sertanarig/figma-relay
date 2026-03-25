import type { RuntimeDebugGateway } from "@codex-figma/figma-runtime/src/observability/change-feed.js";
import { getDesignChangesSnapshot } from "@codex-figma/figma-runtime/src/observability/change-feed.js";

export function getDesignChanges({
  runtimeGateway,
  since,
  count
}: {
  runtimeGateway: RuntimeDebugGateway;
  since?: number;
  count?: number;
}) {
  return getDesignChangesSnapshot(runtimeGateway, { since, count });
}
