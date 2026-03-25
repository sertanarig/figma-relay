import { readFile } from "node:fs/promises";
import path from "node:path";

const DEFAULT_CANDIDATE_URLS = [
  "http://127.0.0.1:3210",
  "http://localhost:3210",
  "http://127.0.0.1:3211",
  "http://localhost:3211",
  "http://127.0.0.1:3212",
  "http://localhost:3212"
];

const STATE_DIR = path.join(process.cwd(), ".figma-runtime-mcp");
const ACTIVE_RUNTIME_STATE_PATH = path.join(STATE_DIR, "active-runtime.json");
const BRIDGE_STATE_PATH = path.join(STATE_DIR, "bridge.json");

async function readPersistedBridgeUrlFrom(filePath) {
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);
    const bridgeUrl = typeof parsed?.bridge?.url === "string" ? parsed.bridge.url.trim() : "";
    if (bridgeUrl) {
      return bridgeUrl.replace(/\/$/, "");
    }
    const url = typeof parsed?.url === "string" ? parsed.url.trim() : "";
    return url ? url.replace(/\/$/, "") : null;
  } catch {
    return null;
  }
}

async function readPersistedBridgeUrls() {
  const urls = [
    await readPersistedBridgeUrlFrom(ACTIVE_RUNTIME_STATE_PATH),
    await readPersistedBridgeUrlFrom(BRIDGE_STATE_PATH)
  ].filter(Boolean);
  return [...new Set(urls)];
}

export async function resolveBridgeUrl(explicitBridgeUrl = process.env.CODEX_FIGMA_BRIDGE_URL) {
  if (explicitBridgeUrl) {
    return explicitBridgeUrl.replace(/\/$/, "");
  }

  const persistedBridgeUrls = await readPersistedBridgeUrls();
  for (const persistedBridgeUrl of persistedBridgeUrls) {
    try {
      const response = await fetch(`${persistedBridgeUrl}/health`);
      if (response.ok) {
        const body = await response.json().catch(() => null);
        if (body?.bridge?.name === "figma-runtime-mcp") {
          return persistedBridgeUrl;
        }
      }
    } catch {
      // Fall through to the next candidate.
    }
  }

  for (const candidate of DEFAULT_CANDIDATE_URLS) {
    try {
      const response = await fetch(`${candidate}/health`);
      if (!response.ok) {
        continue;
      }

      const body = await response.json().catch(() => null);
      if (body?.bridge?.name === "figma-runtime-mcp") {
        return candidate;
      }
    } catch {
      // Try the next candidate.
    }
  }

  return DEFAULT_CANDIDATE_URLS[0];
}
