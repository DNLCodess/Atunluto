"use client";

/**
 * app/results-portal/admin/results/page.jsx
 * State Admin — Full collation view.
 */

import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { useElections } from "@/hooks/use-elections";
import {
  useCollatedResults,
  useResultTotals,
  useWardBreakdown,
  useAllResults,
  useUpdateResultStatus,
} from "@/hooks/use-collation";

const VALID_LGAS = [
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

const CANDIDATE_COLOURS = [
  "#1B5E20",
  "#1565C0",
  "#C62828",
  "#E65100",
  "#6A1B9A",
  "#00838F",
  "#558B2F",
  "#4E342E",
];

const STATUS_CFG = {
  pending: { label: "Pending", bg: "bg-blue-50", color: "text-blue-800" },
  verified: { label: "Verified", bg: "bg-green-50", color: "text-green-800" },
  disputed: { label: "Disputed", bg: "bg-red-50", color: "text-red-800" },
};

const PARTY_COLORS = {
  APC: { text: "text-blue-800", bg: "bg-blue-50" },
  PDP: { text: "text-red-800", bg: "bg-red-50" },
  LP: { text: "text-yellow-800", bg: "bg-yellow-50" },
  ADC: { text: "text-purple-800", bg: "bg-purple-50" },
  NNPP: { text: "text-green-800", bg: "bg-green-50" },
};

// ─────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────

export default function ResultsCollationPage() {
  const { data: elections = [], isLoading: loadingElections } = useElections();

  const [electionId, setElectionId] = useState("");
  const [activeTab, setActiveTab] = useState("collation");
  const [expandedLGA, setExpandedLGA] = useState(null);
  const [imageViewer, setImageViewer] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [lgaFilter, setLgaFilter] = useState("");

  const { data: collated = [], isLoading: loadingCollated } =
    useCollatedResults(electionId);
  const { data: totals = [], isLoading: loadingTotals } =
    useResultTotals(electionId);
  const { data: allResults = [], isLoading: loadingAllResults } = useAllResults(
    electionId,
    {
      status: statusFilter || undefined,
      lga: lgaFilter || undefined,
    },
  );

  const updateStatus = useUpdateResultStatus();
  const selectedElection = elections.find((e) => e.id === electionId);

  const candidates = useMemo(
    () =>
      totals.map((t, i) => ({
        id: t.candidate_id,
        name: t.candidate_name,
        party: t.party,
        color: CANDIDATE_COLOURS[i % CANDIDATE_COLOURS.length],
        total: t.grand_total_votes,
      })),
    [totals],
  );

  const matrix = useMemo(() => {
    const m = {};
    VALID_LGAS.forEach((lga) => {
      m[lga] = {};
    });
    collated.forEach(({ lga, candidate_id, total_votes }) => {
      if (m[lga]) m[lga][candidate_id] = total_votes;
    });
    return m;
  }, [collated]);

  const grandTotals = useMemo(() => {
    const gt = {};
    candidates.forEach((c) => {
      gt[c.id] = c.total;
    });
    return gt;
  }, [candidates]);

  const totalSubmissions = allResults.length;
  const pendingCount = allResults.filter((r) => r.status === "pending").length;
  const disputedCount = allResults.filter(
    (r) => r.status === "disputed",
  ).length;

  const barData = candidates.map((c) => ({
    name: `${c.name} (${c.party})`,
    votes: c.total || 0,
    color: c.color,
  }));

  const lgaBarData = VALID_LGAS.map((lga) => {
    const row = {
      lga: lga.replace("Ibadan ", "Ibdn ").replace("Ibarapa ", "Ibrp "),
    };
    candidates.forEach((c) => {
      row[c.id] = matrix[lga]?.[c.id] || 0;
    });
    return row;
  });

  const donutData = candidates.map((c) => ({
    name: c.name,
    value: c.total || 0,
    color: c.color,
  }));
  const grandTotal = candidates.reduce((s, c) => s + (c.total || 0), 0);

  return (
    <div className="p-8 font-[Poppins,sans-serif] text-[#212121]">
      {/* Header */}
      <div className="flex justify-between items-start mb-7">
        <div>
          <h1 className="font-[Montserrat,sans-serif] text-[26px] font-extrabold text-[#1B5E20] mb-1.5">
            Result Collation
          </h1>
          <p className="text-sm text-[#757575]">
            Aggregated election results across all 9 LGAs
          </p>
        </div>
        {selectedElection && (
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-[#F5F5F5] hover:bg-[#EEEEEE] border border-[#E0E0E0] rounded-xl text-[13px] font-semibold text-[#212121] cursor-pointer transition-colors duration-150"
          >
            🖨️ Print / Export
          </button>
        )}
      </div>

      {/* Election selector */}
      <div className="bg-white rounded-xl border border-[#E0E0E0] px-6 py-5 mb-6">
        <label className="block text-[13px] font-semibold text-[#212121] mb-2.5">
          Select Election to View
        </label>
        {loadingElections ? (
          <Skeleton h="h-11" />
        ) : (
          <select
            value={electionId}
            onChange={(e) => {
              setElectionId(e.target.value);
              setExpandedLGA(null);
              setStatusFilter("");
              setLgaFilter("");
            }}
            className="w-full max-w-[480px] px-3.5 py-2.5 border-[1.5px] border-[#E0E0E0] rounded-xl text-sm bg-white outline-none focus:border-[#1B5E20] transition-colors duration-150 cursor-pointer"
          >
            <option value="">Choose an election...</option>
            {elections.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title} — {formatStatus(e.status)}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Empty state */}
      {!electionId && (
        <div className="bg-white rounded-xl border border-dashed border-[#E0E0E0] py-20 text-center text-[#757575]">
          <div className="text-5xl mb-4">📊</div>
          <div className="text-base font-semibold">
            Select an election above to view collated results
          </div>
        </div>
      )}

      {electionId && (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
            {[
              {
                label: "Total Votes Cast",
                value: grandTotal.toLocaleString(),
                color: "text-[#1B5E20]",
              },
              {
                label: "Submissions",
                value: totalSubmissions,
                color: "text-blue-800",
              },
              {
                label: "Pending Review",
                value: pendingCount,
                color: "text-orange-700",
              },
              {
                label: "Disputed",
                value: disputedCount,
                color: "text-red-700",
              },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                className="bg-white rounded-xl px-5 py-5 border border-[#E0E0E0]"
              >
                <div
                  className={`font-[Montserrat,sans-serif] text-3xl font-extrabold ${color}`}
                >
                  {value}
                </div>
                <div className="text-xs text-[#757575] font-semibold mt-1">
                  {label}
                </div>
              </div>
            ))}
          </div>

          {/* Leading banner */}
          {candidates.length > 0 && grandTotal > 0 && (
            <LeadingBanner candidates={candidates} grandTotal={grandTotal} />
          )}

          {/* Charts */}
          {candidates.length > 0 && grandTotal > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5 mb-6">
              <CandidateBarChart barData={barData} />
              <DonutChart donutData={donutData} grandTotal={grandTotal} />
            </div>
          )}

          {/* LGA stacked bar */}
          {candidates.length > 0 && grandTotal > 0 && (
            <LGAStackedBar lgaBarData={lgaBarData} candidates={candidates} />
          )}

          {/* Tabs */}
          <div className="flex gap-1 mb-5 bg-[#F5F5F5] rounded-xl p-1 w-fit">
            {[
              { key: "collation", label: "📋 Collation Table" },
              { key: "submissions", label: "📝 Raw Submissions" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-5 py-2.5 rounded-lg text-[13px] font-medium cursor-pointer border-none transition-all duration-150
                  ${
                    activeTab === key
                      ? "bg-white text-[#1B5E20] font-bold shadow-sm"
                      : "bg-transparent text-[#757575] hover:text-[#212121]"
                  }`}
              >
                {label}
              </button>
            ))}
          </div>

          {activeTab === "collation" && (
            <CollationTable
              candidates={candidates}
              matrix={matrix}
              grandTotals={grandTotals}
              grandTotal={grandTotal}
              collated={collated}
              electionId={electionId}
              expandedLGA={expandedLGA}
              onToggleLGA={(lga) =>
                setExpandedLGA(expandedLGA === lga ? null : lga)
              }
              onViewImage={setImageViewer}
              loadingCollated={loadingCollated}
            />
          )}

          {activeTab === "submissions" && (
            <SubmissionsList
              results={allResults}
              loading={loadingAllResults}
              electionId={electionId}
              statusFilter={statusFilter}
              lgaFilter={lgaFilter}
              onStatusFilter={setStatusFilter}
              onLGAFilter={setLgaFilter}
              onUpdateStatus={(resultId, status) =>
                updateStatus.mutate({ resultId, status, electionId })
              }
              onViewImage={setImageViewer}
            />
          )}
        </>
      )}

      {imageViewer && (
        <ImageViewer
          url={imageViewer.url}
          submitter={imageViewer.submitter}
          submittedAt={imageViewer.submittedAt}
          pollingUnit={imageViewer.pollingUnit}
          onClose={() => setImageViewer(null)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// LEADING CANDIDATE BANNER
// ─────────────────────────────────────────

function LeadingBanner({ candidates, grandTotal }) {
  const leader = candidates[0];
  const pct =
    grandTotal > 0 ? ((leader.total / grandTotal) * 100).toFixed(1) : 0;

  return (
    <div
      className="flex items-center gap-5 rounded-xl px-6 py-4 mb-6 border-[1.5px]"
      style={{
        background: `${leader.color}10`,
        borderColor: `${leader.color}30`,
      }}
    >
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-extrabold shrink-0"
        style={{ background: leader.color }}
      >
        {leader.name.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] text-[#757575] font-bold tracking-widest uppercase mb-0.5">
          Current Leader
        </div>
        <div
          className="font-[Montserrat,sans-serif] text-lg font-extrabold"
          style={{ color: leader.color }}
        >
          {leader.name}{" "}
          <span className="text-sm font-semibold text-[#757575]">
            ({leader.party})
          </span>
        </div>
      </div>
      <div className="text-right shrink-0">
        <div
          className="font-[Montserrat,sans-serif] text-3xl font-extrabold"
          style={{ color: leader.color }}
        >
          {leader.total.toLocaleString()}
        </div>
        <div className="text-sm text-[#757575] font-semibold">
          {pct}% of votes
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// CANDIDATE HORIZONTAL BAR CHART
// ─────────────────────────────────────────

function CandidateBarChart({ barData }) {
  return (
    <div className="bg-white rounded-xl border border-[#E0E0E0] p-6">
      <div className="font-[Montserrat,sans-serif] text-[15px] font-bold text-[#1B5E20] mb-5">
        Votes by Candidate
      </div>
      <ResponsiveContainer
        width="100%"
        height={Math.max(200, barData.length * 52)}
      >
        <BarChart
          data={barData}
          layout="vertical"
          margin={{ left: 8, right: 24, top: 0, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            horizontal={false}
            stroke="#E0E0E0"
          />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: "#757575" }}
            tickFormatter={(v) => v.toLocaleString()}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 12, fill: "#212121" }}
            width={160}
          />
          <Tooltip
            formatter={(v) => [v.toLocaleString(), "Votes"]}
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid #E0E0E0",
              fontFamily: "Poppins, sans-serif",
              fontSize: "13px",
            }}
          />
          <Bar dataKey="votes" radius={[0, 4, 4, 0]}>
            {barData.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─────────────────────────────────────────
// DONUT CHART
// ─────────────────────────────────────────

function DonutChart({ donutData, grandTotal }) {
  const [active, setActive] = useState(null);
  const displayed = active ?? donutData[0];
  const pct =
    grandTotal > 0 ? ((displayed?.value / grandTotal) * 100).toFixed(1) : 0;

  return (
    <div className="bg-white rounded-xl border border-[#E0E0E0] p-6 flex flex-col">
      <div className="font-[Montserrat,sans-serif] text-[15px] font-bold text-[#1B5E20] mb-5">
        Vote Share
      </div>
      <div className="relative flex-1">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={donutData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              dataKey="value"
              onMouseEnter={(_, i) => setActive(donutData[i])}
              onMouseLeave={() => setActive(null)}
              strokeWidth={2}
            >
              {donutData.map((entry, i) => (
                <Cell key={i} fill={entry.color} stroke="#fff" />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {/* Centre label */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
          <div
            className="font-[Montserrat,sans-serif] text-[22px] font-extrabold"
            style={{ color: displayed?.color }}
          >
            {pct}%
          </div>
          <div className="text-[11px] text-[#757575] font-semibold max-w-[80px] leading-tight">
            {displayed?.name}
          </div>
        </div>
      </div>
      {/* Legend */}
      <div className="mt-3">
        {donutData.map((d) => (
          <div
            key={d.name}
            className="flex justify-between items-center py-1.5 border-b border-[#E0E0E0] text-xs"
          >
            <div className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-sm shrink-0"
                style={{ background: d.color }}
              />
              <span className="text-[#212121] font-medium">{d.name}</span>
            </div>
            <span className="font-bold" style={{ color: d.color }}>
              {d.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// LGA STACKED BAR CHART
// ─────────────────────────────────────────

function LGAStackedBar({ lgaBarData, candidates }) {
  return (
    <div className="bg-white rounded-xl border border-[#E0E0E0] p-6 mb-6">
      <div className="font-[Montserrat,sans-serif] text-[15px] font-bold text-[#1B5E20] mb-5">
        Candidate Performance by LGA
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={lgaBarData}
          margin={{ left: 0, right: 16, top: 0, bottom: 40 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#E0E0E0"
          />
          <XAxis
            dataKey="lga"
            tick={{ fontSize: 10, fill: "#757575" }}
            angle={-30}
            textAnchor="end"
            interval={0}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#757575" }}
            tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
          />
          <Tooltip
            formatter={(v, name) => [
              v.toLocaleString(),
              candidates.find((c) => c.id === name)?.name || name,
            ]}
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid #E0E0E0",
              fontFamily: "Poppins, sans-serif",
              fontSize: "12px",
            }}
          />
          <Legend
            formatter={(value) =>
              candidates.find((c) => c.id === value)?.name || value
            }
            wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
          />
          {candidates.map((c) => (
            <Bar key={c.id} dataKey={c.id} stackId="a" fill={c.color} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─────────────────────────────────────────
// COLLATION TABLE
// ─────────────────────────────────────────

function CollationTable({
  candidates,
  matrix,
  grandTotals,
  grandTotal,
  electionId,
  expandedLGA,
  onToggleLGA,
  onViewImage,
  loadingCollated,
}) {
  if (loadingCollated)
    return (
      <div className="bg-white rounded-xl border border-[#E0E0E0] p-8">
        <Skeleton h="h-72" />
      </div>
    );

  if (candidates.length === 0)
    return (
      <div className="bg-white rounded-xl border border-dashed border-[#E0E0E0] py-16 text-center text-[#757575]">
        <div className="text-4xl mb-3">📋</div>
        <div className="text-sm font-semibold">
          No results submitted yet for this election
        </div>
      </div>
    );

  return (
    <div className="bg-white rounded-xl border border-[#E0E0E0] overflow-hidden mb-6">
      <div className="overflow-x-auto">
        <table
          className="w-full border-collapse"
          style={{ minWidth: `${300 + candidates.length * 140}px` }}
        >
          <thead>
            <tr className="bg-[#1B5E20]">
              <th className="sticky left-0 z-20 bg-[#1B5E20] px-4 py-3.5 text-left text-xs font-bold text-white tracking-wide w-[180px]">
                LGA
              </th>
              {candidates.map((c) => (
                <th
                  key={c.id}
                  className="px-4 py-3.5 text-center text-white border-l border-white/15"
                >
                  <div className="text-xs font-bold">{c.name}</div>
                  <div className="text-[10px] opacity-75 mt-0.5">{c.party}</div>
                  <div
                    className="w-2 h-2 rounded-full mx-auto mt-1 border border-white/40"
                    style={{ background: c.color }}
                  />
                </th>
              ))}
              <th className="px-4 py-3.5 text-center text-white border-l border-white/25 bg-black/20 text-xs font-bold">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {VALID_LGAS.map((lga, i) => {
              const lgaTotal = candidates.reduce(
                (s, c) => s + (matrix[lga]?.[c.id] || 0),
                0,
              );
              const isExpanded = expandedLGA === lga;
              return (
                <>
                  <tr
                    key={lga}
                    onClick={() => lgaTotal > 0 && onToggleLGA(lga)}
                    className={`border-b border-[#E0E0E0] transition-colors duration-150
                      ${i % 2 === 0 ? "bg-white" : "bg-[#FAFAFA]"}
                      ${lgaTotal > 0 ? "cursor-pointer hover:bg-green-50" : "cursor-default"}`}
                  >
                    <td className="sticky left-0 z-10 bg-inherit px-4 py-3 text-sm font-semibold text-[#212121]">
                      <div className="flex items-center gap-2">
                        {lgaTotal > 0 && (
                          <span
                            className={`text-xs text-[#757575] transition-transform duration-200 inline-block ${isExpanded ? "rotate-90" : "rotate-0"}`}
                          >
                            ▶
                          </span>
                        )}
                        {lga}
                      </div>
                    </td>
                    {candidates.map((c) => {
                      const votes = matrix[lga]?.[c.id] || 0;
                      const lgaPct =
                        lgaTotal > 0
                          ? ((votes / lgaTotal) * 100).toFixed(1)
                          : 0;
                      return (
                        <td key={c.id} className="px-4 py-3 text-center">
                          {votes > 0 ? (
                            <>
                              <div
                                className="font-[Montserrat,sans-serif] text-[15px] font-bold"
                                style={{ color: c.color }}
                              >
                                {votes.toLocaleString()}
                              </div>
                              <div className="text-[10px] text-[#757575]">
                                {lgaPct}%
                              </div>
                            </>
                          ) : (
                            <span className="text-[#BDBDBD] text-sm">—</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-center bg-[#F5F5F5] text-sm font-bold text-[#212121]">
                      {lgaTotal > 0 ? (
                        lgaTotal.toLocaleString()
                      ) : (
                        <span className="text-[#BDBDBD]">—</span>
                      )}
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr key={`${lga}-expand`}>
                      <td
                        colSpan={candidates.length + 2}
                        className="p-0 bg-[#F9FBF9]"
                      >
                        <WardBreakdownInline
                          electionId={electionId}
                          lga={lga}
                          candidates={candidates}
                          onViewImage={onViewImage}
                        />
                      </td>
                    </tr>
                  )}
                </>
              );
            })}

            {/* Grand total row */}
            <tr className="bg-[#1B5E20] border-t-2 border-[#2E7D32]">
              <td className="sticky left-0 z-10 bg-[#1B5E20] px-4 py-3.5 text-white font-extrabold text-[13px] tracking-wide">
                GRAND TOTAL
              </td>
              {candidates.map((c) => {
                const total = grandTotals[c.id] || 0;
                const pct =
                  grandTotal > 0 ? ((total / grandTotal) * 100).toFixed(1) : 0;
                return (
                  <td key={c.id} className="px-4 py-3.5 text-center">
                    <div className="font-[Montserrat,sans-serif] text-base font-extrabold text-white">
                      {total.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-white/70">{pct}%</div>
                  </td>
                );
              })}
              <td className="px-4 py-3.5 text-center bg-black/20 font-[Montserrat,sans-serif] text-base font-extrabold text-white">
                {grandTotal.toLocaleString()}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2.5 text-[11px] text-[#757575] border-t border-[#E0E0E0] bg-[#F5F5F5]">
        Click any LGA row to expand ward-level breakdown · Soft-deleted results
        excluded
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// WARD BREAKDOWN
// ─────────────────────────────────────────

function WardBreakdownInline({ electionId, lga, candidates, onViewImage }) {
  const { data: entries = [], isLoading } = useWardBreakdown(electionId, lga);

  if (isLoading)
    return (
      <div className="px-8 py-5">
        <Skeleton h="h-20" />
      </div>
    );

  const byWard = {};
  entries.forEach((e) => {
    if (!byWard[e.ward]) byWard[e.ward] = {};
    if (!byWard[e.ward][e.polling_unit]) byWard[e.ward][e.polling_unit] = [];
    byWard[e.ward][e.polling_unit].push(e);
  });

  return (
    <div className="px-8 pt-3 pb-5 border-t border-[#C8E6C9]">
      <div className="text-xs font-bold text-[#1B5E20] mb-3 tracking-widest uppercase">
        {lga} — Ward Breakdown
      </div>
      {Object.entries(byWard).map(([ward, pus]) => (
        <div key={ward} className="mb-4">
          <div className="flex items-center gap-2 text-[13px] font-bold text-[#2E7D32] mb-1.5">
            <span>📍</span> {ward}
          </div>
          {Object.entries(pus).map(([pu, puEntries]) => {
            const puTotal = puEntries.reduce((s, e) => s + e.votes_cast, 0);
            const statusCfg =
              STATUS_CFG[puEntries[0]?.status] || STATUS_CFG.pending;
            const hasImage = !!puEntries[0]?.result_image_url;
            return (
              <div
                key={pu}
                className="ml-5 mb-2 px-3.5 py-2.5 bg-white rounded-xl border border-[#E0E0E0] flex items-center gap-3 flex-wrap"
              >
                <div className="flex-1 min-w-[140px]">
                  <div className="text-[13px] font-semibold text-[#212121]">
                    {pu}
                  </div>
                  <div className="flex gap-1.5 mt-1 flex-wrap">
                    <span
                      className={`${statusCfg.bg} ${statusCfg.color} px-2 py-0.5 rounded-full text-[10px] font-bold`}
                    >
                      {statusCfg.label}
                    </span>
                    {puEntries[0]?.submitter?.full_name && (
                      <span className="text-[10px] text-[#757575]">
                        by {puEntries[0].submitter.full_name}
                      </span>
                    )}
                  </div>
                </div>
                {candidates.map((c) => {
                  const entry = puEntries.find((e) => e.candidate?.id === c.id);
                  return (
                    <div key={c.id} className="text-center min-w-[60px]">
                      <div
                        className="font-[Montserrat,sans-serif] text-[15px] font-bold"
                        style={{ color: c.color }}
                      >
                        {(entry?.votes_cast || 0).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-[#757575]">
                        {c.party}
                      </div>
                    </div>
                  );
                })}
                <div className="text-center min-w-[60px]">
                  <div className="font-[Montserrat,sans-serif] text-[15px] font-bold text-[#212121]">
                    {puTotal.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-[#757575]">Total</div>
                </div>
                {hasImage && (
                  <button
                    onClick={() =>
                      onViewImage({
                        url: puEntries[0].result_image_url,
                        submitter: puEntries[0].submitter?.full_name,
                        submittedAt: puEntries[0].submitted_at,
                        pollingUnit: pu,
                      })
                    }
                    className="px-3 py-1.5 bg-green-50 hover:bg-green-100 border border-[#C8E6C9] rounded-lg text-xs font-semibold text-[#1B5E20] cursor-pointer transition-colors duration-150 whitespace-nowrap"
                  >
                    📄 View Sheet
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────
// SUBMISSIONS LIST
// ─────────────────────────────────────────

function SubmissionsList({
  results,
  loading,
  electionId,
  statusFilter,
  lgaFilter,
  onStatusFilter,
  onLGAFilter,
  onUpdateStatus,
  onViewImage,
}) {
  return (
    <div>
      {/* Filters */}
      <div className="bg-white rounded-xl border border-[#E0E0E0] px-5 py-3.5 mb-4 flex gap-3 flex-wrap items-center">
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilter(e.target.value)}
          className="px-3 py-2 border-[1.5px] border-[#E0E0E0] rounded-lg text-[13px] bg-white outline-none focus:border-[#1B5E20] cursor-pointer transition-colors duration-150"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="disputed">Disputed</option>
        </select>
        <select
          value={lgaFilter}
          onChange={(e) => onLGAFilter(e.target.value)}
          className="px-3 py-2 border-[1.5px] border-[#E0E0E0] rounded-lg text-[13px] bg-white outline-none focus:border-[#1B5E20] cursor-pointer transition-colors duration-150"
        >
          <option value="">All LGAs</option>
          {VALID_LGAS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        <div className="text-[13px] text-[#757575] ml-auto">
          {results.length} result{results.length !== 1 ? "s" : ""}
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-[#E0E0E0] p-6 space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} h="h-14" />
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-[#E0E0E0] py-16 text-center text-[#757575]">
          <div className="text-4xl mb-3">📭</div>
          <div className="text-sm font-semibold">
            No submissions match your filters
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E0E0E0] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#F5F5F5] border-b-2 border-[#E0E0E0]">
                  {[
                    "Polling Unit",
                    "Candidate",
                    "Votes",
                    "Accredited",
                    "Status",
                    "Submitted By",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-3.5 py-3 text-left text-[11px] font-bold text-[#757575] tracking-widest uppercase whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => {
                  const cfg = STATUS_CFG[r.status] || STATUS_CFG.pending;
                  return (
                    <tr
                      key={r.id}
                      className={`border-b border-[#E0E0E0] ${i % 2 === 0 ? "bg-white" : "bg-[#FAFAFA]"}`}
                    >
                      <td className="px-3.5 py-3">
                        <div className="text-[13px] font-semibold text-[#212121]">
                          {r.polling_unit}
                        </div>
                        <div className="text-[11px] text-[#757575]">
                          {r.ward} · {r.lga}
                        </div>
                      </td>
                      <td className="px-3.5 py-3">
                        <div className="text-[13px] font-semibold text-[#212121]">
                          {r.candidate?.full_name}
                        </div>
                        <PartyChip party={r.candidate?.party} />
                      </td>
                      <td className="px-3.5 py-3 font-[Montserrat,sans-serif] text-base font-extrabold text-[#1B5E20]">
                        {r.votes_cast.toLocaleString()}
                      </td>
                      <td className="px-3.5 py-3 text-[13px] text-[#757575]">
                        {r.accredited_voters?.toLocaleString()}
                      </td>
                      <td className="px-3.5 py-3">
                        <span
                          className={`${cfg.bg} ${cfg.color} px-2.5 py-0.5 rounded-full text-[11px] font-bold`}
                        >
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-3.5 py-3 text-[12px] text-[#757575]">
                        {r.submitter?.full_name}
                        <br />
                        <span className="text-[11px]">
                          {formatDate(r.submitted_at)}
                        </span>
                      </td>
                      <td className="px-3.5 py-3">
                        <div className="flex gap-1.5 flex-wrap">
                          {r.status !== "verified" && (
                            <ActionChip
                              label="✅ Verify"
                              color="text-[#2E7D32] border-[#2E7D32]"
                              onClick={() => onUpdateStatus(r.id, "verified")}
                            />
                          )}
                          {r.status !== "disputed" && (
                            <ActionChip
                              label="⚠️ Dispute"
                              color="text-red-700 border-red-700"
                              onClick={() => onUpdateStatus(r.id, "disputed")}
                            />
                          )}
                          {r.result_image_url && (
                            <ActionChip
                              label="📄 Image"
                              color="text-blue-800 border-blue-800"
                              onClick={() =>
                                onViewImage({
                                  url: r.result_image_url,
                                  submitter: r.submitter?.full_name,
                                  submittedAt: r.submitted_at,
                                  pollingUnit: r.polling_unit,
                                })
                              }
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// IMAGE VIEWER LIGHTBOX
// ─────────────────────────────────────────

function ImageViewer({ url, submitter, submittedAt, pollingUnit, onClose }) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center z-[200] p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[860px] flex flex-col gap-3"
      >
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <div className="text-white font-[Montserrat,sans-serif] text-base font-bold">
              Result Sheet — {pollingUnit}
            </div>
            <div className="text-white/60 text-xs mt-0.5">
              Submitted by {submitter} · {formatDate(submittedAt)}
            </div>
          </div>
          <button
            onClick={onClose}
            className="bg-white/15 hover:bg-white/25 border border-white/30 text-white rounded-xl px-4 py-2 text-sm font-semibold cursor-pointer transition-colors duration-150"
          >
            ✕ Close
          </button>
        </div>

        {/* Image */}
        <div
          className="relative bg-black/50 rounded-xl overflow-hidden max-h-[75vh] flex items-center justify-center"
          onContextMenu={(e) => e.preventDefault()}
        >
          <img
            src={url}
            alt="Result sheet"
            className="max-w-full max-h-[75vh] object-contain block select-none"
            draggable={false}
          />
          {/* Watermark */}
          <div className="absolute bottom-4 right-4 bg-[#1B5E20]/85 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-[11px] font-semibold leading-snug">
            Atunluto Group ERMS
            <br />
            Viewed: {new Date().toLocaleDateString("en-NG")}
          </div>
        </div>

        <div className="text-center text-[11px] text-white/40">
          🔒 This image is watermarked and protected. Right-click is disabled.
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// SHARED PRIMITIVES
// ─────────────────────────────────────────

function ActionChip({ label, color, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1.5 bg-transparent border-[1.5px] rounded-lg text-[11px] font-semibold cursor-pointer transition-all duration-150 hover:opacity-75 whitespace-nowrap ${color}`}
    >
      {label}
    </button>
  );
}

function PartyChip({ party }) {
  const cfg = PARTY_COLORS[party?.toUpperCase()] || {
    text: "text-gray-700",
    bg: "bg-gray-100",
  };
  return (
    <span
      className={`inline-block ${cfg.bg} ${cfg.text} px-1.5 py-0.5 rounded text-[11px] font-bold mt-0.5`}
    >
      {party}
    </span>
  );
}

function Skeleton({ h = "h-11" }) {
  return <div className={`${h} bg-[#EEEEEE] rounded-xl animate-pulse`} />;
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

function formatStatus(s) {
  return (
    { upcoming: "Upcoming", active: "Active", concluded: "Concluded" }[s] || s
  );
}
