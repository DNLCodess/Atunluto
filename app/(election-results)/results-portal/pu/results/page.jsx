"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useMyResults } from "@/hooks/use-election-results";

const STATUS_CONFIG = {
  pending: { label: "Pending", cls: "bg-[#FFF3E0] text-[#E65100]" },
  verified: { label: "Verified", cls: "bg-[#E8F5E9] text-[#2E7D32]" },
  disputed: { label: "Disputed", cls: "bg-[#FFEBEE] text-[#C62828]" },
};

export default function PUResultsPage() {
  const [adminId, setAdminId] = useState("");
  useEffect(() => {
    setAdminId(
      document.querySelector("main[data-erms-id]")?.dataset?.ermsId || "",
    );
  }, []);
  const { data: results = [], isLoading, isError } = useMyResults(adminId);

  return (
    <div className="p-8 font-[Poppins,sans-serif] text-[#212121]">
      <div className="mb-8">
        <h1 className="font-[Montserrat,sans-serif] text-[26px] font-extrabold text-[#1B5E20] mb-1.5">
          My Submissions
        </h1>
        <p className="text-[#757575] text-sm">
          Results you have submitted — read only
        </p>
      </div>
      <div className="bg-white rounded-xl border border-[#E0E0E0] overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-16 bg-[#F5F5F5] rounded-lg mb-2 animate-pulse"
              />
            ))}
          </div>
        ) : isError ? (
          <div className="p-10 text-center text-[#C62828]">
            Failed to load results. Please refresh.
          </div>
        ) : results.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="text-4xl mb-4">📋</div>
            <div className="text-base font-semibold text-[#212121] mb-2">
              No submissions yet
            </div>
            <Link
              href="/results-portal/pu/submit"
              className="inline-block mt-3 px-6 py-3 bg-[#1B5E20] text-white rounded-xl text-sm font-semibold no-underline"
            >
              Submit First Result
            </Link>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#F5F5F5] border-b-2 border-[#E0E0E0]">
                {[
                  "Election",
                  "Ward · Polling Unit",
                  "Votes",
                  "Status",
                  "Submitted",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-[11px] font-bold text-[#757575] tracking-[0.8px] uppercase"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => {
                const st = STATUS_CONFIG[r.status] || STATUS_CONFIG.pending;
                return (
                  <tr
                    key={r.id}
                    className={`${i % 2 === 0 ? "bg-white" : "bg-[#FAFAFA]"} border-b border-[#E0E0E0]`}
                  >
                    <td className="px-4 py-3.5 text-sm font-semibold text-[#212121]">
                      {r.election?.title || "—"}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="text-sm font-semibold text-[#212121]">
                        {r.ward}
                      </div>
                      <div className="text-xs text-[#757575]">
                        {r.polling_unit}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-[Montserrat,sans-serif] text-base font-extrabold text-[#1B5E20]">
                      {(r.votes_cast || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-block px-2.5 py-[3px] rounded-full text-[11px] font-bold ${st.cls}`}
                      >
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-[13px] text-[#757575]">
                      {new Date(r.submitted_at).toLocaleDateString("en-NG", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
