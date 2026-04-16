/**
 * POST /results-portal/api/security/checksum?electionId=...  — runChecksumVerification
 * GET  /results-portal/api/security/checksum?electionId=...  — fetchChecksumScan
 */

import { createAdminClient } from "@/supabase/admin";
import { getResultsSession } from "@/lib/erms-session";
import { computeResultChecksum } from "@/utils/results-checksum";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request) {
  const session = await getResultsSession();
  if (!session || session.role !== "state_admin") {
    return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const electionId = searchParams.get("electionId");
  if (!electionId) return NextResponse.json({ error: "electionId is required." }, { status: 400 });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("election_results")
    .select(
      `id, lga, ward, polling_unit, votes_cast, accredited_voters, registered_voters,
       checksum, submitted_at, election_id, candidate_id,
       candidate:candidate_id ( full_name, party ),
       submitter:submitted_by ( full_name )`,
    )
    .eq("election_id", electionId)
    .is("deleted_at", null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request) {
  const session = await getResultsSession();
  if (!session || session.role !== "state_admin") {
    return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const electionId = searchParams.get("electionId");
  if (!electionId) return NextResponse.json({ error: "electionId is required." }, { status: 400 });

  const supabase = createAdminClient();
  const hdrs = await headers();
  const ipAddress = hdrs.get("x-forwarded-for") || "unknown";
  const userAgent = hdrs.get("user-agent") || "unknown";

  const { data: results, error } = await supabase
    .from("election_results")
    .select(
      `id, election_id, candidate_id, lga, ward, polling_unit,
       votes_cast, accredited_voters, registered_voters, checksum,
       candidate:candidate_id ( full_name, party ),
       submitter:submitted_by ( full_name )`,
    )
    .eq("election_id", electionId)
    .is("deleted_at", null);

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch results for verification." },
      { status: 500 },
    );
  }

  const mismatches = [];

  for (const record of results) {
    const recomputed = await computeResultChecksum({
      electionId: record.election_id,
      candidateId: record.candidate_id,
      lga: record.lga,
      ward: record.ward,
      pollingUnit: record.polling_unit,
      votesCast: record.votes_cast,
      accreditedVoters: record.accredited_voters,
      registeredVoters: record.registered_voters,
    });

    if (recomputed !== record.checksum) {
      mismatches.push({
        id: record.id,
        lga: record.lga,
        ward: record.ward,
        pollingUnit: record.polling_unit,
        candidateName: record.candidate?.full_name,
        party: record.candidate?.party,
        submitter: record.submitter?.full_name,
        storedChecksum: record.checksum,
        recomputedChecksum: recomputed,
      });

      await supabase.from("result_audit_log").insert({
        action: "UPDATE",
        table_name: "election_results",
        record_id: record.id,
        performed_by: session.id,
        ip_address: ipAddress,
        user_agent: userAgent,
        notes: `CHECKSUM MISMATCH — stored: ${record.checksum?.substring(0, 12)}... recomputed: ${recomputed?.substring(0, 12)}...`,
      });
    }
  }

  return NextResponse.json({
    success: true,
    totalScanned: results.length,
    mismatchCount: mismatches.length,
    mismatches,
    scannedAt: new Date().toISOString(),
  });
}
