import type { RuntimeDebugGateway } from "@codex-figma/figma-runtime/src/observability/change-feed.js";

export function takeVerificationScreenshot({
  runtimeGateway,
  format,
  scale
}: {
  runtimeGateway: RuntimeDebugGateway;
  format: string;
  scale: number;
}) {
  return runtimeGateway.captureVerificationScreenshot
    ? runtimeGateway.captureVerificationScreenshot({ format, scale })
    : null;
}
