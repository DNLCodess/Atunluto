/**
 * POST /results-portal/api/results  — submitElectionResult
 */

import { createAdminClient } from "@/supabase/admin";
import { getResultsSession } from "@/lib/erms-session";
import { computeResultChecksum } from "@/utils/results-checksum";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request) {
  const session = await getResultsSession();
  if (!session || !["lga_admin", "polling_unit_admin"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const {
    electionId,
    ward,
    pollingUnit,
    candidateVotes,
    accreditedVoters,
    registeredVoters,
    notes,
    imageUrl,
  } = body;

  if (!electionId) return NextResponse.json({ error: "Election is required." }, { status: 400 });
  if (!ward?.trim()) return NextResponse.json({ error: "Ward is required." }, { status: 400 });
  if (!pollingUnit?.trim()) return NextResponse.json({ error: "Polling unit is required." }, { status: 400 });
  if (!Array.isArray(candidateVotes) || candidateVotes.length === 0) {
    return NextResponse.json({ error: "Candidate votes are required." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const hdrs = await headers();

  const { data: election } = await supabase
    .from("elections")
    .select("status")
    .eq("id", electionId)
    .single();

  if (!election) return NextResponse.json({ error: "Election not found." }, { status: 404 });
  if (election.status !== "active") {
    return NextResponse.json(
      { error: "This election is no longer accepting submissions." },
      { status: 400 },
    );
  }

  const result_image_url = imageUrl || null;
  const result_image_path = null;

  const insertRows = candidateVotes.map(({ candidateId, votes }) => ({
    election_id: electionId,
    lga: session.lga,
    ward: ward.trim(),
    polling_unit: pollingUnit.trim(),
    candidate_id: candidateId,
    votes_cast: votes,
    accredited_voters: Number(accreditedVoters),
    registered_voters: Number(registeredVoters),
    result_image_url,
    result_image_path,
    notes: notes?.trim() || null,
    status: "verified",
    submitted_by: session.id,
  }));

  for (const row of insertRows) {
    row.checksum = await computeResultChecksum({
      electionId: row.election_id,
      candidateId: row.candidate_id,
      lga: row.lga,
      ward: row.ward,
      pollingUnit: row.polling_unit,
      votesCast: row.votes_cast,
      accreditedVoters: row.accredited_voters,
      registeredVoters: row.registered_voters,
    });
  }

  const { error } = await supabase.from("election_results").insert(insertRows);

  if (error) {
    return NextResponse.json(
      { error: "Failed to submit results. Please try again." },
      { status: 500 },
    );
  }

  await supabase.from("result_audit_log").insert({
    action: "INSERT",
    table_name: "election_results",
    performed_by: session.id,
    ip_address: hdrs.get("x-forwarded-for") || "unknown",
    user_agent: hdrs.get("user-agent") || "unknown",
    notes: `Results submitted for ${ward} — ${pollingUnit} (${candidateVotes.length} candidates)`,
  });

  return NextResponse.json({
    success: true,
    pollingUnit: pollingUnit.trim(),
    ward: ward.trim(),
    lga: session.lga,
  });
}
