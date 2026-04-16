/**
 * GET /results-portal/api/audit/admins  — fetchAdminsList (state_admin only)
 */

import { createAdminClient } from "@/supabase/admin";
import { getResultsSession } from "@/lib/erms-session";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getResultsSession();
  if (!session || session.role !== "state_admin") {
    return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("election_admins")
    .select("id, full_name, role, lga")
    .order("full_name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
