/**
 * hooks/use-election-results.js
 * React Query hooks for result submission and result viewing.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const BASE = "/results-portal/api/results";

async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json();
  if (!res.ok || data?.error) throw new Error(data?.error || "Request failed.");
  return data;
}

// ─── Active Elections ─────────────────────────────────────────────────────────

export function useActiveElections() {
  return useQuery({
    queryKey: ["active-elections"],
    queryFn: () => apiFetch(`${BASE}/active`),
    staleTime: 60_000,
  });
}

// ─── Candidates for an Election ───────────────────────────────────────────────

export function useElectionCandidates(electionId) {
  return useQuery({
    queryKey: ["election-candidates", electionId],
    queryFn: () =>
      apiFetch(`${BASE}/candidates?electionId=${encodeURIComponent(electionId)}`),
    enabled: !!electionId,
    staleTime: 120_000,
  });
}

// ─── My Submissions ───────────────────────────────────────────────────────────

export function useMyResults(adminId, electionId) {
  return useQuery({
    queryKey: ["my-results", adminId, electionId],
    queryFn: () => {
      const params = new URLSearchParams({ adminId });
      if (electionId) params.set("electionId", electionId);
      return apiFetch(`${BASE}/mine?${params}`);
    },
    enabled: !!adminId,
    staleTime: 30_000,
  });
}

// ─── Submit Result ────────────────────────────────────────────────────────────

export function useSubmitResult() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) =>
      apiFetch(BASE, { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-results"] });
    },
  });
}
