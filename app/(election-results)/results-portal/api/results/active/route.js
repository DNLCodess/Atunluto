/**
 * GET /results-portal/api/results/active  — fetchActiveElections (no auth check)
 */

import { createAdminClient } from "@/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("elections")
    .select("id, title, election_type, election_date")
    .eq("status", "active")
    .order("election_date", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
