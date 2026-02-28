"use client";

/**
 * app/results-portal/lga/agents/page.jsx
 * LGA Admin — Manage Polling Unit Agents in their LGA
 */

import { useEffect, useState } from "react";
import PollingUnitAdminsManager from "@/components/erms/PollingUnitAdminsManager";

export default function LGAAgentsPage() {
  const [lga, setLga] = useState("");

  useEffect(() => {
    const val =
      document.querySelector("main[data-erms-lga]")?.dataset?.ermsLga || "";
    setLga(val);
  }, []);

  if (!lga) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#1B5E20] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 font-[Poppins,sans-serif]">
      <PollingUnitAdminsManager viewerRole="lga_admin" viewerLGA={lga} />
    </div>
  );
}
