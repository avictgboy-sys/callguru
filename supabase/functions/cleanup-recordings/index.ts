import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find calls older than 90 days with recordings
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);

    const { data: oldCalls, error: fetchError } = await supabase
      .from("calls")
      .select("id, recording_url")
      .not("recording_url", "is", null)
      .lt("created_at", cutoffDate.toISOString());

    if (fetchError) throw fetchError;

    let deletedCount = 0;

    for (const call of oldCalls || []) {
      if (!call.recording_url) continue;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("call-recordings")
        .remove([call.recording_url]);

      if (!storageError) {
        // Clear recording_url from call record
        await supabase
          .from("calls")
          .update({ recording_url: null })
          .eq("id", call.id);
        deletedCount++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        deleted: deletedCount,
        checked: oldCalls?.length || 0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
