// hooks/use-pu.js
// React Query hooks for LGA → Ward → Polling Unit cascading dropdowns.
// All data is sourced exclusively from oyo_south_polling_units (2,500+ rows).
//
// Performance strategy:
//  • useWardsForLGA        — distinct (ward_number, ward_name) for a given LGA
//                            via idx_pu_lga index. Cached 24 h.
//  • usePollingUnitsForWard — all PUs for a (lga, ward_name) pair via
//                             idx_pu_lga_ward_name composite index. Cached 24 h.
//  • prefetchAllLGAWards   — fires on app mount, pre-warms cache for all 9 LGAs
//                            so the Ward dropdown is always instant.
//  • prefetchPollingUnits  — call onFocus of Ward <select> to pre-warm PU cache.

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/supabase/client";

// ─── Constants ────────────────────────────────────────────────────────────────

const STALE_24H = 1000 * 60 * 60 * 24;
const GC_TIME = 1000 * 60 * 60 * 48;

export const OYO_SOUTH_LGA_NAMES = [
  "Ibadan North",
  "Ibadan North-East",
  "Ibadan North-West",
  "Ibadan South-East",
  "Ibadan South-West",
  "Ibarapa Central",
  "Ibarapa East",
  "Ibarapa North",
  "Ido",
];

// ─── Query key factories ──────────────────────────────────────────────────────

export const puKeys = {
  wards: (lga) => ["oyo_south", "wards", lga],
  pollingUnits: (lga, ward) => ["oyo_south", "pus", lga, ward],
};

// ─── Fetchers ─────────────────────────────────────────────────────────────────

/**
 * Returns distinct wards for an LGA, ordered by ward_number.
 * Queries oyo_south_polling_units directly — no separate wards table needed.
 * Uses idx_pu_lga index.
 *
 * Supabase doesn't expose SELECT DISTINCT natively, so we fetch all rows for
 * the LGA selecting only ward_number + ward_name, then deduplicate client-side.
 * Fast because:
 *  1. Only 2 lightweight columns are selected (no pu_code / pu_name).
 *  2. idx_pu_lga index makes the scan instant.
 *  3. Result is cached 24 h — fetched once per session per LGA.
 */
export async function fetchWardsForLGA(lga) {
  if (!lga) return [];
  const supabase = createClient();

  const { data, error } = await supabase
    .from("oyo_south_polling_units")
    .select("ward_number, ward_name")
    .eq("lga", lga)
    .order("ward_number", { ascending: true });

  if (error) throw error;
  if (!data?.length) return [];

  // Deduplicate — keep first occurrence of each ward_number
  const seen = new Set();
  return data.filter(({ ward_number }) => {
    if (seen.has(ward_number)) return false;
    seen.add(ward_number);
    return true;
  });
}

/**
 * Returns all polling units for a (lga, ward_name) pair.
 * Hits the idx_pu_lga_ward_name composite index directly.
 */
export async function fetchPollingUnitsForWard(lga, wardName) {
  if (!lga || !wardName) return [];
  const supabase = createClient();

  const { data, error } = await supabase
    .from("oyo_south_polling_units")
    .select("id, pu_code, pu_name")
    .eq("lga", lga)
    .eq("ward_name", wardName)
    .order("pu_code", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

// ─── React Query hooks ────────────────────────────────────────────────────────

export function useWardsForLGA(lga) {
  return useQuery({
    queryKey: puKeys.wards(lga),
    queryFn: () => fetchWardsForLGA(lga),
    enabled: !!lga,
    staleTime: STALE_24H,
    gcTime: GC_TIME,
    retry: 2,
  });
}

export function usePollingUnitsForWard(lga, ward) {
  return useQuery({
    queryKey: puKeys.pollingUnits(lga, ward),
    queryFn: () => fetchPollingUnitsForWard(lga, ward),
    enabled: !!lga && !!ward,
    staleTime: STALE_24H,
    gcTime: GC_TIME,
    retry: 2,
  });
}

// ─── Prefetch helpers ─────────────────────────────────────────────────────────

/**
 * Call once on app mount to pre-warm ward lists for all 9 LGAs in parallel.
 * Used in LGAPrefetcher.jsx (rendered inside the root layout).
 */
export async function prefetchAllLGAWards(queryClient) {
  await Promise.all(
    OYO_SOUTH_LGA_NAMES.map((lga) =>
      queryClient.prefetchQuery({
        queryKey: puKeys.wards(lga),
        queryFn: () => fetchWardsForLGA(lga),
        staleTime: STALE_24H,
        gcTime: GC_TIME,
      }),
    ),
  );
}

/**
 * Call onFocus of the Ward <select> to pre-warm PU data for every ward
 * in the chosen LGA before the user has finished selecting.
 */
export function prefetchPollingUnits(queryClient, lga, wardName) {
  if (!lga || !wardName) return;
  queryClient.prefetchQuery({
    queryKey: puKeys.pollingUnits(lga, wardName),
    queryFn: () => fetchPollingUnitsForWard(lga, wardName),
    staleTime: STALE_24H,
    gcTime: GC_TIME,
  });
}
