export type RuntimeHelloMessage = {
  type: "runtime:hello";
  payload: {
    runtimeSessionId: string;
    fileKey: string;
    fileName: string;
    pageName: string;
    capabilities: string[];
  };
};

export type RuntimeReconnectMessage = {
  type: "runtime:reconnect";
  payload: {
    runtimeSessionId: string;
  };
};

export type RuntimeContextMessage = {
  type: "runtime:context";
  payload: {
    runtimeSessionId: string;
    fileName: string;
    pageName: string;
  };
};

export type RuntimeCommandMessage = {
  type: "runtime:command";
  payload: {
    requestId: string;
    text: string;
  };
};

export type RuntimeBridgeMessage =
  | RuntimeHelloMessage
  | RuntimeReconnectMessage
  | RuntimeContextMessage
  | RuntimeCommandMessage;

export function isRuntimeBridgeMessage(value: unknown): value is RuntimeBridgeMessage {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as { type?: unknown };
  return typeof candidate.type === "string" && candidate.type.startsWith("runtime:");
}
