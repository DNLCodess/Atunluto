/**
 * lib/hooks/useElectionResults.js
 * React Query hooks for result submission and LGA Admin result viewing
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/supabase/client";

const MY_RESULTS_KEY = (adminId) => ["my-results", adminId];
const LGA_RESULTS_KEY = (electionId) => ["lga-results", electionId];

// ─────────────────────────────────────────
// ACTIVE ELECTIONS (for submission dropdown)
// ─────────────────────────────────────────

export function useActiveElections() {
  const supabase = createClient();
  return useQuery({
    queryKey: ["active-elections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("elections")
        .select("id, title, election_type, election_date")
        .eq("status", "active")
        .order("election_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    staleTime: 60_000,
  });
}

// ─────────────────────────────────────────
// CANDIDATES FOR AN ELECTION
// ─────────────────────────────────────────

export function useElectionCandidates(electionId) {
  const supabase = createClient();
  return useQuery({
    queryKey: ["election-candidates", electionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("candidates")
        .select("id, full_name, party, position, photo_url")
        .eq("election_id", electionId)
        .order("party");
      if (error) throw error;
      return data;
    },
    enabled: !!electionId,
    staleTime: 120_000,
  });
}

// ─────────────────────────────────────────
// LGA WARD DATA (from existing lgas table)
// ─────────────────────────────────────────

export function useLGAWards(lga) {
  const supabase = createClient();
  return useQuery({
    queryKey: ["lga-wards", lga],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lgas")
        .select("wards")
        .eq("name", lga)
        .single();
      if (error) throw error;
      // wards is a JSON array of { name, polling_units: [...] }
      return data?.wards || [];
    },
    enabled: !!lga,
    staleTime: Infinity, // ward data doesn't change
  });
}

// ─────────────────────────────────────────
// MY SUBMISSIONS (LGA Admin view)
// ─────────────────────────────────────────

export function useMyResults(adminId, electionId) {
  const supabase = createClient();
  return useQuery({
    queryKey: [...MY_RESULTS_KEY(adminId), electionId],
    queryFn: async () => {
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
      if (error) throw error;
      return data;
    },
    enabled: !!adminId,
    staleTime: 30_000,
  });
}

// ─────────────────────────────────────────
// SUBMIT RESULT
// ─────────────────────────────────────────

export function useSubmitResult() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { submitElectionResult } =
        await import("@/app/actions/resultSubmission");
      const result = await submitElectionResult(payload);
      if (result?.error) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      // Invalidate all result-related queries
      queryClient.invalidateQueries({ queryKey: ["my-results"] });
    },
  });
}
