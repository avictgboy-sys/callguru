import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "search_services",
  title: "Search expert services",
  description: "Search the CallGuru marketplace for expert consultation services by keyword, price and availability.",
  inputSchema: {
    query: z.string().trim().optional().describe("Keyword to match against service title or description."),
    max_price_per_minute: z.number().positive().optional().describe("Only return services at or below this per-minute price."),
    only_available: z.boolean().optional().describe("Only return experts currently available for calls."),
    limit: z.number().int().min(1).max(50).optional().describe("Max results (default 10)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, max_price_per_minute, only_available, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let q = supabase
      .from("services")
      .select("id, title, description, price_per_minute, rating, total_reviews, total_sessions, tags, is_available, provider_id")
      .eq("is_active", true)
      .order("rating", { ascending: false })
      .limit(limit ?? 10);

    if (query) q = q.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
    if (max_price_per_minute) q = q.lte("price_per_minute", max_price_per_minute);
    if (only_available) q = q.eq("is_available", true);

    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { services: data ?? [] },
    };
  },
});
