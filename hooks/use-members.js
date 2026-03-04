// hooks/use-members.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/supabase/client";

const supabase = createClient();

export const MEMBERS_QUERY_KEY = ["members"];

// Only fetch columns the UI actually needs
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
  const { data, error } = await supabase
    .from("members")
    .select(MEMBER_FIELDS)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
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

  return result.data; // { id, full_name, membership_number, lga, ward, polling_unit, gender }
}

async function updateMemberFn({ id, updates }) {
  const { data, error } = await supabase
    .from("members")
    .update(updates)
    .eq("id", id)
    .select(MEMBER_FIELDS)
    .single();

  if (error) throw error;
  return data;
}

async function deleteMemberFn(id) {
  const { error } = await supabase.from("members").delete().eq("id", id);
  if (error) throw error;
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
      // Refetch rather than optimistic insert — the API route triggers
      // membership_number generation server-side which we can't predict
      // client-side, so a fresh fetch is the safest approach.
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
