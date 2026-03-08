import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Find calls that have been "active" for more than 2 hours (likely abandoned)
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

    const { data: staleCalls, error: fetchError } = await supabase
      .from("calls")
      .select("*")
      .eq("status", "active")
      .lt("started_at", twoHoursAgo);

    if (fetchError) throw fetchError;

    let completed = 0;

    for (const call of staleCalls || []) {
      // Estimate duration from started_at to now (max 120 min)
      const startedAt = new Date(call.started_at).getTime();
      const durationMs = Date.now() - startedAt;
      const durationMins = Math.min(Math.ceil(durationMs / 60000), 120);

      // Use the complete_call RPC with service role
      const { error } = await supabase.rpc("complete_call", {
        p_call_id: call.id,
        p_duration_minutes: durationMins,
      });

      if (error) {
        console.error(`Failed to complete stale call ${call.id}:`, error.message);
        // Fallback: just mark as completed without billing
        await supabase
          .from("calls")
          .update({
            status: "completed",
            ended_at: new Date().toISOString(),
            duration_minutes: durationMins,
          })
          .eq("id", call.id);
      }

      completed++;
    }

    return new Response(
      JSON.stringify({ message: `Cleaned up ${completed} stale calls` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
