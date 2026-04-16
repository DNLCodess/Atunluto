// hooks/use-elections.js
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const BASE = "/results-portal/api/elections";

const ELECTIONS_KEY = ["elections"];
const CANDIDATES_KEY = (electionId) => ["candidates", electionId];

async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json();
  if (!res.ok || data?.error) throw new Error(data?.error || "Request failed.");
  return data;
}

// ─── Elections ────────────────────────────────────────────────────────────────

export function useElections() {
  return useQuery({
    queryKey: ELECTIONS_KEY,
    queryFn: () => apiFetch(BASE),
    staleTime: 60_000,
  });
}

export function useCreateElection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) =>
      apiFetch(BASE, { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ELECTIONS_KEY }),
  });
}

export function useUpdateElectionStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ electionId, status }) =>
      apiFetch(`${BASE}/${electionId}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "update-status", status }),
      }),
    onMutate: async ({ electionId, status }) => {
      await queryClient.cancelQueries({ queryKey: ELECTIONS_KEY });
      const previous = queryClient.getQueryData(ELECTIONS_KEY);
      queryClient.setQueryData(ELECTIONS_KEY, (old) =>
        old?.map((e) => (e.id === electionId ? { ...e, status } : e)),
      );
      return { previous };
    },
    onError: (_e, _v, ctx) =>
      queryClient.setQueryData(ELECTIONS_KEY, ctx.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ELECTIONS_KEY }),
  });
}

export function useToggleElectionPublic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ electionId, isPublic }) =>
      apiFetch(`${BASE}/${electionId}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "toggle-public", is_public: isPublic }),
      }),
    onMutate: async ({ electionId, isPublic }) => {
      await queryClient.cancelQueries({ queryKey: ELECTIONS_KEY });
      const previous = queryClient.getQueryData(ELECTIONS_KEY);
      queryClient.setQueryData(ELECTIONS_KEY, (old) =>
        old?.map((e) =>
          e.id === electionId ? { ...e, is_public: isPublic } : e,
        ),
      );
      return { previous };
    },
    onError: (_e, _v, ctx) =>
      queryClient.setQueryData(ELECTIONS_KEY, ctx.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ELECTIONS_KEY }),
  });
}

// ─── Candidates ───────────────────────────────────────────────────────────────

export function useCandidates(electionId) {
  return useQuery({
    queryKey: CANDIDATES_KEY(electionId),
    queryFn: () => apiFetch(`${BASE}/${electionId}/candidates`),
    enabled: !!electionId,
    staleTime: 60_000,
  });
}

export function useAddCandidate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ electionId, ...payload }) =>
      apiFetch(`${BASE}/${electionId}/candidates`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({
        queryKey: CANDIDATES_KEY(vars.electionId),
      });
    },
  });
}

export function useDeleteCandidate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ electionId, candidateId }) =>
      apiFetch(`${BASE}/${electionId}/candidates/${candidateId}`, {
        method: "DELETE",
      }),
    onMutate: async ({ candidateId, electionId }) => {
      await queryClient.cancelQueries({ queryKey: CANDIDATES_KEY(electionId) });
      const previous = queryClient.getQueryData(CANDIDATES_KEY(electionId));
      queryClient.setQueryData(CANDIDATES_KEY(electionId), (old) =>
        old?.filter((c) => c.id !== candidateId),
      );
      return { previous, electionId };
    },
    onError: (_e, _v, ctx) => {
      queryClient.setQueryData(CANDIDATES_KEY(ctx.electionId), ctx.previous);
    },
    onSettled: (_d, _e, vars) => {
      queryClient.invalidateQueries({
        queryKey: CANDIDATES_KEY(vars.electionId),
      });
    },
  });
}
