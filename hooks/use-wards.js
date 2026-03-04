/**
 * useOyoSouthWards — React Query hooks for LGA → Ward cascading selects
 *
 * These hooks fetch from the `oyo_south_wards` table in Supabase,
 * which is the single source of truth for INEC ward data.
 *
 * The static JS file (oyoSouthData.js) is still available as a fallback
 * for offline/SSR contexts, but all UI dropdowns should prefer these hooks.
 */

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/supabase/client";

const supabase = createClient();

// ─── Fetch all distinct LGA names ────────────────────────────────────────────

async function fetchLGANames() {
  const { data, error } = await supabase
    .from("oyo_south_wards")
    .select("lga")
    .order("lga", { ascending: true });

  if (error) throw error;

  // Deduplicate
  const unique = [...new Set(data.map((row) => row.lga))];
  return unique;
}

export function useLGANames() {
  return useQuery({
    queryKey: ["oyo_south", "lgas"],
    queryFn: fetchLGANames,
    staleTime: Infinity, // Ward boundaries never change mid-session
    gcTime: Infinity,
  });
}

// ─── Fetch wards for a specific LGA ──────────────────────────────────────────

async function fetchWardsForLGA(lga) {
  if (!lga) return [];

  const { data, error } = await supabase
    .from("oyo_south_wards")
    .select("id, ward_number, ward_name")
    .eq("lga", lga)
    .order("ward_number", { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * @param {string|null} lga - The selected LGA name
 * Returns: [{ id, ward_number, ward_name }]
 */
export function useWardsForLGA(lga) {
  return useQuery({
    queryKey: ["oyo_south", "wards", lga],
    queryFn: () => fetchWardsForLGA(lga),
    enabled: !!lga,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

// ─── Fetch all wards (for admin tables / reports) ─────────────────────────────

async function fetchAllWards() {
  const { data, error } = await supabase
    .from("oyo_south_wards")
    .select("id, lga, ward_number, ward_name")
    .order("lga", { ascending: true })
    .order("ward_number", { ascending: true });

  if (error) throw error;
  return data;
}

export function useAllWards() {
  return useQuery({
    queryKey: ["oyo_south", "all_wards"],
    queryFn: fetchAllWards,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

// ─── Lookup helper (client-side, from cached data) ───────────────────────────

/**
 * Given a ward_number and lga, find the full ward object from cached data.
 * Use after calling useAllWards().
 */
export function findWard(allWards, lga, wardNumber) {
  return (
    allWards?.find((w) => w.lga === lga && w.ward_number === wardNumber) ?? null
  );
}
