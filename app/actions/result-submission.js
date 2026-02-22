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

export async function submitElectionResult(payload) {
  // ── Auth ────────────────────────────────
  const session = await getResultsSession();
  if (!session || session.role !== "lga_admin") {
    return { error: "Unauthorised. Only LGA Admins can submit results." };
  }
  if (!session.is_active) {
    return { error: "Your account is deactivated. Contact the State Admin." };
  }

  const {
    electionId,
    ward,
    pollingUnit,
    candidateVotes, // [{ candidateId, votes }]
    accreditedVoters,
    registeredVoters,
    notes,
    imageFile,
  } = payload;

  // ── Validate required fields ────────────
  if (!electionId) return { error: "Election is required." };
  if (!ward?.trim()) return { error: "Ward is required." };
  if (!pollingUnit?.trim()) return { error: "Polling unit is required." };
  if (!candidateVotes?.length)
    return { error: "At least one candidate vote entry is required." };
  if (accreditedVoters == null || accreditedVoters < 0)
    return { error: "Accredited voters count is required." };
  if (registeredVoters == null || registeredVoters < 0)
    return { error: "Registered voters count is required." };

  const lga = session.lga;
  if (!VALID_LGAS.includes(lga))
    return { error: "Invalid LGA on your account." };

  const supabase = createClient();
  const ipAddress = (await headers()).get("x-forwarded-for") || "unknown";
  const userAgent = (await headers()).get("user-agent") || "unknown";

  // ── Validate election is active ─────────
  const { data: election } = await supabase
    .from("elections")
    .select("id, status, title")
    .eq("id", electionId)
    .single();

  if (!election) return { error: "Election not found." };
  if (election.status !== "active") {
    return {
      error: `Results can only be submitted for active elections. This election is "${election.status}".`,
    };
  }

  // ── Validate votes ──────────────────────
  for (const { candidateId, votes } of candidateVotes) {
    if (!candidateId) return { error: "Invalid candidate in submission." };
    if (votes == null || votes < 0)
      return { error: "Votes cannot be negative." };
    if (!Number.isInteger(Number(votes)))
      return { error: "Votes must be whole numbers." };
  }

  const totalVotes = candidateVotes.reduce(
    (sum, { votes }) => sum + Number(votes),
    0,
  );
  if (totalVotes > Number(accreditedVoters)) {
    return {
      error: `Total votes cast (${totalVotes}) cannot exceed accredited voters (${accreditedVoters}).`,
    };
  }

  // ── Check for duplicate submission ──────
  // Same election + LGA + ward + polling_unit should not already exist (active)
  const { count: dupeCount } = await supabase
    .from("election_results")
    .select("*", { count: "exact", head: true })
    .eq("election_id", electionId)
    .eq("lga", lga)
    .eq("ward", ward.trim())
    .eq("polling_unit", pollingUnit.trim())
    .is("deleted_at", null);

  if (dupeCount > 0) {
    return {
      error: `A result for ${pollingUnit} (${ward}) has already been submitted for this election. File a security report if a correction is needed.`,
    };
  }

  // ── Image upload ────────────────────────
  let resultImageUrl = null;
  let resultImagePath = null;

  if (imageFile && imageFile.size > 0) {
    if (imageFile.size > MAX_IMAGE_SIZE) {
      return { error: "Image must be under 10MB." };
    }
    if (!["image/jpeg", "image/png"].includes(imageFile.type)) {
      return { error: "Only JPEG and PNG images are accepted." };
    }

    const ext = imageFile.type === "image/png" ? "png" : "jpg";
    const filename = `${lga.replace(/\s+/g, "-")}/${electionId}/${pollingUnit.replace(/\s+/g, "-")}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("results-images")
      .upload(filename, imageFile, {
        contentType: imageFile.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("[ERMS] Image upload error:", uploadError);
      return {
        error: "Failed to upload result sheet image. Please try again.",
      };
    }

    resultImagePath = filename;

    // Signed URL (1hr expiry) — images are not public
    const { data: signedData } = await supabase.storage
      .from("results-images")
      .createSignedUrl(filename, 3600);

    resultImageUrl = signedData?.signedUrl || null;
  }

  // ── Compute checksum + insert rows ──────
  const insertedIds = [];
  const errors = [];

  for (const { candidateId, votes } of candidateVotes) {
    const checksum = await computeResultChecksum({
      electionId,
      candidateId,
      lga,
      ward: ward.trim(),
      pollingUnit: pollingUnit.trim(),
      votesCast: Number(votes),
      accreditedVoters: Number(accreditedVoters),
      registeredVoters: Number(registeredVoters),
    });

    const { data: row, error: insertError } = await supabase
      .from("election_results")
      .insert({
        election_id: electionId,
        lga,
        ward: ward.trim(),
        polling_unit: pollingUnit.trim(),
        candidate_id: candidateId,
        votes_cast: Number(votes),
        accredited_voters: Number(accreditedVoters),
        registered_voters: Number(registeredVoters),
        result_image_url: resultImageUrl,
        result_image_path: resultImagePath,
        checksum,
        notes: notes?.trim() || null,
        status: "pending",
        submitted_by: session.id,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("[ERMS] Result insert error:", insertError);
      errors.push(candidateId);
    } else {
      insertedIds.push(row.id);
    }
  }

  if (errors.length > 0) {
    return {
      error: `Submission partially failed for ${errors.length} candidate(s). Please retry.`,
    };
  }

  // ── Log submission event ────────────────
  await supabase.from("result_audit_log").insert({
    action: "INSERT",
    table_name: "election_results",
    performed_by: session.id,
    ip_address: ipAddress,
    user_agent: userAgent,
    notes: `Submitted results for ${pollingUnit} (${ward}, ${lga}) — ${electionId}`,
  });

  return {
    success: true,
    insertedIds,
    pollingUnit: pollingUnit.trim(),
    ward: ward.trim(),
    lga,
  };
}
