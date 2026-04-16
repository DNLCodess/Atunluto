/**
 * PATCH /results-portal/api/results/[id]/status  — updateResultStatus (state_admin only)
 */

import { createAdminClient } from "@/supabase/admin";
import { getResultsSession } from "@/lib/erms-session";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

const VALID_STATUSES = ["pending", "verified", "disputed"];

export async function PATCH(request, { params }) {
  const session = await getResultsSession();
  if (!session || session.role !== "state_admin") {
    return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  }

  const { id: resultId } = await params;
  const body = await request.json().catch(() => ({}));
  const { status } = body;

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const hdrs = await headers();
  const ipAddress = hdrs.get("x-forwarded-for") || "unknown";
  const userAgent = hdrs.get("user-agent") || "unknown";

  const { data: old } = await supabase
    .from("election_results")
    .select("status")
    .eq("id", resultId)
    .single();

  const { error } = await supabase
    .from("election_results")
    .update({ status })
    .eq("id", resultId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("result_audit_log").insert({
    action: "UPDATE",
    table_name: "election_results",
    record_id: resultId,
    old_values: { status: old?.status },
    new_values: { status },
    performed_by: session.id,
    ip_address: ipAddress,
    user_agent: userAgent,
    notes: `Status changed to ${status} by State Admin`,
  });

  return NextResponse.json({ success: true });
}
