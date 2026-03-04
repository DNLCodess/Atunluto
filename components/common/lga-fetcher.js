"use client";

// components/common/LGAPrefetcher.jsx
// Invisible component that pre-warms the React Query cache with ward lists
// for all 9 Oyo South LGAs as soon as the app loads.
//
// Why a separate component instead of putting this in layout.js?
// layout.js is a Server Component — useEffect and useQueryClient cannot be
// called there. This tiny client component is the standard Next.js pattern
// for running client-side effects from a server layout.

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { prefetchAllLGAWards } from "@/hooks/use-pu";

export default function LGAPrefetcher() {
  const queryClient = useQueryClient();

  useEffect(() => {
    prefetchAllLGAWards(queryClient);
  }, [queryClient]);

  return null;
}
