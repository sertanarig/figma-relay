type ActiveRuntime = {
  runtimeSessionId: string;
  fileKey?: string;
  fileName?: string;
  pageName?: string;
};

type InlineCommentOptions = {
  includeReplies?: boolean;
  limit?: number;
};

type InlineCommentPayload = {
  message: string;
  nodeId: string;
  x?: number;
  y?: number;
  regionWidth?: number;
  regionHeight?: number;
  commentPinCorner?: "bottom-left" | "bottom-right" | "top-left" | "top-right";
};

type FetchResponse = {
  ok: boolean;
  status: number;
  json(): Promise<any>;
};

type FetchLike = (input: string, init?: {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}) => Promise<FetchResponse>;

function getRequiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required for comments tools`);
  }
  return value;
}

function getFileKey(runtime: ActiveRuntime | null) {
  const fileKey = runtime?.fileKey;
  if (fileKey && fileKey !== "local-file") {
    return fileKey;
  }
  const fallbackFileKey = process.env.FIGMA_FILE_KEY;
  if (fallbackFileKey) {
    return fallbackFileKey;
  }
  throw new Error("Active runtime is missing a real fileKey and FIGMA_FILE_KEY is not set");
}

function createHeaders() {
  return {
    "content-type": "application/json",
    "x-figma-token": getRequiredEnv("FIGMA_ACCESS_TOKEN")
  };
}

function normalizeCommentId(commentId: string) {
  const numericId = Number(commentId);
  if (!Number.isFinite(numericId) || numericId <= 0) {
    throw new Error(`Comment id must be numeric, received '${commentId}'`);
  }
  return numericId;
}

function hasRegion(comment: any) {
  const meta = comment?.client_meta || {};
  return typeof meta?.region_height === "number" && typeof meta?.region_width === "number";
}

export function createFigmaCommentsClient({
  fetchImpl = fetch
}: {
  fetchImpl?: FetchLike;
}) {
  const apiOrigin = (process.env.FIGMA_API_ORIGIN || "https://api.figma.com").replace(/\/$/, "");

  async function fetchComments(runtime: ActiveRuntime | null) {
    const fileKey = getFileKey(runtime);
    const response = await fetchImpl(`${apiOrigin}/v1/files/${fileKey}/comments`, {
      headers: createHeaders()
    });
    const body = await response.json();
    if (!response.ok) {
      throw new Error(body?.message || `Failed to fetch comments (${response.status})`);
    }
    return Array.isArray(body.comments) ? body.comments : [];
  }

  return {
    async getComments(runtime: ActiveRuntime | null, limit = 20) {
      const body = await fetchComments(runtime);
      return {
        runtimeSessionId: runtime?.runtimeSessionId || null,
        comments: body.slice(0, limit)
      };
    },

    async getInlineComments(
      runtime: ActiveRuntime | null,
      nodeId: string,
      options?: InlineCommentOptions
    ) {
      const comments = await fetchComments(runtime);
      const includeReplies = options?.includeReplies === true;
      const limit = typeof options?.limit === "number" ? options.limit : 20;

      const rootComments = comments
        .filter((comment: any) => {
          const parentId = String(comment?.parent_id || "");
          const pinnedNodeId = String(comment?.client_meta?.node_id || "");
          return !parentId && pinnedNodeId === String(nodeId) && hasRegion(comment);
        })
        .slice(0, limit);

      const rootIds = new Set(rootComments.map((comment: any) => String(comment?.id || "")));
      const replies = includeReplies
        ? comments.filter((comment: any) => rootIds.has(String(comment?.parent_id || "")))
        : [];

      return {
        runtimeSessionId: runtime?.runtimeSessionId || null,
        nodeId,
        comments: rootComments.map((comment: any) => ({
          ...comment,
          replies: includeReplies
            ? replies.filter((reply: any) => String(reply?.parent_id || "") === String(comment?.id || ""))
            : undefined
        }))
      };
    },

    async getReplies(runtime: ActiveRuntime | null, commentId: string, limit = 20) {
      const comments = await fetchComments(runtime);
      const replies = comments
        .filter((comment: any) => String(comment?.parent_id || "") === String(commentId))
        .slice(0, limit);
      return {
        runtimeSessionId: runtime?.runtimeSessionId || null,
        commentId,
        replies
      };
    },

    async getThread(runtime: ActiveRuntime | null, commentId: string, limit = 20) {
      const comments = await fetchComments(runtime);
      const root =
        comments.find((comment: any) => String(comment?.id || "") === String(commentId)) ||
        comments.find((comment: any) => String(comment?.parent_id || "") === String(commentId)) ||
        null;
      const replies = comments
        .filter((comment: any) => String(comment?.parent_id || "") === String(commentId))
        .slice(0, limit);

      return {
        runtimeSessionId: runtime?.runtimeSessionId || null,
        commentId,
        root,
        replies
      };
    },

    async getNodeComments(
      runtime: ActiveRuntime | null,
      nodeId: string,
      options?: { includeReplies?: boolean; limit?: number }
    ) {
      const comments = await fetchComments(runtime);
      const includeReplies = options?.includeReplies === true;
      const limit = typeof options?.limit === "number" ? options.limit : 20;

      const rootComments = comments
        .filter((comment: any) => {
          const parentId = String(comment?.parent_id || "");
          const pinnedNodeId = String(comment?.client_meta?.node_id || "");
          return !parentId && pinnedNodeId === String(nodeId);
        })
        .slice(0, limit);

      const rootIds = new Set(rootComments.map((comment: any) => String(comment?.id || "")));
      const replies = includeReplies
        ? comments.filter((comment: any) => rootIds.has(String(comment?.parent_id || "")))
        : [];

      return {
        runtimeSessionId: runtime?.runtimeSessionId || null,
        nodeId,
        comments: rootComments.map((comment: any) => ({
          ...comment,
          replies: includeReplies
            ? replies.filter((reply: any) => String(reply?.parent_id || "") === String(comment?.id || ""))
            : undefined
        }))
      };
    },

    async postComment(runtime: ActiveRuntime | null, payload: {
      message: string;
      nodeId?: string;
      x?: number;
      y?: number;
    }) {
      const fileKey = getFileKey(runtime);
      const response = await fetchImpl(`${apiOrigin}/v1/files/${fileKey}/comments`, {
        method: "POST",
        headers: createHeaders(),
        body: JSON.stringify({
          message: payload.message,
          client_meta: payload.nodeId
            ? {
                node_id: payload.nodeId,
                node_offset: {
                  x: typeof payload.x === "number" ? payload.x : 0,
                  y: typeof payload.y === "number" ? payload.y : 0
                }
              }
            : undefined
        })
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body?.message || `Failed to post comment (${response.status})`);
      }
      return {
        runtimeSessionId: runtime?.runtimeSessionId || null,
        comment: body
      };
    },

    async postInlineComment(runtime: ActiveRuntime | null, payload: InlineCommentPayload) {
      const fileKey = getFileKey(runtime);
      const response = await fetchImpl(`${apiOrigin}/v1/files/${fileKey}/comments`, {
        method: "POST",
        headers: createHeaders(),
        body: JSON.stringify({
          message: payload.message,
          client_meta: {
            node_id: payload.nodeId,
            node_offset: {
              x: typeof payload.x === "number" ? payload.x : 0,
              y: typeof payload.y === "number" ? payload.y : 0
            },
            region_height: typeof payload.regionHeight === "number" ? payload.regionHeight : 24,
            region_width: typeof payload.regionWidth === "number" ? payload.regionWidth : 160,
            comment_pin_corner: payload.commentPinCorner || "bottom-right"
          }
        })
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body?.message || `Failed to post inline comment (${response.status})`);
      }
      return {
        runtimeSessionId: runtime?.runtimeSessionId || null,
        comment: body
      };
    },

    async replyToComment(runtime: ActiveRuntime | null, payload: {
      commentId: string;
      message: string;
    }) {
      const fileKey = getFileKey(runtime);
      const response = await fetchImpl(`${apiOrigin}/v1/files/${fileKey}/comments`, {
        method: "POST",
        headers: createHeaders(),
        body: JSON.stringify({
          message: payload.message,
          comment_id: normalizeCommentId(payload.commentId)
        })
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body?.message || `Failed to reply to comment (${response.status})`);
      }
      return {
        runtimeSessionId: runtime?.runtimeSessionId || null,
        commentId: payload.commentId,
        reply: body
      };
    },

    async deleteComment(runtime: ActiveRuntime | null, commentId: string) {
      const fileKey = getFileKey(runtime);
      const response = await fetchImpl(`${apiOrigin}/v1/files/${fileKey}/comments/${commentId}`, {
        method: "DELETE",
        headers: createHeaders()
      });
      if (!response.ok && response.status !== 204) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.message || `Failed to delete comment (${response.status})`);
      }
      return {
        runtimeSessionId: runtime?.runtimeSessionId || null,
        commentId,
        deleted: true
      };
    }
  };
}
