type CommandRequest = {
  requestId: string;
  sessionId: string;
  command: string;
  payload: Record<string, unknown>;
};

type FetchResponseBody = {
  ok?: boolean;
  result?: {
    status?: string;
    ok?: boolean;
    message?: string;
    data: unknown;
  };
  runtime?: ActiveRuntime | null;
  message?: string;
};

type FetchResponse = {
  ok: boolean;
  json(): Promise<FetchResponseBody>;
};

type ActiveRuntime = {
  runtimeSessionId: string;
  fileKey?: string;
  fileName?: string;
  pageName?: string;
  capabilities?: string[];
  updatedAt?: string;
};

type FetchLike = (
  input: string,
  init?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  }
) => Promise<FetchResponse>;

export function createRuntimeBridgeClient({
  bridgeUrl,
  fetchImpl = fetch
}: {
  bridgeUrl: string;
  fetchImpl?: FetchLike;
}) {
  return {
    async getActiveRuntime() {
      const response = await fetchImpl(`${bridgeUrl}/runtime/active`);
      const body = await response.json();

      if (!response.ok || !body.ok) {
        throw new Error(body.message || "Failed to fetch active runtime");
      }

      return body.runtime || null;
    },

    async sendCommand(request: CommandRequest) {
      const response = await fetchImpl(`${bridgeUrl}/command`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(request)
      });

      const body = await response.json();

      if (!response.ok || !body.ok || !body.result) {
        throw new Error(body.message || "Bridge command failed");
      }

      return {
        status: body.result.status || (body.result.ok === false ? "failed" : "succeeded"),
        data: body.result.data
      };
    }
  };
}
