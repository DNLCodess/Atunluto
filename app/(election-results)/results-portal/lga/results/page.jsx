"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useMyResults, useActiveElections } from "@/hooks/use-election-results";

const STATUS_STYLE = {
  pending: { label: "Pending", bg: "bg-blue-50", color: "text-blue-800" },
  verified: { label: "Verified", bg: "bg-green-50", color: "text-green-800" },
  disputed: { label: "Disputed", bg: "bg-red-50", color: "text-red-800" },
};

export default function MyResultsPage() {
  const [adminId, setAdminId] = useState("");

  useEffect(() => {
    const val =
      document.querySelector("main[data-erms-id]")?.dataset?.ermsId || "";
    setAdminId(val);
  }, []);

  const [electionFilter, setElectionFilter] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const { data: elections = [] } = useActiveElections();
  const {
    data: results = [],
    isLoading,
    isError,
  } = useMyResults(adminId, electionFilter || undefined);

  const grouped = groupByPollingUnit(results);

  const stats = {
    total: results.length,
    pending: results.filter((r) => r.status === "pending").length,
    verified: results.filter((r) => r.status === "verified").length,
    disputed: results.filter((r) => r.status === "disputed").length,
  };

  return (
    <div className="p-8 font-[Poppins,sans-serif] text-text-dark">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="font-[Montserrat,sans-serif] text-[26px] font-extrabold text-[#1B5E20] mb-1.5">
            My Submissions
          </h1>
          <p className="text-sm text-[#757575]">
            Read-only record of all results you have submitted
          </p>
        </div>
        <Link
          href="/results-portal/lga/submit"
          className="bg-[#1B5E20] hover:bg-[#2E7D32] text-white no-underline rounded-xl px-6 py-3 text-sm font-semibold flex items-center gap-2 transition-colors duration-150"
        >
          + Submit New Result
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        {[
          {
            label: "Total Submitted",
            value: stats.total,
            color: "text-[#1B5E20]",
          },
          {
            label: "Pending Review",
            value: stats.pending,
            color: "text-blue-800",
          },
          { label: "Verified", value: stats.verified, color: "text-[#2E7D32]" },
          { label: "Disputed", value: stats.disputed, color: "text-red-700" },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="bg-white rounded-xl px-5 py-4.5 border border-[#E0E0E0]"
          >
            <div
              className={`font-[Montserrat,sans-serif] text-[26px] font-extrabold ${color}`}
            >
              {value}
            </div>
            <div className="text-xs text-[#757575] font-semibold mt-0.5">
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="bg-white rounded-xl border border-[#E0E0E0] px-5 py-3.5 mb-5 flex gap-3 items-center flex-wrap">
        <label className="text-[13px] font-semibold text-text-dark whitespace-nowrap">
          Filter by Election:
        </label>
        <select
          value={electionFilter}
          onChange={(e) => setElectionFilter(e.target.value)}
          className="flex-1 min-w-[200px] px-3 py-2 border-[1.5px] border-[#E0E0E0] rounded-lg text-[13px] bg-white outline-none focus:border-[#1B5E20] transition-colors duration-150 cursor-pointer"
        >
          <option value="">All Elections</option>
          {elections.map((e) => (
            <option key={e.id} value={e.id}>
              {e.title}
            </option>
          ))}
        </select>
        <div className="text-[13px] text-[#757575]">
          {grouped.length} polling unit{grouped.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Disputed warning */}
      {stats.disputed > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3.5 mb-5 flex items-center gap-2.5 text-[13px] text-red-800">
          <span className="text-xl shrink-0">⚠️</span>
          <div>
            <strong>
              {stats.disputed} submission{stats.disputed > 1 ? "s" : ""} flagged
              as disputed
            </strong>{" "}
            by the State Admin. Please{" "}
            <Link
              href="/results-portal/lga/report"
              className="text-red-800 font-bold underline"
            >
              file a security report
            </Link>{" "}
            if you have concerns.
          </div>
        </div>
      )}

      {/* Results list */}
      <div className="bg-white rounded-xl border border-[#E0E0E0] overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-2">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-[70px] bg-[#F5F5F5] rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : isError ? (
          <div className="py-10 text-center text-sm text-red-700">
            Failed to load submissions. Please refresh.
          </div>
        ) : grouped.length === 0 ? (
          <div className="py-16 px-6 text-center">
            <div className="text-4xl mb-3.5">📋</div>
            <div className="text-base font-semibold text-text-dark mb-2">
              No submissions yet
            </div>
            <Link
              href="/results-portal/lga/submit"
              className="text-[13px] text-[#2E7D32] font-semibold no-underline hover:underline"
            >
              Submit your first result
            </Link>
          </div>
        ) : (
          grouped.map((group) => (
            <PollingUnitGroup
              key={group.key}
              group={group}
              expanded={expandedId === group.key}
              onToggle={() =>
                setExpandedId(expandedId === group.key ? null : group.key)
              }
            />
          ))
        )}
      </div>

      {/* Immutability notice */}
      {results.length > 0 && (
        <div className="mt-4 px-4 py-3 bg-[#F5F5F5] rounded-lg text-xs text-[#757575] text-center">
          🔒 Submitted results cannot be edited. To request a correction,{" "}
          <Link
            href="/results-portal/lga/report"
            className="text-[#2E7D32] font-semibold no-underline hover:underline"
          >
            file a security report
          </Link>
          .
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// POLLING UNIT GROUP
// ─────────────────────────────────────────

function PollingUnitGroup({ group, expanded, onToggle }) {
  const statusCfg = STATUS_STYLE[group.status] || STATUS_STYLE.pending;
  const firstEntry = group.entries[0];

  return (
    <div className="border-b border-[#E0E0E0] last:border-b-0">
      {/* Group header */}
      <div
        onClick={onToggle}
        className={`flex items-center gap-4 px-6 py-4 cursor-pointer transition-colors duration-150
          ${expanded ? "bg-green-50" : "bg-white hover:bg-[#FAFAFA]"}`}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap mb-1">
            <span className="text-sm font-bold text-text-dark">
              {group.pollingUnit}
            </span>
            <span
              className={`${statusCfg.bg} ${statusCfg.color} px-2.5 py-0.5 rounded-full text-[11px] font-bold`}
            >
              {statusCfg.label}
            </span>
            {group.hasImage && (
              <span className="text-[11px] text-[#2E7D32] font-semibold">
                📎 Image attached
              </span>
            )}
          </div>
          <div className="text-xs text-[#757575]">
            {group.ward} · {firstEntry?.election?.title} · Submitted{" "}
            {formatDate(firstEntry?.submitted_at)}
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
            <div className="font-[Montserrat,sans-serif] text-lg font-extrabold text-[#1B5E20]">
              {group.totalVotes.toLocaleString()}
            </div>
            <div className="text-[11px] text-[#757575]">total votes</div>
          </div>
          <span
            className={`text-[#757575] text-lg transition-transform duration-200 ${expanded ? "rotate-180" : "rotate-0"}`}
          >
            ▾
          </span>
        </div>
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="px-6 pb-5 bg-[#FAFAFA]">
          {/* Candidate breakdown */}
          <div className="mb-4">
            {group.entries.map((entry) => (
              <div
                key={entry.id}
                className="flex justify-between items-center py-2.5 border-b border-[#E0E0E0]"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-[13px] font-semibold text-text-dark">
                    {entry.candidate?.full_name}
                  </span>
                  <span className="bg-[#EEEEEE] text-[#757575] px-1.5 py-0.5 rounded text-[11px] font-bold">
                    {entry.candidate?.party}
                  </span>
                </div>
                <span className="font-[Montserrat,sans-serif] text-lg font-extrabold text-[#1B5E20]">
                  {entry.votes_cast.toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          {/* Voter counts */}
          <div className="grid grid-cols-3 gap-2.5 mb-3.5">
            {[
              { label: "Accredited", value: firstEntry?.accredited_voters },
              { label: "Registered", value: firstEntry?.registered_voters },
              { label: "Total Votes", value: group.totalVotes },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="bg-white rounded-lg px-3 py-2.5 text-center border border-[#E0E0E0]"
              >
                <div className="font-[Montserrat,sans-serif] text-base font-bold text-[#1B5E20]">
                  {(value || 0).toLocaleString()}
                </div>
                <div className="text-[11px] text-[#757575] mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          {/* Notes */}
          {firstEntry?.notes && (
            <div className="bg-yellow-50 rounded-lg px-3.5 py-2.5 text-[13px] text-yellow-900 leading-relaxed">
              <strong>Notes:</strong> {firstEntry.notes}
            </div>
          )}

          {/* Checksum */}
          <div className="mt-3 text-[11px] text-[#BDBDBD] font-mono">
            Checksum: {firstEntry?.checksum?.substring(0, 20)}...
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────

function groupByPollingUnit(results) {
  const map = new Map();
  for (const r of results) {
    const key = `${r.election_id}-${r.ward}-${r.polling_unit}`;
    if (!map.has(key)) {
      map.set(key, {
        key,
        ward: r.ward,
        pollingUnit: r.polling_unit,
        status: r.status,
        hasImage: !!r.result_image_url,
        totalVotes: 0,
        entries: [],
      });
    }
    const group = map.get(key);
    group.totalVotes += r.votes_cast;
    group.entries.push(r);
  }
  return Array.from(map.values());
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
