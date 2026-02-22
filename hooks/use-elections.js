"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchElections, fetchCandidates } from "@/app/actions/elections";

const ELECTIONS_KEY = ["elections"];
const CANDIDATES_KEY = (electionId) => ["candidates", electionId];

// ─────────────────────────────────────────
// ELECTIONS
// ─────────────────────────────────────────

export function useElections() {
  return useQuery({
    queryKey: ELECTIONS_KEY,
    queryFn: () => fetchElections(),
    staleTime: 60_000,
  });
}

export function useCreateElection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { registerElection } = await import("@/app/actions/elections");
      const result = await registerElection(payload);
      if (result?.error) throw new Error(result.error);
      return result;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ELECTIONS_KEY }),
  });
}

export function useUpdateElectionStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ electionId, status }) => {
      const { updateElectionStatus } = await import("@/app/actions/elections");
      const result = await updateElectionStatus(electionId, status);
      if (result?.error) throw new Error(result.error);
      return result;
    },
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
    mutationFn: async ({ electionId, isPublic }) => {
      const { toggleElectionPublic } = await import("@/app/actions/elections");
      const result = await toggleElectionPublic(electionId, isPublic);
      if (result?.error) throw new Error(result.error);
      return result;
    },
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

// ─────────────────────────────────────────
// CANDIDATES
// ─────────────────────────────────────────

export function useCandidates(electionId) {
  return useQuery({
    queryKey: CANDIDATES_KEY(electionId),
    queryFn: () => fetchCandidates(electionId),
    enabled: !!electionId,
    staleTime: 60_000,
  });
}

export function useAddCandidate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { addCandidate } = await import("@/app/actions/elections");
      const result = await addCandidate(payload);
      if (result?.error) throw new Error(result.error);
      return result;
    },
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
    mutationFn: async ({ candidateId, electionId }) => {
      const { deleteCandidate } = await import("@/app/actions/elections");
      const result = await deleteCandidate(candidateId);
      if (result?.error) throw new Error(result.error);
      return result;
    },
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
