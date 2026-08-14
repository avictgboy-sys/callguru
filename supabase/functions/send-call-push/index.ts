import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // --- Authentication: require a valid user JWT ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Unauthorized" }, 401);
    }

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userData, error: userError } = await supabaseUser.auth.getUser();
    const user = userData?.user;
    if (userError || !user) {
      return json({ error: "Unauthorized" }, 401);
    }

    const { call_id } = await req.json();

    if (!call_id) {
      return json({ error: "call_id required" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // --- Authorization: the caller of the referenced call must be the requester ---
    const { data: call, error: callError } = await supabase
      .from("calls")
      .select("id, caller_id, provider_id, service_id")
      .eq("id", call_id)
      .maybeSingle();

    if (callError || !call) {
      return json({ error: "Call not found" }, 404);
    }

    if (call.caller_id !== user.id) {
      return json({ error: "Forbidden" }, 403);
    }

    const providerId = call.provider_id;

    // Derive display values server-side instead of trusting the request body
    const [{ data: callerProfile }, { data: service }] = await Promise.all([
      supabase.from("profiles").select("full_name").eq("user_id", user.id).maybeSingle(),
      supabase.from("services").select("title").eq("id", call.service_id).maybeSingle(),
    ]);

    const { data: subscriptions } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", providerId);

    console.log(
      `Found ${subscriptions?.length ?? 0} subscriptions for provider of call ${call_id}`
    );

    // Store notification in notifications table as fallback
    await supabase.from("notifications").insert({
      user_id: providerId,
      type: "incoming_call",
      title: `📞 ${callerProfile?.full_name || "Someone"} কল করছেন`,
      body: service?.title || "Consultation",
      resource_id: call_id,
      actor_id: user.id,
    });

    return json({
      message: "Notification sent",
      sent: subscriptions?.length ?? 0,
      fallback_notification: true,
    });
  } catch (err) {
    console.error("send-call-push error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});
