import type { RuntimeReadGateway } from "./types.js";

export function captureScreenshotSnapshot(
  gateway: RuntimeReadGateway,
  input: {
    format: string;
    scale: number;
  }
) {
  return gateway.captureScreenshot ? gateway.captureScreenshot(input) : null;
}
