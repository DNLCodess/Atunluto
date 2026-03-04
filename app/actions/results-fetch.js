"use server";

/**
 * app/actions/results-fetch.js
 *
 * NOTE: Ward and polling unit data is NOT fetched here.
 * Use useWardsForLGA / usePollingUnitsForWard from @/hooks/use-pu
 * in any component that needs cascading LGA → Ward → PU dropdowns.
 */

import { createAdminClient } from "@/supabase/admin";

export async function fetchActiveElections() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("elections")
      .select("id, title, election_type, election_date")
      .eq("status", "active")
      .order("election_date", { ascending: false });
    if (error) return { error: error.message };
    return data;
  } catch (err) {
    return { error: err.message };
  }
}

export async function fetchElectionCandidates(electionId) {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("candidates")
      .select("id, full_name, party, position, photo_url")
      .eq("election_id", electionId)
      .order("party");
    if (error) return { error: error.message };
    return data;
  } catch (err) {
    return { error: err.message };
  }
}

export async function fetchMyResults(adminId, electionId) {
  try {
    const supabase = createAdminClient();
    let query = supabase
      .from("election_results")
      .select(
        `
        id, lga, ward, polling_unit,
        votes_cast, accredited_voters, registered_voters,
        result_image_url, notes, status, submitted_at, checksum,
        candidate:candidate_id ( id, full_name, party ),
        election:election_id ( id, title )
      `,
      )
      .eq("submitted_by", adminId)
      .is("deleted_at", null)
      .order("submitted_at", { ascending: false });

    if (electionId) query = query.eq("election_id", electionId);

    const { data, error } = await query;
    if (error) return { error: error.message };
    return data;
  } catch (err) {
    return { error: err.message };
  }
}
