/**
 * GET /results-portal/api/results/candidates?electionId=...  — fetchElectionCandidates
 */

import { createAdminClient } from "@/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const electionId = searchParams.get("electionId");

  if (!electionId) {
    return NextResponse.json({ error: "electionId is required." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("candidates")
    .select("id, full_name, party, position, photo_url")
    .eq("election_id", electionId)
    .order("party");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
