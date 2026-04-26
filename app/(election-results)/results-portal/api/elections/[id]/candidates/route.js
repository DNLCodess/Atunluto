/**
 * GET  /results-portal/api/elections/[id]/candidates  — fetchCandidates
 * POST /results-portal/api/elections/[id]/candidates  — addCandidate
 */

import { createAdminClient } from "@/supabase/admin";
import { getResultsSession } from "@/lib/erms-session";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  const session = await getResultsSession();
  if (!session) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });

  const { id: electionId } = await params;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("candidates")
    .select("id, full_name, party, lga, photo_url, position, created_at")
    .eq("election_id", electionId)
    .order("party");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request, { params }) {
  const session = await getResultsSession();
  if (!session || session.role !== "state_admin") {
    return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  }

  const { id: electionId } = await params;
  const body = await request.json().catch(() => ({}));
  const { full_name, party, position, lga, photoUrl } = body;

  if (!full_name?.trim()) return NextResponse.json({ error: "Candidate name is required." }, { status: 400 });
  if (!party?.trim()) return NextResponse.json({ error: "Party affiliation is required." }, { status: 400 });
  if (!position?.trim()) return NextResponse.json({ error: "Position/seat is required." }, { status: 400 });

  const supabase = createAdminClient();

  const { data: election } = await supabase
    .from("elections")
    .select("status")
    .eq("id", electionId)
    .single();

  if (!election) return NextResponse.json({ error: "Election not found." }, { status: 404 });
  if (election.status === "concluded") {
    return NextResponse.json(
      { error: "Cannot add candidates to a concluded election." },
      { status: 400 },
    );
  }

  const photo_url = photoUrl || null;

  const { data, error } = await supabase
    .from("candidates")
    .insert({
      election_id: electionId,
      full_name: full_name.trim(),
      party: party.trim().toUpperCase(),
      position: position.trim(),
      lga: lga?.trim() || null,
      photo_url,
    })
    .select("id, full_name, party, position, lga, photo_url")
    .single();

  if (error) return NextResponse.json({ error: "Failed to add candidate." }, { status: 500 });
  return NextResponse.json({ success: true, candidate: data });
}
