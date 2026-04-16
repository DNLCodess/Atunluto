/**
 * GET /results-portal/api/results/mine?adminId=...&electionId=...  — fetchMyResults
 */

import { createAdminClient } from "@/supabase/admin";
import { getResultsSession } from "@/lib/erms-session";
import { NextResponse } from "next/server";

export async function GET(request) {
  const session = await getResultsSession();
  if (!session) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const adminId = searchParams.get("adminId");
  const electionId = searchParams.get("electionId") || null;

  if (!adminId) {
    return NextResponse.json({ error: "adminId is required." }, { status: 400 });
  }

  const supabase = createAdminClient();
  let query = supabase
    .from("election_results")
    .select(
      `id, lga, ward, polling_unit,
       votes_cast, accredited_voters, registered_voters,
       result_image_url, notes, status, submitted_at, checksum,
       candidate:candidate_id ( id, full_name, party ),
       election:election_id ( id, title )`,
    )
    .eq("submitted_by", adminId)
    .is("deleted_at", null)
    .order("submitted_at", { ascending: false });

  if (electionId) query = query.eq("election_id", electionId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
