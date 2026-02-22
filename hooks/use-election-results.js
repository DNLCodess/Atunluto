/**
 * lib/hooks/use-election-results.js
 * React Query hooks for result submission and LGA Admin result viewing.
 * All data fetching delegated to server actions — no Supabase client in browser.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchActiveElections,
  fetchElectionCandidates,
  fetchLGAWards,
  fetchMyResults,
} from "@/app/actions/results-fetch";

// ─────────────────────────────────────────
// ACTIVE ELECTIONS
// ─────────────────────────────────────────

export function useActiveElections() {
  return useQuery({
    queryKey: ["active-elections"],
    queryFn: async () => {
      const data = await fetchActiveElections();
      if (data?.error) throw new Error(data.error);
      return data;
    },
    staleTime: 60_000,
  });
}

// ─────────────────────────────────────────
// CANDIDATES FOR AN ELECTION
// ─────────────────────────────────────────

export function useElectionCandidates(electionId) {
  return useQuery({
    queryKey: ["election-candidates", electionId],
    queryFn: async () => {
      const data = await fetchElectionCandidates(electionId);
      if (data?.error) throw new Error(data.error);
      return data;
    },
    enabled: !!electionId,
    staleTime: 120_000,
  });
}

// ─────────────────────────────────────────
// LGA WARDS
// ─────────────────────────────────────────

export function useLGAWards(lga) {
  return useQuery({
    queryKey: ["lga-wards", lga],
    queryFn: async () => {
      const data = await fetchLGAWards(lga);
      if (data?.error) throw new Error(data.error);
      return data;
    },
    enabled: !!lga,
    staleTime: Infinity,
  });
}

// ─────────────────────────────────────────
// MY SUBMISSIONS
// ─────────────────────────────────────────

export function useMyResults(adminId, electionId) {
  return useQuery({
    queryKey: ["my-results", adminId, electionId],
    queryFn: async () => {
      const data = await fetchMyResults(adminId, electionId);
      if (data?.error) throw new Error(data.error);
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
        await import("@/app/actions/result-submission");
      const result = await submitElectionResult(payload);
      if (result?.error) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-results"] });
    },
  });
}
