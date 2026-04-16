import { createClient } from "@/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // best effort
  }
  return NextResponse.redirect(new URL("/login", request.url));
}

export async function POST() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // best effort
  }
  return NextResponse.json({ ok: true });
}
