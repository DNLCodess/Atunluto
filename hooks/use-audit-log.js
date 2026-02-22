"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchAuditLog,
  fetchAdminsList,
  fetchSecurityReports,
  fetchMyReports,
} from "@/app/actions/audit";

export function useAuditLog({
  page = 0,
  action = "",
  table = "",
  adminId = "",
  dateFrom = "",
  dateTo = "",
} = {}) {
  return useQuery({
    queryKey: ["audit-log", page, action, table, adminId, dateFrom, dateTo],
    queryFn: () =>
      fetchAuditLog({ page, action, table, adminId, dateFrom, dateTo }),
    staleTime: 20_000,
    placeholderData: (prev) => prev, // replaces deprecated keepPreviousData
  });
}

export function useAdminsList() {
  return useQuery({
    queryKey: ["admins-list"],
    queryFn: () => fetchAdminsList(),
    staleTime: 120_000,
  });
}

export function useSecurityReports({ status = "", urgency = "" } = {}) {
  return useQuery({
    queryKey: ["security-reports", status, urgency],
    queryFn: () => fetchSecurityReports({ status, urgency }),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useUpdateReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ reportId, status, resolution_notes }) => {
      const { updateSecurityReport } = await import("@/app/actions/security");
      const result = await updateSecurityReport(reportId, {
        status,
        resolution_notes,
      });
      if (result?.error) throw new Error(result.error);
      return result;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["security-reports"] }),
  });
}

export function useMyReports(adminId) {
  return useQuery({
    queryKey: ["my-reports", adminId],
    queryFn: () => fetchMyReports(adminId),
    enabled: !!adminId,
    staleTime: 30_000,
  });
}

// Mutation — triggered manually by the State Admin, not on mount
export function useChecksumScan() {
  return useMutation({
    mutationFn: async (electionId) => {
      const { runChecksumVerification } =
        await import("@/app/actions/security");
      const result = await runChecksumVerification(electionId);
      if (result?.error) throw new Error(result.error);
      return result;
    },
  });
}
