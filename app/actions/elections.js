"use server";

/**
 * app/actions/electionsActions.js
 */

import { createAdminClient } from "@/supabase/admin";
import { getResultsSession } from "@/app/actions/election-auth";

const VALID_TYPES = [
  "senatorial",
  "house_of_reps",
  "governorship",
  "local_government",
];
const VALID_STATUSES = ["upcoming", "active", "concluded"];
const VALID_TRANSITIONS = {
  upcoming: ["active"],
  active: ["concluded"],
  concluded: [],
};

export async function registerElection(payload) {
  const session = await getResultsSession();
  if (!session || session.role !== "state_admin")
    return { error: "Unauthorised." };

  const { title, election_type, election_date, status = "upcoming" } = payload;

  if (!title?.trim()) return { error: "Election title is required." };
  if (!election_type) return { error: "Election type is required." };
  if (!election_date) return { error: "Election date is required." };
  if (!VALID_TYPES.includes(election_type))
    return { error: "Invalid election type." };
  if (!VALID_STATUSES.includes(status)) return { error: "Invalid status." };

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("elections")
    .insert({
      title: title.trim(),
      election_type,
      election_date,
      status,
      created_by: session.id,
    })
    .select("id, title, election_type, election_date, status")
    .single();

  if (error) {
    console.error("[ERMS] registerElection error:", error);
    return { error: "Failed to register election. Please try again." };
  }

  return { success: true, election: data };
}

export async function updateElectionStatus(electionId, newStatus) {
  const session = await getResultsSession();
  if (!session || session.role !== "state_admin")
    return { error: "Unauthorised." };
  if (!electionId) return { error: "Election ID required." };

  const supabase = createAdminClient();

  const { data: current, error: fetchError } = await supabase
    .from("elections")
    .select("status, title")
    .eq("id", electionId)
    .single();

  if (fetchError || !current) return { error: "Election not found." };

  const allowed = VALID_TRANSITIONS[current.status];
  if (!allowed.includes(newStatus)) {
    return {
      error: `Cannot transition from "${current.status}" to "${newStatus}".`,
    };
  }

  const { error } = await supabase
    .from("elections")
    .update({ status: newStatus })
    .eq("id", electionId);

  if (error) return { error: "Failed to update election status." };
  return { success: true };
}

export async function toggleElectionPublic(electionId, isPublic) {
  const session = await getResultsSession();
  if (!session || session.role !== "state_admin")
    return { error: "Unauthorised." };

  const supabase = createAdminClient();

  const { data: current } = await supabase
    .from("elections")
    .select("status")
    .eq("id", electionId)
    .single();

  if (!current) return { error: "Election not found." };
  if (isPublic && current.status !== "concluded") {
    return { error: "Only concluded elections can be made public." };
  }

  const { error } = await supabase
    .from("elections")
    .update({ is_public: isPublic })
    .eq("id", electionId);

  if (error) return { error: "Failed to update visibility." };
  return { success: true };
}

export async function addCandidate(payload) {
  const session = await getResultsSession();
  if (!session || session.role !== "state_admin")
    return { error: "Unauthorised." };

  const { electionId, full_name, party, position, lga, photoFile } = payload;

  if (!electionId) return { error: "Election ID is required." };
  if (!full_name?.trim()) return { error: "Candidate name is required." };
  if (!party?.trim()) return { error: "Party affiliation is required." };
  if (!position?.trim()) return { error: "Position/seat is required." };

  const supabase = createAdminClient();

  const { data: election } = await supabase
    .from("elections")
    .select("status")
    .eq("id", electionId)
    .single();

  if (!election) return { error: "Election not found." };
  if (election.status === "concluded") {
    return { error: "Cannot add candidates to a concluded election." };
  }

  let photo_url = null;
  if (photoFile && photoFile.size > 0) {
    const ext = photoFile.name.split(".").pop().toLowerCase();
    const filename = `candidates/${electionId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("results-images")
      .upload(filename, photoFile, {
        contentType: photoFile.type,
        upsert: false,
      });

    if (!uploadError) {
      const { data: urlData } = supabase.storage
        .from("results-images")
        .getPublicUrl(filename);
      photo_url = urlData?.publicUrl || null;
    }
  }

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

  if (error) {
    console.error("[ERMS] addCandidate error:", error);
    return { error: "Failed to add candidate." };
  }

  return { success: true, candidate: data };
}

export async function deleteCandidate(candidateId) {
  const session = await getResultsSession();
  if (!session || session.role !== "state_admin")
    return { error: "Unauthorised." };

  const supabase = createAdminClient();

  const { count } = await supabase
    .from("election_results")
    .select("*", { count: "exact", head: true })
    .eq("candidate_id", candidateId)
    .is("deleted_at", null);

  if (count > 0) {
    return {
      error: `Cannot remove this candidate — ${count} result submission(s) already exist.`,
    };
  }

  const { error } = await supabase
    .from("candidates")
    .delete()
    .eq("id", candidateId);
  if (error) return { error: "Failed to remove candidate." };
  return { success: true };
}
export async function fetchElections() {
  const session = await getResultsSession();
  if (!session) return { error: "Unauthorised." };

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("elections")
    .select(
      `id, title, election_type, election_date, status, is_public, created_at, creator:created_by ( full_name )`,
    )
    .order("election_date", { ascending: false });

  if (error) return { error: error.message };
  return data;
}

export async function fetchCandidates(electionId) {
  const session = await getResultsSession();
  if (!session) return { error: "Unauthorised." };

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("candidates")
    .select("id, full_name, party, lga, photo_url, position, created_at")
    .eq("election_id", electionId)
    .order("party");

  if (error) return { error: error.message };
  return data;
}
