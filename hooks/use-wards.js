/**
 * hooks/use-wards.js
 * Ward reference data sourced from INEC — 99 wards across 9 LGAs.
 */

import { useQuery } from "@tanstack/react-query";
import { fetchLGAWards } from "@/app/actions/results-fetch";

export function useWardsForLGA(lga) {
  return useQuery({
    queryKey: ["oyo-south-wards", lga],
    queryFn: async () => {
      const data = await fetchLGAWards(lga);
      if (data?.error) throw new Error(data.error);
      return data;
    },
    enabled: Boolean(lga),
    staleTime: Infinity,
    gcTime: 24 * 60 * 60 * 1000,
  });
}

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
