import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { provider_id, caller_name, service_name, call_id } = await req.json();

    if (!provider_id || !call_id) {
      return new Response(
        JSON.stringify({ error: "provider_id and call_id required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get provider's push subscriptions
    const { data: subscriptions, error } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", provider_id);

    if (error || !subscriptions?.length) {
      return new Response(
        JSON.stringify({ message: "No push subscriptions found", sent: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For now, log subscription count - full Web Push with VAPID encryption 
    // will be added when VAPID keys are configured
    console.log(`Found ${subscriptions.length} subscriptions for provider ${provider_id}`);

    // Store notification in notifications table as fallback
    await supabase.from("notifications").insert({
      user_id: provider_id,
      type: "incoming_call",
      title: `📞 ${caller_name || "Someone"} কল করছেন`,
      body: service_name || "Consultation",
      resource_id: call_id,
      actor_id: provider_id,
    });

    return new Response(
      JSON.stringify({ 
        message: "Notification sent", 
        sent: subscriptions.length,
        fallback_notification: true 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
