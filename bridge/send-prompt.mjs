import { resolveBridgeUrl } from "../scripts/resolve-bridge-url.mjs";

const text = process.argv.slice(2).join(" ").trim();

if (!text) {
  console.error("Usage: node bridge/send-prompt.mjs \"figma bir kare çiz 240x240 mavi\"");
  process.exit(1);
}

try {
  const bridgeUrl = await resolveBridgeUrl();
  const response = await fetch(`${bridgeUrl}/prompt`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text })
  });
  const data = await response.json();
  if (!response.ok || !data.ok) {
    console.error("Bridge error:", data.message || response.statusText);
    process.exit(1);
  }

  const result = data.result || {};
  if (!result.ok) {
    console.error("Figma execution failed:", result.message || "Unknown error");
    process.exit(2);
  }

  console.log(result.message || "Legacy bridge shim forwarded request into MCP-first flow.");
} catch (error) {
  console.error("Request failed:", error instanceof Error ? error.message : String(error));
  process.exit(1);
}
