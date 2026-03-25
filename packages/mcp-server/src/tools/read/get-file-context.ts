import type { RuntimeReadGateway } from "@codex-figma/figma-runtime/src/commands/read/types.js";
import { getFileContextSnapshot } from "@codex-figma/figma-runtime/src/commands/read/get-file-context.js";

export function getFileContext({
  runtimeGateway
}: {
  runtimeGateway: RuntimeReadGateway;
}) {
  return getFileContextSnapshot(runtimeGateway);
}
