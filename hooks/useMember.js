// lib/hooks/useMembers.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/supabase/client";

const supabase = createClient();

// Fetch all members
async function fetchMembers() {
  const { data, error } = await supabase
    .from("members")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

// Add member
async function addMember(memberData) {
  const { data, error } = await supabase
    .from("members")
    .insert(memberData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Update member
async function updateMember({ id, updates }) {
  const { data, error } = await supabase
    .from("members")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Delete member
async function deleteMember(id) {
  const { error } = await supabase.from("members").delete().eq("id", id);

  if (error) throw error;
  return id;
}

// Main members hook
export function useMembers() {
  const queryClient = useQueryClient();

  // Query for members list
  const {
    data: members = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["members"],
    queryFn: fetchMembers,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Add member mutation
  const addMutation = useMutation({
    mutationFn: addMember,
    onSuccess: (newMember) => {
      // Optimistically update cache
      queryClient.setQueryData(["members"], (old) => [
        newMember,
        ...(old || []),
      ]);
    },
  });

  // Update member mutation
  const updateMutation = useMutation({
    mutationFn: updateMember,
    onSuccess: (updatedMember) => {
      queryClient.setQueryData(["members"], (old) =>
        old?.map((m) => (m.id === updatedMember.id ? updatedMember : m))
      );
    },
  });

  // Delete member mutation
  const deleteMutation = useMutation({
    mutationFn: deleteMember,
    onSuccess: (deletedId) => {
      queryClient.setQueryData(["members"], (old) =>
        old?.filter((m) => m.id !== deletedId)
      );
    },
  });

  return {
    members,
    isLoading,
    error,
    refetch,
    addMember: addMutation.mutate,
    updateMember: updateMutation.mutate,
    deleteMember: deleteMutation.mutate,
    isAdding: addMutation.isLoading,
    isUpdating: updateMutation.isLoading,
    isDeleting: deleteMutation.isLoading,
  };
}
