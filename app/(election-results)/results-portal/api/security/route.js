/**
 * POST /results-portal/api/security              — fileSecurityReport
 * GET  /results-portal/api/security?scope=all    — fetchSecurityReports (state_admin)
 * GET  /results-portal/api/security?scope=mine&adminId=... — fetchMyReports (any admin)
 */

import { createAdminClient } from "@/supabase/admin";
import { getResultsSession } from "@/lib/erms-session";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

const TYPE_MAP = {
  tampering: "tampering",
  "unauthorised access": "unauthorized_access",
  "unauthorized access": "unauthorized_access",
  "suspicious activity": "suspicious_activity",
  other: "other",
};
const VALID_TYPES = ["tampering", "unauthorized_access", "suspicious_activity", "other"];
const VALID_URGENCY = ["low", "medium", "high", "critical"];

export async function GET(request) {
  const session = await getResultsSession();
  if (!session) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope") || "all";
  const adminId = searchParams.get("adminId") || null;
  const status = searchParams.get("status") || "";
  const urgency = searchParams.get("urgency") || "";

  const supabase = createAdminClient();

  if (scope === "mine") {
    if (!adminId) return NextResponse.json({ error: "adminId is required." }, { status: 400 });
    const { data, error } = await supabase
      .from("security_reports")
      .select("id, report_type, urgency, description, status, created_at")
      .eq("reported_by", adminId)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  // scope=all — state_admin only
  if (session.role !== "state_admin") {
    return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  }

  let query = supabase
    .from("security_reports")
    .select(
      `id, report_type, urgency, description, evidence_url, status, resolution_notes, created_at, updated_at,
       reporter:reported_by ( id, full_name, lga ),
       resolver:resolved_by ( full_name )`,
    )
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (urgency) query = query.eq("urgency", urgency);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request) {
  const session = await getResultsSession();
  if (!session || !["lga_admin", "polling_unit_admin"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { report_type: rawType, urgency, description, evidencePath } = body;

  const report_type =
    TYPE_MAP[rawType?.toLowerCase?.().trim()] ??
    rawType?.toLowerCase?.().replace(/\s+/g, "_").trim();

  if (!report_type) return NextResponse.json({ error: "Report type is required." }, { status: 400 });
  if (!urgency) return NextResponse.json({ error: "Urgency level is required." }, { status: 400 });
  if (!description?.trim()) return NextResponse.json({ error: "Description is required." }, { status: 400 });
  if (description.trim().length < 50) {
    return NextResponse.json(
      { error: "Description must be at least 50 characters." },
      { status: 400 },
    );
  }
  if (!VALID_TYPES.includes(report_type)) return NextResponse.json({ error: "Invalid report type." }, { status: 400 });
  if (!VALID_URGENCY.includes(urgency)) return NextResponse.json({ error: "Invalid urgency level." }, { status: 400 });

  const supabase = createAdminClient();

  let evidence_url = null;
  if (evidencePath) {
    const { data: urlData } = await supabase.storage
      .from("security-evidence")
      .createSignedUrl(evidencePath, 3600 * 24 * 7);
    evidence_url = urlData?.signedUrl || null;
  }

  const { data, error } = await supabase
    .from("security_reports")
    .insert({
      reported_by: session.id,
      report_type,
      urgency,
      description: description.trim(),
      evidence_url,
      status: "open",
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to submit report. Please try again." },
      { status: 500 },
    );
  }

  const hdrs = await headers();
  await supabase.from("result_audit_log").insert({
    action: "INSERT",
    table_name: "security_reports",
    record_id: data.id,
    performed_by: session.id,
    ip_address: hdrs.get("x-forwarded-for") || "unknown",
    user_agent: hdrs.get("user-agent") || "unknown",
    notes: `Security report filed — ${urgency.toUpperCase()} urgency: ${report_type}`,
  });

  return NextResponse.json({ success: true, reportId: data.id });
}
