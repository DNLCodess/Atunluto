"use client";

/**
 * app/results-portal/lga/agents/page.jsx
 * LGA Admin — manage PU Agents for their assigned LGA.
 */

import { useEffect, useState } from "react";
import PollingUnitAdminsManager from "@/components/shared/rp/pu/manager";

export default function LGAAgentsPage() {
  const [lga, setLga] = useState("");

  useEffect(() => {
    const val =
      document.querySelector("main[data-erms-lga]")?.dataset?.ermsLga || "";
    setLga(val);
  }, []);

  if (!lga) {
    return (
      <div className="p-8">
        <div className="h-8 w-48 bg-[#F5F5F5] rounded-lg animate-pulse mb-4" />
        <div className="h-4 w-96 bg-[#F5F5F5] rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <PollingUnitAdminsManager viewerRole="lga_admin" viewerLGA={lga} />
    </div>
  );
}
