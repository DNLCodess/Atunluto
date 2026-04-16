"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const AUDIT_BASE = "/results-portal/api/audit";
const SECURITY_BASE = "/results-portal/api/security";

async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json();
  if (!res.ok || data?.error) throw new Error(data?.error || "Request failed.");
  return data;
}

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
    queryFn: () => {
      const params = new URLSearchParams({ page });
      if (action) params.set("action", action);
      if (table) params.set("table", table);
      if (adminId) params.set("adminId", adminId);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      return apiFetch(`${AUDIT_BASE}?${params}`);
    },
    staleTime: 20_000,
    placeholderData: (prev) => prev,
  });
}

export function useAdminsList() {
  return useQuery({
    queryKey: ["admins-list"],
    queryFn: () => apiFetch(`${AUDIT_BASE}/admins`),
    staleTime: 120_000,
  });
}

export function useSecurityReports({ status = "", urgency = "" } = {}) {
  return useQuery({
    queryKey: ["security-reports", status, urgency],
    queryFn: () => {
      const params = new URLSearchParams({ scope: "all" });
      if (status) params.set("status", status);
      if (urgency) params.set("urgency", urgency);
      return apiFetch(`${SECURITY_BASE}?${params}`);
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useUpdateReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reportId, status, resolution_notes }) =>
      apiFetch(`${SECURITY_BASE}/${reportId}`, {
        method: "PATCH",
        body: JSON.stringify({ status, resolution_notes }),
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["security-reports"] }),
  });
}

export function useMyReports(adminId) {
  return useQuery({
    queryKey: ["my-reports", adminId],
    queryFn: () =>
      apiFetch(
        `${SECURITY_BASE}?scope=mine&adminId=${encodeURIComponent(adminId)}`,
      ),
    enabled: !!adminId,
    staleTime: 30_000,
  });
}

export function useChecksumScan() {
  return useMutation({
    mutationFn: (electionId) =>
      apiFetch(
        `${SECURITY_BASE}/checksum?electionId=${encodeURIComponent(electionId)}`,
        { method: "POST" },
      ),
  });
}
