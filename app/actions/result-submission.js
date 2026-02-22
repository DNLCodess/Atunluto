"use server";

/**
 * app/actions/resultSubmission.js
 * Server action for LGA Admin result submission.
 * Handles: validation, image upload, checksum computation, DB insert, audit.
 */

import { createClient } from "@/supabase/server";
import { getResultsSession } from "@/app/actions/election-auth";
import { computeResultChecksum } from "@/utils/results-checksum";
import { headers } from "next/headers";
import { createAdminClient } from "@/supabase/admin";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const VALID_LGAS = [
  "Ibadan North",
  "Ibadan North-East",
  "Ibadan North-West",
  "Ibadan South-East",
  "Ibadan South-West",
  "Ibarapa Central",
  "Ibarapa East",
  "Ibarapa North",
  "Ido",
];

export async function getResultImageUploadUrl({
  fileName,
  fileType,
  fileSize,
}) {
  const session = await getResultsSession();
  if (!session || session.role !== "lga_admin")
    return { error: "Unauthorised." };

  if (fileSize > 10 * 1024 * 1024)
    return { error: "Image must be under 10MB." };

  const ALLOWED = ["image/jpeg", "image/png"];
  if (!ALLOWED.includes(fileType))
    return { error: "Only JPEG and PNG are allowed." };

  const ext = fileName.split(".").pop().toLowerCase();
  const path = `${session.lga}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const supabase = createAdminClient();

  const { data, error } = await supabase.storage
    .from("results-images")
    .createSignedUploadUrl(path);

  if (error) return { error: "Failed to generate upload URL." };

  return { uploadUrl: data.signedUrl, path };
}

export async function submitElectionResult(payload) {
  const session = await getResultsSession();
  if (!session || session.role !== "lga_admin")
    return { error: "Unauthorised." };

  const {
    electionId,
    ward,
    pollingUnit,
    candidateVotes,
    accreditedVoters,
    registeredVoters,
    notes,
    imagePath,
  } = payload;
  // imagePath is a storage path string — file was uploaded directly by browser

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

  // Generate signed read URL for the already-uploaded image
  let result_image_url = null;
  let result_image_path = null;

  if (imagePath) {
    const { data: readData, error: readError } = await supabase.storage
      .from("results-images")
      .createSignedUrl(imagePath, 60 * 60 * 24 * 365); // 1 year

    if (readError) {
      console.error("[ERMS] createSignedUrl error:", readError);
      return { error: "Failed to process uploaded image. Please try again." };
    }
    result_image_url = readData.signedUrl;
    result_image_path = imagePath;
  }

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
    status: "pending",
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
