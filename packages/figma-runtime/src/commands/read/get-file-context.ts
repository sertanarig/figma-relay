import type { RuntimeReadGateway } from "./types.js";

export function getFileContextSnapshot(gateway: RuntimeReadGateway) {
  return gateway.getFileContext ? gateway.getFileContext() : null;
}
