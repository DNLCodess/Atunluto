"use client";

// components/common/LGAPrefetcher.jsx
//
// Invisble cache-warming component. Two modes:
//
//  • No `lga` prop (public registration, admin forms with unknown LGA):
//    Warms ward lists for all 9 LGAs only — cheap (~9 small queries).
//    PUs are then prefetched lazily in the form on LGA selection.
//
//  • With `lga` prop (LGA Admin / PU Admin layouts — LGA known from session):
//    Warms wards + ALL polling units for that one LGA only.
//    Cuts cold-load from 2,500 rows to ~30–150 rows for the relevant LGA.

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  prefetchAllLGAWards,
  prefetchPollingUnits,
  fetchWardsForLGA,
  puKeys,
} from "@/hooks/use-pu";

const STALE_24H = 1000 * 60 * 60 * 24;

export default function LGAPrefetcher({ lga = null }) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (lga) {
      // Scoped mode — warm this LGA's wards then all its PUs
      async function warmScopedLGA() {
        await queryClient.prefetchQuery({
          queryKey: puKeys.wards(lga),
          queryFn: () => fetchWardsForLGA(lga),
          staleTime: STALE_24H,
        });

        const wards = queryClient.getQueryData(puKeys.wards(lga)) ?? [];
        for (const { ward_name } of wards) {
          prefetchPollingUnits(queryClient, lga, ward_name);
        }
      }

      warmScopedLGA();
    } else {
      // Unscoped mode — warm ward lists for all 9 LGAs only (no PUs yet)
      prefetchAllLGAWards(queryClient);
    }
  }, [queryClient, lga]);

  return null;
}
