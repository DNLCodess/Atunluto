// lib/hooks/useMembers.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/supabase/client";

const supabase = createClient();

export const MEMBERS_QUERY_KEY = ["members"];

// Only fetch columns the UI actually needs — avoids transferring heavy fields
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

async function fetchMembers() {
  const { data, error } = await supabase
    .from("members")
    .select(MEMBER_FIELDS)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

async function addMemberFn(memberData) {
  const { data, error } = await supabase
    .from("members")
    .insert(memberData)
    .select(MEMBER_FIELDS)
    .single();

  if (error) throw error;
  return data;
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

  // Add
  const addMutation = useMutation({
    mutationFn: addMemberFn,
    onSuccess: (newMember) => {
      queryClient.setQueryData(MEMBERS_QUERY_KEY, (old = []) => [
        newMember,
        ...old,
      ]);
    },
  });

  // Update — optimistic with rollback
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

  // Delete — optimistic with rollback
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

    updateMember: updateMutation.mutate,
    isUpdating: updateMutation.isPending,

    deleteMember: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    deleteError: deleteMutation.error?.message ?? null,
  };
}
