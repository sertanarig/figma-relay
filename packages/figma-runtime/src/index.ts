export const runtimeVersion = "0.1.0";

export { buildRuntimeHello, buildRuntimeReconnect } from "./bridge/handshake.js";
export { isRuntimeBridgeMessage } from "./bridge/channel.js";
