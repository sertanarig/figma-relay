import { resolveBridgeUrl } from "./resolve-bridge-url.mjs";

export async function resolveLiveBridgeUrl() {
  const bridgeUrl = await resolveBridgeUrl();

  try {
    const response = await fetch(`${bridgeUrl}/health`);
    const payload = await response.json().catch(() => null);

    if (!response.ok || !payload?.ok) {
      throw new Error(payload?.message || `Bridge health check failed (${response.status})`);
    }

    return bridgeUrl;
  } catch {
    throw new Error(
      "BRIDGE_REQUIRED: local bridge is unreachable. Run `npm run bridge:up` and reopen Figma Relay if needed."
    );
  }
}
