/**
 * lib/hooks/useCollation.js
 * React Query hooks for State Admin result collation views
 */

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/supabase/client";

// ─────────────────────────────────────────
// COLLATED RESULTS — per candidate per LGA
// ─────────────────────────────────────────

export function useCollatedResults(electionId) {
  const supabase = createClient();
  return useQuery({
    queryKey: ["collated-results", electionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_results_by_lga")
        .select("*")
        .eq("election_id", electionId)
        .order("lga");
      if (error) throw error;
      return data;
    },
    enabled: !!electionId,
    staleTime: 30_000,
    refetchInterval: 60_000, // auto-refresh every 60s during active elections
  });
}

// ─────────────────────────────────────────
// GRAND TOTALS — per candidate
// ─────────────────────────────────────────

export function useResultTotals(electionId) {
  const supabase = createClient();
  return useQuery({
    queryKey: ["result-totals", electionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_results_totals")
        .select("*")
        .eq("election_id", electionId)
        .order("grand_total_votes", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!electionId,
    staleTime: 30_000,
  });
}

// ─────────────────────────────────────────
// WARD-LEVEL BREAKDOWN for a single LGA
// ─────────────────────────────────────────

export function useWardBreakdown(electionId, lga) {
  const supabase = createClient();
  return useQuery({
    queryKey: ["ward-breakdown", electionId, lga],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("election_results")
        .select(
          `
          id, ward, polling_unit, votes_cast,
          accredited_voters, registered_voters,
          status, submitted_at, result_image_url, result_image_path,
          notes,
          candidate:candidate_id ( id, full_name, party ),
          submitter:submitted_by ( full_name )
        `,
        )
        .eq("election_id", electionId)
        .eq("lga", lga)
        .is("deleted_at", null)
        .order("ward")
        .order("polling_unit");
      if (error) throw error;
      return data;
    },
    enabled: !!(electionId && lga),
    staleTime: 30_000,
  });
}

// ─────────────────────────────────────────
// ALL RAW RESULTS for an election (for status updates)
// ─────────────────────────────────────────

export function useAllResults(electionId, filters = {}) {
  const supabase = createClient();
  return useQuery({
    queryKey: ["all-results", electionId, filters],
    queryFn: async () => {
      let query = supabase
        .from("election_results")
        .select(
          `
          id, lga, ward, polling_unit, votes_cast,
          accredited_voters, registered_voters,
          status, submitted_at, result_image_url, result_image_path,
          checksum, notes, deleted_at,
          candidate:candidate_id ( id, full_name, party ),
          submitter:submitted_by ( full_name, lga ),
          verifier:verified_by ( full_name )
        `,
        )
        .eq("election_id", electionId)
        .is("deleted_at", null)
        .order("submitted_at", { ascending: false });

      if (filters.status) query = query.eq("status", filters.status);
      if (filters.lga) query = query.eq("lga", filters.lga);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!electionId,
    staleTime: 20_000,
  });
}

// ─────────────────────────────────────────
// UPDATE RESULT STATUS (verify / dispute)
// ─────────────────────────────────────────

import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useUpdateResultStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ resultId, status, electionId }) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("election_results")
        .update({
          status,
          verified_by: status === "verified" ? undefined : null,
        })
        .eq("id", resultId);
      if (error) throw error;
      return { resultId, status };
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["all-results", vars.electionId],
      });
      queryClient.invalidateQueries({
        queryKey: ["collated-results", vars.electionId],
      });
      queryClient.invalidateQueries({
        queryKey: ["result-totals", vars.electionId],
      });
    },
  });
}
