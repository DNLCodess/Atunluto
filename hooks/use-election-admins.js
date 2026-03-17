// hooks/use-election-admins.js
// React Query hooks for LGA Admins and PU Agents in the results portal.
// Ward/PU data lives in hooks/use-pu.js — import from there.

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchLGAAdmins } from "@/app/actions/election-admins";

const LGA_ADMIN_KEY = ["election-admins"];
const STATE_ADMIN_KEY = ["election-state-admins"];

// ─── LGA Admins ───────────────────────────────────────────────────────────────

export function useLGAAdmins() {
  return useQuery({
    queryKey: LGA_ADMIN_KEY,
    queryFn: async () => {
      const data = await fetchLGAAdmins();
      if (data?.error) throw new Error(data.error);
      return data;
    },
    staleTime: 30_000,
    retry: 1,
  });
}

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
      await queryClient.cancelQueries({ queryKey: LGA_ADMIN_KEY });
      const previous = queryClient.getQueryData(LGA_ADMIN_KEY);
      queryClient.setQueryData(LGA_ADMIN_KEY, (old) =>
        old?.map((a) => (a.id === adminId ? { ...a, is_active: activate } : a)),
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      queryClient.setQueryData(LGA_ADMIN_KEY, ctx.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: LGA_ADMIN_KEY }),
  });
}

// ─── Election State Admins ────────────────────────────────────────────────────

export function useElectionStateAdmins() {
  return useQuery({
    queryKey: STATE_ADMIN_KEY,
    queryFn: async () => {
      const { fetchElectionStateAdmins } = await import(
        "@/app/actions/election-admins"
      );
      const data = await fetchElectionStateAdmins();
      if (data?.error) throw new Error(data.error);
      return data;
    },
    staleTime: 30_000,
    retry: 1,
  });
}

export function useToggleElectionStateAdminStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ adminId, activate }) => {
      const { toggleElectionStateAdminStatus } = await import(
        "@/app/actions/election-auth"
      );
      const result = await toggleElectionStateAdminStatus(adminId, activate);
      if (result?.error) throw new Error(result.error);
      return result;
    },
    onMutate: async ({ adminId, activate }) => {
      await queryClient.cancelQueries({ queryKey: STATE_ADMIN_KEY });
      const previous = queryClient.getQueryData(STATE_ADMIN_KEY);
      queryClient.setQueryData(STATE_ADMIN_KEY, (old) =>
        old?.map((a) => (a.id === adminId ? { ...a, is_active: activate } : a)),
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) =>
      queryClient.setQueryData(STATE_ADMIN_KEY, ctx.previous),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: STATE_ADMIN_KEY }),
  });
}

export function useDeleteElectionAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (adminId) => {
      const { deleteElectionAdmin } = await import(
        "@/app/actions/election-admins"
      );
      const result = await deleteElectionAdmin(adminId);
      if (result?.error) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STATE_ADMIN_KEY });
      queryClient.invalidateQueries({ queryKey: LGA_ADMIN_KEY });
    },
  });
}

// ─── PU Agents ────────────────────────────────────────────────────────────────

export function usePUAdmins(lgaFilter) {
  return useQuery({
    queryKey: ["pu-admins", lgaFilter],
    queryFn: async () => {
      const { fetchPUAdmins } = await import("@/app/actions/election-admins");
      const data = await fetchPUAdmins(lgaFilter);
      if (data?.error) throw new Error(data.error);
      return data;
    },
    staleTime: 30_000,
    retry: 1,
  });
}

export function useTogglePUAdminStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ adminId, activate }) => {
      const { togglePUAdminStatus } =
        await import("@/app/actions/election-auth");
      const result = await togglePUAdminStatus(adminId, activate);
      if (result?.error) throw new Error(result.error);
      return result;
    },
    onMutate: async ({ adminId, activate }) => {
      await queryClient.cancelQueries({ queryKey: ["pu-admins"] });
      const previous = queryClient.getQueriesData({ queryKey: ["pu-admins"] });
      queryClient.setQueriesData({ queryKey: ["pu-admins"] }, (old) =>
        old?.map?.((a) =>
          a.id === adminId ? { ...a, is_active: activate } : a,
        ),
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      ctx?.previous?.forEach(([key, val]) =>
        queryClient.setQueryData(key, val),
      );
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["pu-admins"] }),
  });
}
