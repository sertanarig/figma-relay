import { readFile } from "node:fs/promises";
import path from "node:path";

type FetchResponseBody = {
  ok?: boolean;
  bridge?: {
    name?: string;
    version?: string;
  };
};

type FetchResponse = {
  ok: boolean;
  json(): Promise<FetchResponseBody>;
};

type FetchLike = (input: string) => Promise<FetchResponse>;

const DEFAULT_CANDIDATE_URLS = [
  "http://127.0.0.1:3210",
  "http://localhost:3210",
  "http://127.0.0.1:3211",
  "http://localhost:3211",
  "http://127.0.0.1:3212",
  "http://localhost:3212"
];

const STATE_DIR = path.resolve(process.cwd(), ".figma-runtime-mcp");
const ACTIVE_RUNTIME_STATE_PATH = path.join(STATE_DIR, "active-runtime.json");
const BRIDGE_STATE_PATH = path.join(STATE_DIR, "bridge.json");

async function readPersistedBridgeUrlFrom(filePath: string) {
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
  ].filter(Boolean) as string[];
  return [...new Set(urls)];
}

export async function resolveBridgeUrl({
  explicitBridgeUrl,
  fetchImpl = fetch
}: {
  explicitBridgeUrl?: string;
  fetchImpl?: FetchLike;
}) {
  if (explicitBridgeUrl) {
    return explicitBridgeUrl.replace(/\/$/, "");
  }

  const persistedBridgeUrls = await readPersistedBridgeUrls();
  for (const persistedBridgeUrl of persistedBridgeUrls) {
    try {
      const response = await fetchImpl(`${persistedBridgeUrl}/health`);
      if (response.ok) {
        const body = await response.json();
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
      const response = await fetchImpl(`${candidate}/health`);
      if (!response.ok) {
        continue;
      }

      const body = await response.json();
      if (body?.bridge?.name === "figma-runtime-mcp") {
        return candidate;
      }
    } catch {
      // Try the next candidate.
    }
  }

  return DEFAULT_CANDIDATE_URLS[0];
}
