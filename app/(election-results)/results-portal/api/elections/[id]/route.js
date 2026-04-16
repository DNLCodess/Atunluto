/**
 * PATCH /results-portal/api/elections/[id]
 *   body: { action: "update-status", status: string }
 *   body: { action: "toggle-public", is_public: bool }
 */

import { createAdminClient } from "@/supabase/admin";
import { getResultsSession } from "@/lib/erms-session";
import { NextResponse } from "next/server";

const VALID_TRANSITIONS = {
  upcoming: ["active"],
  active: ["concluded"],
  concluded: [],
};

export async function PATCH(request, { params }) {
  const session = await getResultsSession();
  if (!session || session.role !== "state_admin") {
    return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  }

  const { id: electionId } = await params;
  const body = await request.json().catch(() => ({}));
  const supabase = createAdminClient();

  if (body.action === "update-status") {
    const { status: newStatus } = body;

    const { data: current, error: fetchError } = await supabase
      .from("elections")
      .select("status")
      .eq("id", electionId)
      .single();

    if (fetchError || !current) {
      return NextResponse.json({ error: "Election not found." }, { status: 404 });
    }

    const allowed = VALID_TRANSITIONS[current.status] ?? [];
    if (!allowed.includes(newStatus)) {
      return NextResponse.json(
        { error: `Cannot transition from "${current.status}" to "${newStatus}".` },
        { status: 400 },
      );
    }

    const { error } = await supabase
      .from("elections")
      .update({ status: newStatus })
      .eq("id", electionId);

    if (error) return NextResponse.json({ error: "Failed to update election status." }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (body.action === "toggle-public") {
    const { is_public } = body;

    const { data: current } = await supabase
      .from("elections")
      .select("status")
      .eq("id", electionId)
      .single();

    if (!current) return NextResponse.json({ error: "Election not found." }, { status: 404 });

    if (is_public && current.status !== "concluded") {
      return NextResponse.json(
        { error: "Only concluded elections can be made public." },
        { status: 400 },
      );
    }

    const { error } = await supabase
      .from("elections")
      .update({ is_public })
      .eq("id", electionId);

    if (error) return NextResponse.json({ error: "Failed to update visibility." }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action." }, { status: 400 });
}
