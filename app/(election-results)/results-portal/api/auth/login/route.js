/**
 * POST /results-portal/api/auth/login
 * ERMS login — replaces the loginResultsAdmin server action.
 *
 * Uses request.cookies for reading and response.cookies.set() for writing
 * so that session tokens are reliably attached to the outgoing response.
 *
 * Returns { success, redirect } on success or { error } on failure.
 * Client handles the redirect via router.push().
 */

import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "@/supabase/admin";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

const ERMS_PREFIX = "erms_";
const ERMS_PATH = "/results-portal";

async function logAuthEvent(supabase, adminId, action, ipAddress, userAgent, notes = null) {
  try {
    await supabase.from("result_audit_log").insert({
      action,
      table_name: "election_admins",
      performed_by: adminId,
      ip_address: ipAddress,
      user_agent: userAgent,
      notes,
    });
  } catch {
    // non-fatal
  }
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const email = body.email?.trim().toLowerCase();
  const password = body.password?.toString();
  const from = body.from?.trim() || null;

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();
  const hdrs = await headers();
  const ipAddress = hdrs.get("x-forwarded-for") || "unknown";
  const userAgent = hdrs.get("user-agent") || "unknown";

  // Fetch ERMS profile first — cheaper than an auth round-trip for inactive accounts
  const { data: admin, error: fetchError } = await supabase
    .from("election_admins")
    .select("id, email, full_name, role, lga, must_change_password, is_active")
    .eq("email", email)
    .single();

  if (fetchError || !admin) {
    await logAuthEvent(supabase, null, "LOGIN_FAILED", ipAddress, userAgent, `No account: ${email}`);
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  if (!admin.is_active) {
    await logAuthEvent(supabase, admin.id, "LOGIN_FAILED", ipAddress, userAgent, "Account deactivated");
    return NextResponse.json(
      { error: "Your account has been deactivated. Contact the State Admin." },
      { status: 403 },
    );
  }

  // Collect cookies that Supabase wants to write after signIn.
  // We must NOT use createErmsClient() here because its setAll callback
  // calls cookieStore.set() from next/headers, which is not reliable in
  // Route Handlers. Instead we build the client inline and capture cookies
  // into pendingCookies, then apply them to the NextResponse object.
  let pendingCookies = [];

  const ermsClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies
            .getAll()
            .filter((c) => c.name.startsWith(ERMS_PREFIX))
            .map((c) => ({ name: c.name.slice(ERMS_PREFIX.length), value: c.value }));
        },
        setAll(cookiesToSet) {
          pendingCookies = cookiesToSet;
        },
      },
    },
  );

  const { error: signInError } = await ermsClient.auth.signInWithPassword({ email, password });

  if (signInError) {
    await logAuthEvent(supabase, admin.id, "LOGIN_FAILED", ipAddress, userAgent, "Bad password");
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  // Determine redirect destination
  const isSafe =
    from &&
    from.startsWith("/results-portal/") &&
    !from.includes("//") &&
    !from.startsWith("/results-portal/login");

  const roleDest =
    admin.role === "state_admin"
      ? "/results-portal/admin"
      : admin.role === "polling_unit_admin"
        ? "/results-portal/pu"
        : "/results-portal/lga";

  const redirect = admin.must_change_password
    ? "/results-portal/change-password"
    : isSafe
      ? from
      : roleDest;

  // Build the response first, then attach cookies to it
  const response = NextResponse.json({ success: true, redirect });

  // Apply Supabase session cookies with ERMS prefix and path scoping
  pendingCookies.forEach(({ name, value, options = {} }) => {
    const { maxAge, expires, ...rest } = options;
    const isRemoval = maxAge === 0;
    response.cookies.set(ERMS_PREFIX + name, value, {
      ...rest,
      ...(isRemoval ? { maxAge: 0 } : {}),
      path: ERMS_PATH,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  });

  // Seed the server-side idle-timeout cookie
  response.cookies.set("erms_last_active", String(Date.now()), {
    path: ERMS_PATH,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  // Non-fatal side effects (fire and forget)
  supabase
    .from("election_admins")
    .update({ last_login: new Date().toISOString() })
    .eq("id", admin.id)
    .then(() => {})
    .catch(() => {});

  await logAuthEvent(supabase, admin.id, "LOGIN_SUCCESS", ipAddress, userAgent);

  return response;
}
