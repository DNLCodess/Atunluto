"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchLGAAdmins } from "@/app/actions/election-admins";

const QUERY_KEY = ["election-admins"];

// ─────────────────────────────────────────
// FETCH ALL LGA ADMINS
// ─────────────────────────────────────────

export function useLGAAdmins() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => fetchLGAAdmins(),
    staleTime: 30_000,
  });
}

// ─────────────────────────────────────────
// TOGGLE ACTIVE STATUS (optimistic)
// ─────────────────────────────────────────

export function useToggleLGAAdminStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ adminId, activate }) => {
      const { toggleLGAAdminStatus } =
        await import("@/app/actions/election-auth");
      const result = await toggleLGAAdminStatus(adminId, activate);
      if (result?.error) throw new Error(result.error);
      return result;
    },
    onMutate: async ({ adminId, activate }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData(QUERY_KEY);
      queryClient.setQueryData(QUERY_KEY, (old) =>
        old?.map((a) => (a.id === adminId ? { ...a, is_active: activate } : a)),
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      queryClient.setQueryData(QUERY_KEY, ctx.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}
