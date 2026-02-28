"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchPUAdmins } from "@/app/actions/pu-auth";

const PU_ADMINS_KEY = (lgaFilter) => ["pu-admins", lgaFilter || "all"];

export function usePUAdmins(lgaFilter) {
  return useQuery({
    queryKey: PU_ADMINS_KEY(lgaFilter),
    queryFn: async () => {
      const data = await fetchPUAdmins(lgaFilter);
      if (data?.error) throw new Error(data.error);
      return data;
    },
    staleTime: 30_000,
  });
}

export function useTogglePUAdminStatus(lgaFilter) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ adminId, activate }) => {
      const { togglePUAdminStatus } = await import("@/app/actions/pu-auth");
      const result = await togglePUAdminStatus(adminId, activate);
      if (result?.error) throw new Error(result.error);
      return result;
    },
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
