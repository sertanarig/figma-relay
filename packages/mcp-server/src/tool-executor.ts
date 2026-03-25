import { randomUUID } from "node:crypto";
import { getRequiredCapability } from "./tool-capabilities.js";

type BridgeClient = {
  getActiveRuntime?: () => Promise<{
    runtimeSessionId: string;
    capabilities?: string[];
  } | null>;
  sendCommand(request: {
    requestId: string;
    sessionId: string;
    command: string;
    payload: Record<string, unknown>;
  }): Promise<{
    status: string;
    data: unknown;
  }>;
};

export function createToolExecutor({
  bridgeClient,
  sessionId
}: {
  bridgeClient: BridgeClient;
  sessionId?: string;
}) {
  return {
    async execute(toolName: string, args: Record<string, unknown>) {
      const activeRuntime = sessionId
        ? null
        : await bridgeClient.getActiveRuntime?.();
      const resolvedSessionId =
        sessionId || activeRuntime?.runtimeSessionId || "runtime-stdio";
      const requiredCapability = getRequiredCapability(toolName);

      if (
        activeRuntime &&
        requiredCapability &&
        Array.isArray(activeRuntime.capabilities) &&
        !activeRuntime.capabilities.includes(requiredCapability)
      ) {
        throw new Error(
          `Runtime missing required capability: ${requiredCapability} for ${toolName}`
        );
      }

      const result = await bridgeClient.sendCommand({
        requestId: randomUUID(),
        sessionId: resolvedSessionId,
        command: toolName,
        payload: args
      });

      if (result.status !== "succeeded") {
        throw new Error(`Tool execution failed: ${toolName}`);
      }

      return result.data;
    }
  };
}
