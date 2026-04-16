/**
 * DELETE /results-portal/api/elections/[id]/candidates/[cid]  — deleteCandidate
 */

import { createAdminClient } from "@/supabase/admin";
import { getResultsSession } from "@/lib/erms-session";
import { NextResponse } from "next/server";

export async function DELETE(request, { params }) {
  const session = await getResultsSession();
  if (!session || session.role !== "state_admin") {
    return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  }

  const { cid: candidateId } = await params;
  const supabase = createAdminClient();

  const { count } = await supabase
    .from("election_results")
    .select("*", { count: "exact", head: true })
    .eq("candidate_id", candidateId)
    .is("deleted_at", null);

  if (count > 0) {
    return NextResponse.json(
      { error: `Cannot remove this candidate — ${count} result submission(s) already exist.` },
      { status: 409 },
    );
  }

  const { error } = await supabase
    .from("candidates")
    .delete()
    .eq("id", candidateId);

  if (error) return NextResponse.json({ error: "Failed to remove candidate." }, { status: 500 });
  return NextResponse.json({ success: true });
}
