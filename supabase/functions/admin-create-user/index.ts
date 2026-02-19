import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { access_token, email, password, full_name, last_name, user_type } = body || {};

    if (!access_token) {
      return new Response(
        JSON.stringify({ error: "access_token requerido en el body" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!email || typeof password !== "string") {
      return new Response(
        JSON.stringify({ error: "Body debe incluir email y password" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: "La contraseña debe tener al menos 6 caracteres" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: { user: caller }, error: userError } = await adminClient.auth.getUser(access_token);
    if (userError || !caller) {
      return new Response(
        JSON.stringify({ error: "Token inválido o expirado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: profile } = await adminClient
      .from("profiles")
      .select("user_type")
      .eq("id", caller.id)
      .single();
    if (profile?.user_type !== "admin") {
      return new Response(
        JSON.stringify({ error: "Solo administradores pueden crear usuarios" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const type = user_type === "admin" || user_type === "partner" || user_type === "cliente" ? user_type : "cliente";
    const meta = { full_name: full_name?.trim() || null, last_name: last_name?.trim() || null, user_type: type };

    let createResult = await adminClient.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: meta,
    });

    // Si el correo ya está registrado, solo permitir reutilizarlo si es un usuario eliminado (deleted_at)
    if (createResult.error) {
      const msg = createResult.error.message || "";
      const isAlreadyRegistered = /already been registered|already registered|already exists/i.test(msg);
      if (isAlreadyRegistered) {
        const { data: { users } } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
        const existing = users?.find((u) => (u.email || "").toLowerCase() === email.trim().toLowerCase());
        if (existing) {
          const { data: existingProfile } = await adminClient
            .from("profiles")
            .select("id, deleted_at")
            .eq("id", existing.id)
            .maybeSingle();
          const deleted = existingProfile && (existingProfile as { deleted_at?: string | null }).deleted_at;
          if (deleted) {
            await adminClient.auth.admin.deleteUser(existing.id);
            createResult = await adminClient.auth.admin.createUser({
              email: email.trim().toLowerCase(),
              password,
              email_confirm: true,
              user_metadata: meta,
            });
          }
        }
      }
    }

    if (createResult.error) {
      return new Response(
        JSON.stringify({ error: createResult.error.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const newUser = createResult.data?.user;
    if (newUser && (meta.full_name || meta.last_name || meta.user_type)) {
      await adminClient.from("profiles").update({
        full_name: meta.full_name || null,
        last_name: meta.last_name || null,
        user_type: meta.user_type,
        updated_at: new Date().toISOString(),
      }).eq("id", newUser.id);
    }

    return new Response(
      JSON.stringify({ success: true, user_id: newUser?.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
