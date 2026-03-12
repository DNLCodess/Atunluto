// hooks/use-members.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const MEMBERS_QUERY_KEY = ["members"];

const MEMBER_FIELDS = [
  "id",
  "membership_number",
  "full_name",
  "gender",
  "date_of_birth",
  "phone",
  "whatsapp",
  "messenger",
  "lga",
  "ward",
  "polling_unit",
  "address",
  "profile_image_url",
  "created_at",
].join(", ");

// ─── Fetchers ─────────────────────────────────────────────────────────────────

async function fetchMembers() {
  const res = await fetch("/api/admin/members");
  if (!res.ok) throw new Error("Failed to fetch members");
  return res.json();
}

/**
 * Add member via the /api/register-member route so that:
 *  1. The service role key is used (not the anon key).
 *  2. All server-side validation (LGA/ward/PU existence check) runs.
 *  3. The membership_number trigger fires correctly.
 */
async function addMemberFn(memberData) {
  const res = await fetch("/api/register-member", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(memberData),
  });

  const contentType = res.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    throw new Error("Server returned an invalid response.");
  }

  const result = await res.json();
  if (!res.ok) throw new Error(result.error || "Failed to add member.");

  return result.data;
}

async function updateMemberFn({ id, updates }) {
  const res = await fetch("/api/admin/members", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, updates }),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.error || "Failed to update member");
  return result;
}

async function deleteMemberFn(id) {
  const res = await fetch("/api/admin/members", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.error || "Failed to delete member");
  return id;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useMembers() {
  const queryClient = useQueryClient();

  const {
    data: members = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: MEMBERS_QUERY_KEY,
    queryFn: fetchMembers,
    staleTime: 30 * 1000,
  });

  // ── Add ──────────────────────────────────────────────────────────────────
  const addMutation = useMutation({
    mutationFn: addMemberFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEMBERS_QUERY_KEY });
    },
  });

  // ── Update — optimistic with rollback ────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: updateMemberFn,
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: MEMBERS_QUERY_KEY });
      const previous = queryClient.getQueryData(MEMBERS_QUERY_KEY);
      queryClient.setQueryData(MEMBERS_QUERY_KEY, (old = []) =>
        old.map((m) => (m.id === id ? { ...m, ...updates } : m)),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(MEMBERS_QUERY_KEY, context.previous);
      }
    },
    onSuccess: (updatedMember) => {
      queryClient.setQueryData(MEMBERS_QUERY_KEY, (old = []) =>
        old.map((m) => (m.id === updatedMember.id ? updatedMember : m)),
      );
    },
  });

  // ── Delete — optimistic with rollback ────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: deleteMemberFn,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: MEMBERS_QUERY_KEY });
      const previous = queryClient.getQueryData(MEMBERS_QUERY_KEY);
      queryClient.setQueryData(MEMBERS_QUERY_KEY, (old = []) =>
        old.filter((m) => m.id !== id),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(MEMBERS_QUERY_KEY, context.previous);
      }
    },
  });

  return {
    members,
    isLoading,
    error,
    refetch,

    addMember: addMutation.mutate,
    isAdding: addMutation.isPending,
    addError: addMutation.error?.message ?? null,

    updateMember: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error?.message ?? null,

    deleteMember: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    deleteError: deleteMutation.error?.message ?? null,
  };
}
