// hooks/use-election-admins.js
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const BASE = "/results-portal/api/admins";

const LGA_ADMIN_KEY = ["election-admins"];
const STATE_ADMIN_KEY = ["election-state-admins"];

async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json();
  if (!res.ok || data?.error) throw new Error(data?.error || "Request failed.");
  return data;
}

// ─── LGA Admins ───────────────────────────────────────────────────────────────

export function useLGAAdmins() {
  return useQuery({
    queryKey: LGA_ADMIN_KEY,
    queryFn: () => apiFetch(`${BASE}/lga`),
    staleTime: 30_000,
    retry: 1,
  });
}

export function useToggleLGAAdminStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ adminId, activate }) =>
      apiFetch(`${BASE}/lga/${adminId}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "toggle", activate }),
      }),
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
    queryFn: () => apiFetch(`${BASE}/state`),
    staleTime: 30_000,
    retry: 1,
  });
}

export function useToggleElectionStateAdminStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ adminId, activate }) =>
      apiFetch(`${BASE}/state/${adminId}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "toggle", activate }),
      }),
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
    mutationFn: (adminId) =>
      apiFetch(`${BASE}/state/${adminId}`, { method: "DELETE" }),
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
    queryFn: () => {
      const url = lgaFilter
        ? `${BASE}/pu?lga=${encodeURIComponent(lgaFilter)}`
        : `${BASE}/pu`;
      return apiFetch(url);
    },
    staleTime: 30_000,
    retry: 1,
  });
}

export function useTogglePUAdminStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ adminId, activate }) =>
      apiFetch(`${BASE}/pu/${adminId}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "toggle", activate }),
      }),
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
