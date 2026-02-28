// lib/hooks/use-oyo-south-wards.js
// React Query hooks for Oyo South ward reference data
// Sourced from oyo_south_wards table (INEC-verified data)

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

// ── All wards for a given LGA ──────────────────────────────────────────────
export function useWardsForLGA(lga) {
  return useQuery({
    queryKey: ["oyo-south-wards", lga],
    queryFn: async () => {
      if (!lga) return [];
      const { data, error } = await supabase
        .from("oyo_south_wards")
        .select("ward_number, ward_name")
        .eq("lga", lga)
        .order("ward_number", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: Boolean(lga),
    staleTime: Infinity, // Ward data never changes mid-session
    gcTime: 24 * 60 * 60 * 1000, // Keep in cache 24h
  });
}

// ── All LGAs (distinct) ────────────────────────────────────────────────────
export const OYO_SOUTH_LGAS = [
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

// ── Ward count per LGA (for display) ──────────────────────────────────────
export const LGA_WARD_COUNT = {
  "Ibadan North": 12,
  "Ibadan North-East": 12,
  "Ibadan North-West": 11,
  "Ibadan South-East": 12,
  "Ibadan South-West": 12,
  "Ibarapa Central": 10,
  "Ibarapa East": 10,
  "Ibarapa North": 10,
  Ido: 10,
};
