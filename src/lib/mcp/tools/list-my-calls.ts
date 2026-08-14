import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_my_calls",
  title: "List my calls",
  description: "List the signed-in user's recent video consultation calls, as caller or as expert, with duration and cost.",
  inputSchema: {
    role: z.enum(["any", "caller", "provider"]).optional().describe("Filter by the user's role in the call (default any)."),
    limit: z.number().int().min(1).max(50).optional().describe("Max results (default 10)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ role, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const userId = ctx.getUserId();
    const supabase = supabaseForUser(ctx);
    let q = supabase
      .from("calls")
      .select("id, status, started_at, ended_at, duration_minutes, price_per_minute, total_cost, provider_earning, caller_id, provider_id, services(title)")
      .order("started_at", { ascending: false })
      .limit(limit ?? 10);

    if (role === "caller") q = q.eq("caller_id", userId!);
    else if (role === "provider") q = q.eq("provider_id", userId!);

    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { calls: data ?? [] },
    };
  },
});
