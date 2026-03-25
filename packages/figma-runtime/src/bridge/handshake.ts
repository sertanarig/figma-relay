import type {
  RuntimeHelloMessage,
  RuntimeReconnectMessage
} from "./channel.js";

type RuntimeHelloInput = RuntimeHelloMessage["payload"];

export function buildRuntimeHello(payload: RuntimeHelloInput): RuntimeHelloMessage {
  return {
    type: "runtime:hello",
    payload
  };
}

export function buildRuntimeReconnect(runtimeSessionId: string): RuntimeReconnectMessage {
  return {
    type: "runtime:reconnect",
    payload: {
      runtimeSessionId
    }
  };
}
