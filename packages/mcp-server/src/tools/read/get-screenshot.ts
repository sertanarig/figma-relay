import type { RuntimeReadGateway } from "@codex-figma/figma-runtime/src/commands/read/types.js";
import { captureScreenshotSnapshot } from "@codex-figma/figma-runtime/src/commands/read/get-screenshot.js";

export function getScreenshot({
  runtimeGateway,
  format,
  scale
}: {
  runtimeGateway: RuntimeReadGateway;
  format: string;
  scale: number;
}) {
  return captureScreenshotSnapshot(runtimeGateway, { format, scale });
}
