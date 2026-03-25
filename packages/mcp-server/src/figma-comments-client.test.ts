import { describe, expect, it, vi } from "vitest";
import { createFigmaCommentsClient } from "./figma-comments-client.js";

describe("figma comments client", () => {
  it("fetches comments for an active file", async () => {
    process.env.FIGMA_ACCESS_TOKEN = "token";
    delete process.env.FIGMA_FILE_KEY;
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        comments: [{ id: "comment-1", message: "Hello" }]
      })
    }));

    const client = createFigmaCommentsClient({ fetchImpl: fetchMock as any });
    const result = await client.getComments({ runtimeSessionId: "runtime-1", fileKey: "file-key" }, 10);

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.figma.com/v1/files/file-key/comments",
      expect.objectContaining({ headers: expect.objectContaining({ "x-figma-token": "token" }) })
    );
    expect(result.comments).toHaveLength(1);
  });

  it("posts and deletes comments", async () => {
    process.env.FIGMA_ACCESS_TOKEN = "token";
    delete process.env.FIGMA_FILE_KEY;
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: "1686061555", message: "Hello" })
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: async () => ({})
      });

    const client = createFigmaCommentsClient({ fetchImpl: fetchMock as any });
    const posted = await client.postComment(
      { runtimeSessionId: "runtime-1", fileKey: "file-key" },
      { message: "Hello", nodeId: "123:456", x: 12, y: 20 }
    );
    const deleted = await client.deleteComment(
      { runtimeSessionId: "runtime-1", fileKey: "file-key" },
      "1686061555"
    );

    expect(posted.comment.id).toBe("1686061555");
    expect(deleted.deleted).toBe(true);
  });

  it("fetches replies and posts a reply", async () => {
    process.env.FIGMA_ACCESS_TOKEN = "token";
    delete process.env.FIGMA_FILE_KEY;
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          comments: [
            {
              id: "reply-1",
              parent_id: "1686061555",
              message: "Reply"
            },
            {
              id: "1686061555",
              parent_id: "",
              message: "Root"
            }
          ]
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: "reply-2", message: "Thanks" })
      });

    const client = createFigmaCommentsClient({ fetchImpl: fetchMock as any });
    const replies = await client.getReplies(
      { runtimeSessionId: "runtime-1", fileKey: "file-key" },
      "1686061555",
      10
    );
    const reply = await client.replyToComment(
      { runtimeSessionId: "runtime-1", fileKey: "file-key" },
      { commentId: "1686061555", message: "Thanks" }
    );

    expect(replies.replies).toHaveLength(1);
    expect(reply.reply.id).toBe("reply-2");
    expect(fetchMock).toHaveBeenLastCalledWith(
      "https://api.figma.com/v1/files/file-key/comments",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ message: "Thanks", comment_id: 1686061555 })
      })
    );
  });

  it("returns a root comment and its replies as a thread", async () => {
    process.env.FIGMA_ACCESS_TOKEN = "token";
    delete process.env.FIGMA_FILE_KEY;
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        comments: [
          { id: "1686061555", parent_id: "", message: "Root" },
          { id: "reply-1", parent_id: "1686061555", message: "Reply 1" },
          { id: "reply-2", parent_id: "1686061555", message: "Reply 2" }
        ]
      })
    }));

    const client = createFigmaCommentsClient({ fetchImpl: fetchMock as any });
    const thread = await client.getThread(
      { runtimeSessionId: "runtime-1", fileKey: "file-key" },
      "1686061555",
      10
    );

    expect(thread.root).toMatchObject({ id: "1686061555", message: "Root" });
    expect(thread.replies).toHaveLength(2);
  });

  it("filters comments pinned to a node", async () => {
    process.env.FIGMA_ACCESS_TOKEN = "token";
    delete process.env.FIGMA_FILE_KEY;
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        comments: [
          { id: "root-1", parent_id: "", message: "Node comment", client_meta: { node_id: "123:456" } },
          { id: "reply-1", parent_id: "root-1", message: "Reply 1", client_meta: { node_id: "123:456" } },
          { id: "root-2", parent_id: "", message: "Other node", client_meta: { node_id: "999:1" } }
        ]
      })
    }));

    const client = createFigmaCommentsClient({ fetchImpl: fetchMock as any });
    const result = await client.getNodeComments(
      { runtimeSessionId: "runtime-1", fileKey: "file-key" },
      "123:456",
      { includeReplies: true, limit: 10 }
    );

    expect(result.comments).toHaveLength(1);
    expect(result.comments[0]).toMatchObject({
      id: "root-1",
      message: "Node comment"
    });
    expect(result.comments[0].replies).toHaveLength(1);
  });

  it("filters region-based inline comments pinned to a node", async () => {
    process.env.FIGMA_ACCESS_TOKEN = "token";
    delete process.env.FIGMA_FILE_KEY;
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        comments: [
          {
            id: "inline-1",
            parent_id: "",
            message: "Inline comment",
            client_meta: { node_id: "123:456", region_height: 24, region_width: 160 }
          },
          {
            id: "reply-1",
            parent_id: "inline-1",
            message: "Reply 1",
            client_meta: { node_id: "123:456" }
          },
          {
            id: "root-2",
            parent_id: "",
            message: "Plain node comment",
            client_meta: { node_id: "123:456" }
          }
        ]
      })
    }));

    const client = createFigmaCommentsClient({ fetchImpl: fetchMock as any });
    const result = await client.getInlineComments(
      { runtimeSessionId: "runtime-1", fileKey: "file-key" },
      "123:456",
      { includeReplies: true, limit: 10 }
    );

    expect(result.comments).toHaveLength(1);
    expect(result.comments[0]).toMatchObject({
      id: "inline-1",
      message: "Inline comment"
    });
    expect(result.comments[0].replies).toHaveLength(1);
  });

  it("posts an inline comment using a frame offset region", async () => {
    process.env.FIGMA_ACCESS_TOKEN = "token";
    delete process.env.FIGMA_FILE_KEY;
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ id: "inline-1", message: "Inline hello" })
    }));

    const client = createFigmaCommentsClient({ fetchImpl: fetchMock as any });
    const result = await client.postInlineComment(
      { runtimeSessionId: "runtime-1", fileKey: "file-key" },
      {
        message: "Inline hello",
        nodeId: "123:456",
        x: 8,
        y: 10,
        regionWidth: 180,
        regionHeight: 32,
        commentPinCorner: "top-left"
      }
    );

    expect(result.comment.id).toBe("inline-1");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.figma.com/v1/files/file-key/comments",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          message: "Inline hello",
          client_meta: {
            node_id: "123:456",
            node_offset: { x: 8, y: 10 },
            region_height: 32,
            region_width: 180,
            comment_pin_corner: "top-left"
          }
        })
      })
    );
  });

  it("falls back to FIGMA_FILE_KEY when runtime reports local-file", async () => {
    process.env.FIGMA_ACCESS_TOKEN = "token";
    process.env.FIGMA_FILE_KEY = "fallback-file-key";
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ comments: [] })
    }));

    const client = createFigmaCommentsClient({ fetchImpl: fetchMock as any });
    await client.getComments({ runtimeSessionId: "runtime-1", fileKey: "local-file" }, 10);

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.figma.com/v1/files/fallback-file-key/comments",
      expect.anything()
    );
  });

  it("prefers runtime fileKey over FIGMA_FILE_KEY when a real key is available", async () => {
    process.env.FIGMA_ACCESS_TOKEN = "token";
    process.env.FIGMA_FILE_KEY = "fallback-file-key";
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ comments: [] })
    }));

    const client = createFigmaCommentsClient({ fetchImpl: fetchMock as any });
    await client.getComments({ runtimeSessionId: "runtime-1", fileKey: "real-file-key" }, 10);

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.figma.com/v1/files/real-file-key/comments",
      expect.anything()
    );
  });
});
