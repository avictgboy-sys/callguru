import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "create_post",
  title: "Create feed post",
  description: "Publish a text post to the CallGuru feed as the signed-in user.",
  inputSchema: {
    content: z.string().trim().min(1).max(5000).describe("Post text."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async ({ content }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("posts")
      .insert({ user_id: ctx.getUserId()!, content })
      .select("id, content, created_at")
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Post published: ${JSON.stringify(data)}` }],
      structuredContent: { post: data },
    };
  },
});
