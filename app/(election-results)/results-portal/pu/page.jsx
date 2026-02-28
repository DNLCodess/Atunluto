"use client";

/**
 * app/results-portal/pu/page.jsx
 * Polling Unit Admin dashboard.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useMyResults } from "@/hooks/use-election-results";

export default function PUDashboard() {
  const [adminId, setAdminId] = useState("");
  const [lga, setLga] = useState("");
  const [ward, setWard] = useState("");
  const [pollingUnit, setPollingUnit] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    const main = document.querySelector("main[data-erms-id]");
    if (main) {
      setAdminId(main.dataset.ermsId || "");
      setLga(main.dataset.ermsLga || "");
      setWard(main.dataset.ermsWard || "");
      setPollingUnit(main.dataset.ermsPollingUnit || "");
      setName(main.dataset.ermsName || "");
    }
  }, []);

  const { data: results = [], isLoading } = useMyResults(adminId);

  const pending = results.filter((r) => r.status === "pending").length;
  const verified = results.filter((r) => r.status === "verified").length;
  const disputed = results.filter((r) => r.status === "disputed").length;

  return (
    <div className="p-8 font-[Poppins,sans-serif] text-[#212121]">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-[Montserrat,sans-serif] text-[26px] font-extrabold text-[#1B5E20] mb-1.5">
          Welcome{name ? `, ${name.split(" ")[0]}` : ""}
        </h1>
        <p className="text-[#757575] text-sm">Polling Unit Agent Dashboard</p>
      </div>

      {/* Location card */}
      <div className="bg-[#1B5E20] rounded-2xl p-6 mb-8 text-white">
        <div className="text-xs font-bold tracking-widest uppercase text-white/60 mb-3">
          Your Assignment
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "LGA", value: lga, icon: "📍" },
            { label: "Ward", value: ward, icon: "🏘️" },
            { label: "Polling Unit", value: pollingUnit, icon: "🗳️" },
          ].map(({ label, value, icon }) => (
            <div key={label} className="bg-white/10 rounded-xl px-4 py-3.5">
              <div className="text-[10px] font-bold tracking-widest uppercase text-white/50 mb-1">
                {icon} {label}
              </div>
              <div className="text-white font-semibold text-sm leading-tight">
                {value || "—"}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Submitted", value: results.length, color: "#1B5E20" },
          { label: "Pending", value: pending, color: "#E65100" },
          { label: "Verified", value: verified, color: "#2E7D32" },
          { label: "Disputed", value: disputed, color: "#C62828" },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="bg-white rounded-xl px-6 py-5 border border-[#E0E0E0]"
          >
            {isLoading ? (
              <div className="h-8 w-12 bg-[#F5F5F5] rounded animate-pulse mb-1" />
            ) : (
              <div
                className="text-[28px] font-bold font-[Montserrat,sans-serif]"
                style={{ color }}
              >
                {value}
              </div>
            )}
            <div className="text-xs text-[#757575] font-semibold mt-1">
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/results-portal/pu/submit"
          className="group bg-white rounded-2xl border border-[#E0E0E0] p-6 no-underline hover:border-[#4CAF50] hover:shadow-md transition-all duration-200"
        >
          <div className="text-3xl mb-3">📊</div>
          <div className="font-[Montserrat,sans-serif] font-extrabold text-[#1B5E20] text-base mb-1">
            Submit Results
          </div>
          <div className="text-[13px] text-[#757575]">
            Record polling unit results for active elections
          </div>
        </Link>
        <Link
          href="/results-portal/pu/report"
          className="group bg-white rounded-2xl border border-[#E0E0E0] p-6 no-underline hover:border-[#C62828] hover:shadow-md transition-all duration-200"
        >
          <div className="text-3xl mb-3">🚨</div>
          <div className="font-[Montserrat,sans-serif] font-extrabold text-[#C62828] text-base mb-1">
            Report Issue
          </div>
          <div className="text-[13px] text-[#757575]">
            Flag suspicious activity or irregularities
          </div>
        </Link>
      </div>
    </div>
  );
}
