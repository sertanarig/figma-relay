import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { resolveLiveBridgeUrl } from "./smoke-helpers.mjs";

const rootCwd = process.cwd();

function parseArgs(argv) {
  const result = {
    rootMessage: "Runtime MCP thread root helper smoke",
    replyMessage: "Runtime MCP thread helper reply"
  };

  for (const arg of argv) {
    if (arg.startsWith("--root-message=")) {
      result.rootMessage = arg.slice("--root-message=".length);
    } else if (arg.startsWith("--reply-message=")) {
      result.replyMessage = arg.slice("--reply-message=".length);
    }
  }

  return result;
}

function text(result) {
  return result?.content?.find((item) => item.type === "text")?.text || "";
}

const options = parseArgs(process.argv.slice(2));
async function main() {
  const bridgeUrl = await resolveLiveBridgeUrl();
  const transport = new StdioClientTransport({
    command: `${rootCwd}/node_modules/.bin/tsx`,
    args: ["packages/mcp-server/src/stdio.ts"],
    cwd: rootCwd,
    stderr: "pipe",
    env: {
      ...process.env,
      CODEX_FIGMA_BRIDGE_URL: bridgeUrl
    }
  });

  const client = new Client({ name: "mcp-comments-smoke", version: "0.2.0" });

  try {
    await client.connect(transport);

    const posted = JSON.parse(
      text(await client.callTool({ name: "figma_post_comment", arguments: { message: options.rootMessage } }))
    );
    const commentId = String(posted.comment?.id ?? posted.id);

    await client.callTool({
      name: "figma_reply_to_comment",
      arguments: { commentId, message: options.replyMessage }
    });

    const thread = JSON.parse(
      text(await client.callTool({ name: "figma_get_comment_thread", arguments: { commentId, limit: 5 } }))
    );

    await client.callTool({ name: "figma_delete_comment", arguments: { commentId } });

    console.log(
      JSON.stringify(
        {
          ok: true,
          commentId,
          rootMessage: thread.root?.message ?? null,
          repliesCount: thread.replies.length,
          firstReplyMessage: thread.replies[0]?.message ?? null
        },
        null,
        2
      )
    );
  } finally {
    await client.close().catch(() => {});
    await transport.close().catch(() => {});
  }
}

main().catch((error) => {
  console.error(`comments-smoke.failed ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
