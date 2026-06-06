// hooks/use-site-content.js
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/supabase/client";
import { CMS_DEFAULTS, mergeSection } from "@/lib/cms-defaults";

const supabase = createClient();

export const SITE_CONTENT_KEY = ["site-content"];

// Fetch every saved section into a { key: content } map.
async function fetchSiteContent() {
  const { data, error } = await supabase
    .from("site_content")
    .select("key, content");

  if (error) throw error;

  const map = {};
  for (const row of data ?? []) map[row.key] = row.content;
  return map;
}

// ─── Public website ───────────────────────────────────────────────────────────
// Returns merged-with-defaults content for one section. While the network
// request is in flight (or if it fails), defaults are used, so the site never
// shows a loading state or blank section.
export function useSection(key) {
  const { data: map } = useQuery({
    queryKey: SITE_CONTENT_KEY,
    queryFn: fetchSiteContent,
    staleTime: 10 * 1000,
    placeholderData: {},
  });

  return mergeSection(key, map?.[key]);
}

// ─── Dashboard editing ────────────────────────────────────────────────────────
export function useSiteContentAdmin() {
  const queryClient = useQueryClient();

  const {
    data: map = {},
    isLoading,
    error,
  } = useQuery({
    queryKey: SITE_CONTENT_KEY,
    queryFn: fetchSiteContent,
    staleTime: 60 * 1000,
  });

  const saveMutation = useMutation({
    mutationFn: async ({ key, content }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data, error: dbError } = await supabase
        .from("site_content")
        .upsert(
          { key, content, updated_by: user?.id ?? null },
          { onConflict: "key" },
        )
        .select("key, content")
        .single();

      if (dbError) throw dbError;
      return data;
    },
    onSuccess: (row) => {
      queryClient.setQueryData(SITE_CONTENT_KEY, (old = {}) => ({
        ...old,
        [row.key]: row.content,
      }));
    },
  });

  // Reset a section back to its built-in default (removes the saved row).
  const resetMutation = useMutation({
    mutationFn: async (key) => {
      const { error: dbError } = await supabase
        .from("site_content")
        .delete()
        .eq("key", key);
      if (dbError) throw dbError;
      return key;
    },
    onSuccess: (key) => {
      queryClient.setQueryData(SITE_CONTENT_KEY, (old = {}) => {
        const next = { ...old };
        delete next[key];
        return next;
      });
    },
  });

  return {
    // merged content for a section (defaults + saved)
    getSection: (key) => mergeSection(key, map[key]),
    // whether this section has unsaved-from-default overrides in the DB
    isCustomised: (key) => Object.prototype.hasOwnProperty.call(map, key),

    isLoading,
    fetchError: error?.message ?? null,

    saveSection: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    saveError: saveMutation.error?.message ?? null,

    resetSection: resetMutation.mutateAsync,
    isResetting: resetMutation.isPending,
  };
}

// Re-export so dashboard schema code can introspect available sections.
export { CMS_DEFAULTS };
