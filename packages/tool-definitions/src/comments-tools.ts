export const commentsTools = [
  {
    name: "figma_get_comments",
    description: "Return comment threads for the active Figma file."
  },
  {
    name: "figma_get_inline_comments",
    description: "Return region-based comments pinned within a specific node, with optional replies."
  },
  {
    name: "figma_get_comment_replies",
    description: "Return replies for a comment thread on the active Figma file."
  },
  {
    name: "figma_get_comment_thread",
    description: "Return a root comment and its replies as a single thread payload."
  },
  {
    name: "figma_get_node_comments",
    description: "Return comments pinned to a specific node, with optional replies."
  },
  {
    name: "figma_post_comment",
    description: "Create a new comment thread on the active Figma file."
  },
  {
    name: "figma_post_inline_comment",
    description: "Create a region-based comment pinned inside a specific node on the active Figma file."
  },
  {
    name: "figma_reply_to_comment",
    description: "Reply to an existing comment thread on the active Figma file."
  },
  {
    name: "figma_delete_comment",
    description: "Delete a comment by id from the active Figma file."
  }
] as const;
