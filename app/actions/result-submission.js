"use server";

/**
 * app/actions/resultSubmission.js
 * Server action for LGA Admin result submission.
 * Handles: validation, image upload, checksum computation, DB insert, audit.
 */

import { getResultsSession } from "@/app/actions/election-auth";
import { computeResultChecksum } from "@/utils/results-checksum";
import { headers } from "next/headers";
import { createAdminClient } from "@/supabase/admin";
import { signUpload } from "@/lib/cloudinary";

export async function getResultImageUploadUrl({
  fileName,
  fileType,
  fileSize,
}) {
  const session = await getResultsSession();
  if (!session || !["lga_admin", "polling_unit_admin"].includes(session.role))
    return { error: "Unauthorised." };

  if (fileSize > 10 * 1024 * 1024)
    return { error: "Image must be under 10MB." };

  const ALLOWED = ["image/jpeg", "image/png"];
  if (!ALLOWED.includes(fileType))
    return { error: "Only JPEG and PNG are allowed." };

  const ward = session.ward ? `/${session.ward.replace(/\s+/g, "_")}` : "";
  const folder = `results-images/${session.lga}${ward}`;

  return { ...signUpload(folder), uploadType: "image" };
}

export async function submitElectionResult(payload) {
  const session = await getResultsSession();
  if (!session || !["lga_admin", "polling_unit_admin"].includes(session.role))
    return { error: "Unauthorised." };

  const {
    electionId,
    ward,
    pollingUnit,
    candidateVotes,
    accreditedVoters,
    registeredVoters,
    notes,
    imageUrl,
  } = payload;

  if (!electionId) return { error: "Election is required." };
  if (!ward?.trim()) return { error: "Ward is required." };
  if (!pollingUnit?.trim()) return { error: "Polling unit is required." };
  if (!Array.isArray(candidateVotes) || candidateVotes.length === 0)
    return { error: "Candidate votes are required." };

  const supabase = createAdminClient();
  const hdrs = await headers();

  // Verify election is still active
  const { data: election } = await supabase
    .from("elections")
    .select("status")
    .eq("id", electionId)
    .single();

  if (!election) return { error: "Election not found." };
  if (election.status !== "active")
    return { error: "This election is no longer accepting submissions." };

  const result_image_url = imageUrl || null;
  const result_image_path = null;

  // Insert one row per candidate
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

  // Compute checksums per row
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
    console.error("[ERMS] submitElectionResult error:", error);
    return { error: "Failed to submit results. Please try again." };
  }

  await supabase.from("result_audit_log").insert({
    action: "INSERT",
    table_name: "election_results",
    record_id: null,
    performed_by: session.id,
    ip_address: hdrs.get("x-forwarded-for") || "unknown",
    user_agent: hdrs.get("user-agent") || "unknown",
    notes: `Results submitted for ${ward} — ${pollingUnit} (${candidateVotes.length} candidates)`,
  });

  return {
    success: true,
    pollingUnit: pollingUnit.trim(),
    ward: ward.trim(),
    lga: session.lga,
  };
}
