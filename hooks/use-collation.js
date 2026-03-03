"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/supabase/client";
import { updateResultStatus } from "@/app/actions/election-auth";

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
    refetchInterval: 60_000,
  });
}

// ─────────────────────────────────────────
// GRAND TOTALS — per candidate across all LGAs
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
          status, submitted_at, result_image_url,
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
// POLLING UNIT BREAKDOWN for a single ward
// ─────────────────────────────────────────

export function usePUBreakdown(electionId, lga, ward) {
  const supabase = createClient();
  return useQuery({
    queryKey: ["pu-breakdown", electionId, lga, ward],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("election_results")
        .select(
          `
          id, polling_unit, votes_cast,
          accredited_voters, registered_voters,
          status, submitted_at, result_image_url, notes, checksum,
          candidate:candidate_id ( id, full_name, party ),
          submitter:submitted_by ( full_name )
        `,
        )
        .eq("election_id", electionId)
        .eq("lga", lga)
        .eq("ward", ward)
        .is("deleted_at", null)
        .order("polling_unit");
      if (error) throw error;
      return data;
    },
    enabled: !!(electionId && lga && ward),
    staleTime: 30_000,
  });
}

// ─────────────────────────────────────────
// LGA SUMMARY STATS — for State Admin dashboard
// ─────────────────────────────────────────

export function useLGASummary(electionId) {
  const supabase = createClient();
  return useQuery({
    queryKey: ["lga-summary", electionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_lga_summary")
        .select("*")
        .eq("election_id", electionId)
        .order("lga");
      if (error) throw error;
      return data;
    },
    enabled: !!electionId,
    staleTime: 30_000,
  });
}

// ─────────────────────────────────────────
// ALL RAW RESULTS for an election (status management)
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
          status, submitted_at, result_image_url,
          checksum, notes, deleted_at,
          candidate:candidate_id ( id, full_name, party ),
          submitter:submitted_by ( full_name, lga, ward, polling_unit ),
          verifier:verified_by ( full_name )
        `,
        )
        .eq("election_id", electionId)
        .is("deleted_at", null)
        .order("submitted_at", { ascending: false });

      if (filters.status) query = query.eq("status", filters.status);
      if (filters.lga) query = query.eq("lga", filters.lga);
      if (filters.ward) query = query.eq("ward", filters.ward);

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

export function useUpdateResultStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ resultId, status, electionId }) => {
      const res = await updateResultStatus(resultId, status);
      if (res.error) throw new Error(res.error);
      return { resultId, status, electionId };
    },
    onSuccess: ({ electionId }) => {
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ["all-results", electionId] });
      queryClient.invalidateQueries({
        queryKey: ["collated-results", electionId],
      });
      queryClient.invalidateQueries({
        queryKey: ["result-totals", electionId],
      });
    },
    onError: (err) => {
      console.error("[useUpdateResultStatus] Failed:", err.message);
    },
  });
}
