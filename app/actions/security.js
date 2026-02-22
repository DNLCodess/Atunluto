"use server";

import { createAdminClient } from "@/supabase/admin";
import { getResultsSession } from "@/app/actions/election-auth";
import { computeResultChecksum } from "@/utils/results-checksum";
import { headers } from "next/headers";

export async function fileSecurityReport(payload) {
  const session = await getResultsSession();
  if (!session || session.role !== "lga_admin")
    return { error: "Unauthorised." };

  const { report_type, urgency, description, evidenceFile } = payload;

  if (!report_type) return { error: "Report type is required." };
  if (!urgency) return { error: "Urgency level is required." };
  if (!description?.trim()) return { error: "Description is required." };
  if (description.trim().length < 50)
    return { error: "Description must be at least 50 characters." };

  const VALID_TYPES = [
    "tampering",
    "unauthorized_access",
    "suspicious_activity",
    "other",
  ];
  const VALID_URGENCY = ["low", "medium", "high", "critical"];
  if (!VALID_TYPES.includes(report_type))
    return { error: "Invalid report type." };
  if (!VALID_URGENCY.includes(urgency))
    return { error: "Invalid urgency level." };

  const supabase = createAdminClient();

  let evidence_url = null;
  if (evidenceFile && evidenceFile.size > 0) {
    if (evidenceFile.size > 10 * 1024 * 1024)
      return { error: "Evidence file must be under 10MB." };
    const ext = evidenceFile.name.split(".").pop().toLowerCase();
    const filename = `security-evidence/${session.id}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("security-evidence")
      .upload(filename, evidenceFile, {
        contentType: evidenceFile.type,
        upsert: false,
      });
    if (!uploadError) {
      const { data: urlData } = await supabase.storage
        .from("security-evidence")
        .createSignedUrl(filename, 3600 * 24 * 7);
      evidence_url = urlData?.signedUrl || null;
    }
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
    console.error("[ERMS] fileSecurityReport error:", error);
    return { error: "Failed to submit report. Please try again." };
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

  return { success: true, reportId: data.id };
}

export async function updateSecurityReport(
  reportId,
  { status, resolution_notes },
) {
  const session = await getResultsSession();
  if (!session || session.role !== "state_admin")
    return { error: "Unauthorised." };

  const VALID_STATUSES = ["open", "investigating", "resolved"];
  if (!VALID_STATUSES.includes(status)) return { error: "Invalid status." };

  const supabase = createAdminClient();
  const hdrs = await headers();

  const update = {
    status,
    updated_at: new Date().toISOString(),
    ...(resolution_notes?.trim() && {
      resolution_notes: resolution_notes.trim(),
    }),
    ...(status === "resolved" && {
      resolved_by: session.id,
      resolved_at: new Date().toISOString(),
    }),
  };

  const { error } = await supabase
    .from("security_reports")
    .update(update)
    .eq("id", reportId);
  if (error) return { error: "Failed to update report." };

  await supabase.from("result_audit_log").insert({
    action: "UPDATE",
    table_name: "security_reports",
    record_id: reportId,
    performed_by: session.id,
    ip_address: hdrs.get("x-forwarded-for") || "unknown",
    user_agent: hdrs.get("user-agent") || "unknown",
    notes: `Security report status updated to: ${status}`,
  });

  return { success: true };
}

export async function runChecksumVerification(electionId) {
  const session = await getResultsSession();
  if (!session || session.role !== "state_admin")
    return { error: "Unauthorised." };
  if (!electionId) return { error: "Election ID required." };

  const supabase = createAdminClient();

  const { data: results, error } = await supabase
    .from("election_results")
    .select(
      `
      id, election_id, candidate_id, lga, ward, polling_unit,
      votes_cast, accredited_voters, registered_voters, checksum,
      candidate:candidate_id ( full_name, party ),
      submitter:submitted_by ( full_name )
    `,
    )
    .eq("election_id", electionId)
    .is("deleted_at", null);

  if (error) return { error: "Failed to fetch results for verification." };

  const mismatches = [];
  const hdrs = await headers();

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
        ip_address: hdrs.get("x-forwarded-for") || "unknown",
        user_agent: hdrs.get("user-agent") || "unknown",
        notes: `CHECKSUM MISMATCH — stored: ${record.checksum?.substring(0, 12)}... recomputed: ${recomputed?.substring(0, 12)}...`,
      });
    }
  }

  return {
    success: true,
    totalScanned: results.length,
    mismatchCount: mismatches.length,
    mismatches,
    scannedAt: new Date().toISOString(),
  };
}
