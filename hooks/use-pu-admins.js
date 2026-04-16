"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const BASE = "/results-portal/api/admins/pu";

const PU_ADMINS_KEY = (lgaFilter) => ["pu-admins", lgaFilter || "all"];

async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json();
  if (!res.ok || data?.error) throw new Error(data?.error || "Request failed.");
  return data;
}

export function usePUAdmins(lgaFilter) {
  return useQuery({
    queryKey: PU_ADMINS_KEY(lgaFilter),
    queryFn: () => {
      const url = lgaFilter
        ? `${BASE}?lga=${encodeURIComponent(lgaFilter)}`
        : BASE;
      return apiFetch(url);
    },
    staleTime: 30_000,
  });
}

export function useTogglePUAdminStatus(lgaFilter) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ adminId, activate }) =>
      apiFetch(`${BASE}/${adminId}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "toggle", activate }),
      }),
    onMutate: async ({ adminId, activate }) => {
      const key = PU_ADMINS_KEY(lgaFilter);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData(key);
      queryClient.setQueryData(key, (old) =>
        old?.map((a) => (a.id === adminId ? { ...a, is_active: activate } : a)),
      );
      return { previous, key };
    },
    onError: (_err, _vars, ctx) => {
      queryClient.setQueryData(ctx.key, ctx.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["pu-admins"] });
    },
  });
}
