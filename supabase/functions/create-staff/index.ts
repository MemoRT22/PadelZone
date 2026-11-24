import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CreateStaffRequest {
  email: string;
  display_name: string;
  role: string;
  password?: string;
}

const VALID_ROLES = [
  "propietario",
  "gerente",
  "cajero",
  "cocina",
  "entrenador",
  "organizador",
];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No autorizado — falta token de autenticación" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with caller's token to verify identity
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(
        JSON.stringify({ error: "Sesión no válida" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const callerUid = userData.user.id;

    // Verify caller is an active propietario using the security helper
    const { data: roleData, error: roleErr } = await userClient.rpc(
      "user_club_role",
      { check_uid: callerUid }
    );

    if (roleErr || roleData !== "propietario") {
      return new Response(
        JSON.stringify({ error: "Solo el propietario puede crear miembros del personal" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body: CreateStaffRequest = await req.json();
    const email = body.email?.trim().toLowerCase();
    const displayName = body.display_name?.trim();
    const role = body.role;
    const password = body.password;

    if (!email || !displayName || !role) {
      return new Response(
        JSON.stringify({ error: "Faltan campos obligatorios (email, display_name, role)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!VALID_ROLES.includes(role)) {
      return new Response(
        JSON.stringify({ error: `Rol inválido. Roles válidos: ${VALID_ROLES.join(", ")}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!password || password.length < 6) {
      return new Response(
        JSON.stringify({ error: "La contraseña debe tener al menos 6 caracteres" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Admin client with service role key — bypasses RLS
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Check if user already exists by email
    const { data: existingUsers } = await adminClient.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    const existingUser = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === email
    );

    let userId: string;

    if (existingUser) {
      // User already has an auth account — check if they already have a membership
      const { data: existingMembership } = await adminClient
        .from("club_memberships")
        .select("id")
        .eq("user_id", existingUser.id)
        .maybeSingle();

      if (existingMembership) {
        return new Response(
          JSON.stringify({ error: "Este usuario ya tiene una membresía asignada" }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      userId = existingUser.id;
    } else {
      // Create new auth user via Admin API
      const { data: newUserData, error: createErr } =
        await adminClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { display_name: displayName },
        });

      if (createErr || !newUserData.user) {
        return new Response(
          JSON.stringify({ error: `Error al crear usuario: ${createErr?.message ?? "desconocido"}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      userId = newUserData.user.id;
    }

    // Insert membership record
    const { error: memberErr } = await adminClient
      .from("club_memberships")
      .insert({
        user_id: userId,
        role,
        display_name: displayName,
        active: true,
      });

    if (memberErr) {
      // Best-effort cleanup: if we just created the user but failed to insert membership,
      // delete the user to avoid orphaned auth accounts
      if (!existingUser) {
        await adminClient.auth.admin.deleteUser(userId);
      }
      return new Response(
        JSON.stringify({ error: `Error al asignar membresía: ${memberErr.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log the admin operation to audit_events
    await adminClient.from("audit_events").insert({
      actor_id: callerUid,
      entity_type: "club_memberships",
      entity_id: userId,
      action: "create_staff",
      after: { email, role, display_name: displayName },
    });

    return new Response(
      JSON.stringify({
        success: true,
        user_id: userId,
        message: `${displayName} creado con rol ${role}`,
      }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error interno del servidor";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
