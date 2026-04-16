/**
 * GET  /results-portal/api/elections  — fetchElections (any authenticated admin)
 * POST /results-portal/api/elections  — registerElection (state_admin only)
 */

import { createAdminClient } from "@/supabase/admin";
import { getResultsSession } from "@/lib/erms-session";
import { NextResponse } from "next/server";

const VALID_TYPES = ["senatorial", "house_of_reps", "governorship", "local_government"];
const VALID_STATUSES = ["upcoming", "active", "concluded"];

export async function GET() {
  const session = await getResultsSession();
  if (!session) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("elections")
    .select(`id, title, election_type, election_date, status, is_public, created_at, creator:created_by ( full_name )`)
    .order("election_date", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request) {
  const session = await getResultsSession();
  if (!session || session.role !== "state_admin") {
    return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { title, election_type, election_date, status = "upcoming" } = body;

  if (!title?.trim()) return NextResponse.json({ error: "Election title is required." }, { status: 400 });
  if (!election_type) return NextResponse.json({ error: "Election type is required." }, { status: 400 });
  if (!election_date) return NextResponse.json({ error: "Election date is required." }, { status: 400 });
  if (!VALID_TYPES.includes(election_type)) return NextResponse.json({ error: "Invalid election type." }, { status: 400 });
  if (!VALID_STATUSES.includes(status)) return NextResponse.json({ error: "Invalid status." }, { status: 400 });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("elections")
    .insert({ title: title.trim(), election_type, election_date, status, created_by: session.id })
    .select("id, title, election_type, election_date, status")
    .single();

  if (error) return NextResponse.json({ error: "Failed to register election. Please try again." }, { status: 500 });
  return NextResponse.json({ success: true, election: data });
}
