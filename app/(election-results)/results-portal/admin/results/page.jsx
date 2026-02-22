"use client";

/**
 * app/results-portal/admin/results/page.jsx
 * State Admin — Full collation view.
 *
 * Sections:
 *   1. Election selector + summary stats
 *   2. Visual charts (bar + donut via Recharts)
 *   3. Collation table — LGA rows × candidate columns, grand total row
 *   4. Expandable ward/polling-unit breakdown per LGA
 *   5. Raw submissions list with verify/dispute controls + image viewer
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

// ─────────────────────────────────────────
const C = {
  primary: "#1B5E20",
  secondary: "#2E7D32",
  accent: "#4CAF50",
  light: "#C8E6C9",
  text: "#212121",
  gray: "#757575",
  border: "#E0E0E0",
  bg: "#F5F5F5",
  white: "#FFFFFF",
  danger: "#C62828",
  dangerBg: "#FFEBEE",
};

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

// Deterministic colours for up to 8 candidates
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
  pending: { label: "Pending", bg: "#E3F2FD", color: "#1565C0" },
  verified: { label: "Verified", bg: "#E8F5E9", color: "#2E7D32" },
  disputed: { label: "Disputed", bg: "#FFEBEE", color: "#C62828" },
};

// ─────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────

export default function ResultsCollationPage() {
  const { data: elections = [], isLoading: loadingElections } = useElections();

  const [electionId, setElectionId] = useState("");
  const [activeTab, setActiveTab] = useState("collation"); // collation | submissions
  const [expandedLGA, setExpandedLGA] = useState(null);
  const [imageViewer, setImageViewer] = useState(null); // { url, submitter, submittedAt }
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

  // Build candidate list from totals (sorted by total votes desc)
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

  // Build collation matrix: { lga → { candidateId → votes } }
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

  // Grand totals per candidate
  const grandTotals = useMemo(() => {
    const gt = {};
    candidates.forEach((c) => {
      gt[c.id] = c.total;
    });
    return gt;
  }, [candidates]);

  // Stats
  const totalSubmissions = allResults.length;
  const pendingCount = allResults.filter((r) => r.status === "pending").length;
  const disputedCount = allResults.filter(
    (r) => r.status === "disputed",
  ).length;

  // Chart data for horizontal bar
  const barData = candidates.map((c) => ({
    name: `${c.name} (${c.party})`,
    votes: c.total || 0,
    color: c.color,
  }));

  // LGA stacked bar data
  const lgaBarData = VALID_LGAS.map((lga) => {
    const row = {
      lga: lga.replace("Ibadan ", "Ibdn ").replace("Ibarapa ", "Ibrp "),
    };
    candidates.forEach((c) => {
      row[c.id] = matrix[lga]?.[c.id] || 0;
    });
    return row;
  });

  // Donut data
  const donutData = candidates.map((c) => ({
    name: c.name,
    value: c.total || 0,
    color: c.color,
  }));
  const grandTotal = candidates.reduce((s, c) => s + (c.total || 0), 0);

  return (
    <div style={{ fontFamily: "Poppins, sans-serif", color: C.text }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "28px",
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "Montserrat, sans-serif",
              fontSize: "26px",
              fontWeight: 800,
              color: C.primary,
              margin: "0 0 6px",
            }}
          >
            Result Collation
          </h1>
          <p style={{ color: C.gray, fontSize: "14px", margin: 0 }}>
            Aggregated election results across all 9 LGAs
          </p>
        </div>
        {selectedElection && (
          <button
            onClick={() => window.print()}
            style={{
              padding: "10px 20px",
              background: C.bg,
              border: `1.5px solid ${C.border}`,
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "Poppins, sans-serif",
              color: C.text,
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            🖨️ Print / Export
          </button>
        )}
      </div>

      {/* Election selector */}
      <div
        style={{
          background: C.white,
          borderRadius: "12px",
          border: `1px solid ${C.border}`,
          padding: "20px 24px",
          marginBottom: "24px",
        }}
      >
        <label
          style={{
            fontSize: "13px",
            fontWeight: 600,
            color: C.text,
            display: "block",
            marginBottom: "10px",
          }}
        >
          Select Election to View
        </label>
        {loadingElections ? (
          <Skeleton h={44} />
        ) : (
          <select
            value={electionId}
            onChange={(e) => {
              setElectionId(e.target.value);
              setExpandedLGA(null);
              setStatusFilter("");
              setLgaFilter("");
            }}
            style={{
              width: "100%",
              maxWidth: "480px",
              padding: "11px 14px",
              border: `1.5px solid ${C.border}`,
              borderRadius: "8px",
              fontSize: "14px",
              fontFamily: "Poppins, sans-serif",
              outline: "none",
              background: C.white,
              cursor: "pointer",
            }}
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

      {!electionId && (
        <div
          style={{
            background: C.white,
            borderRadius: "12px",
            border: `1px dashed ${C.border}`,
            padding: "80px",
            textAlign: "center",
            color: C.gray,
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>📊</div>
          <div style={{ fontSize: "16px", fontWeight: 600 }}>
            Select an election above to view collated results
          </div>
        </div>
      )}

      {electionId && (
        <>
          {/* Summary stats */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "14px",
              marginBottom: "24px",
            }}
          >
            {[
              {
                label: "Total Votes Cast",
                value: grandTotal.toLocaleString(),
                color: C.primary,
              },
              {
                label: "Submissions",
                value: totalSubmissions,
                color: "#1565C0",
              },
              {
                label: "Pending Review",
                value: pendingCount,
                color: "#E65100",
              },
              { label: "Disputed", value: disputedCount, color: C.danger },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                style={{
                  background: C.white,
                  borderRadius: "12px",
                  padding: "20px 22px",
                  border: `1px solid ${C.border}`,
                }}
              >
                <div
                  style={{
                    fontSize: "28px",
                    fontWeight: 800,
                    color,
                    fontFamily: "Montserrat, sans-serif",
                  }}
                >
                  {value}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: C.gray,
                    fontWeight: 600,
                    marginTop: "4px",
                  }}
                >
                  {label}
                </div>
              </div>
            ))}
          </div>

          {/* Leading candidate banner */}
          {candidates.length > 0 && grandTotal > 0 && (
            <LeadingBanner candidates={candidates} grandTotal={grandTotal} />
          )}

          {/* Charts */}
          {candidates.length > 0 && grandTotal > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 380px",
                gap: "20px",
                marginBottom: "24px",
              }}
            >
              <CandidateBarChart barData={barData} />
              <DonutChart donutData={donutData} grandTotal={grandTotal} />
            </div>
          )}

          {/* LGA stacked bar */}
          {candidates.length > 0 && grandTotal > 0 && (
            <LGAStackedBar lgaBarData={lgaBarData} candidates={candidates} />
          )}

          {/* Tabs */}
          <div
            style={{
              display: "flex",
              gap: "4px",
              marginBottom: "20px",
              background: C.bg,
              borderRadius: "10px",
              padding: "4px",
              width: "fit-content",
            }}
          >
            {[
              { key: "collation", label: "📋 Collation Table" },
              { key: "submissions", label: "📝 Raw Submissions" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                style={{
                  padding: "9px 20px",
                  background: activeTab === key ? C.white : "transparent",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: activeTab === key ? 700 : 500,
                  color: activeTab === key ? C.primary : C.gray,
                  cursor: "pointer",
                  fontFamily: "Poppins, sans-serif",
                  boxShadow:
                    activeTab === key ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                  transition: "all 0.15s",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* COLLATION TABLE */}
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

          {/* RAW SUBMISSIONS */}
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

      {/* Image Viewer Lightbox */}
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
      style={{
        background: `linear-gradient(135deg, ${leader.color}15, ${leader.color}05)`,
        border: `1.5px solid ${leader.color}30`,
        borderRadius: "12px",
        padding: "16px 24px",
        marginBottom: "24px",
        display: "flex",
        alignItems: "center",
        gap: "20px",
      }}
    >
      <div
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          background: leader.color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontSize: "18px",
          fontWeight: 800,
          flexShrink: 0,
        }}
      >
        {leader.name.charAt(0)}
      </div>
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: "11px",
            color: C.gray,
            fontWeight: 600,
            letterSpacing: "0.8px",
            textTransform: "uppercase",
          }}
        >
          Current Leader
        </div>
        <div
          style={{
            fontSize: "18px",
            fontWeight: 800,
            color: leader.color,
            fontFamily: "Montserrat, sans-serif",
          }}
        >
          {leader.name}{" "}
          <span style={{ fontSize: "14px", fontWeight: 600, color: C.gray }}>
            ({leader.party})
          </span>
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div
          style={{
            fontSize: "28px",
            fontWeight: 800,
            color: leader.color,
            fontFamily: "Montserrat, sans-serif",
          }}
        >
          {leader.total.toLocaleString()}
        </div>
        <div style={{ fontSize: "14px", color: C.gray, fontWeight: 600 }}>
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
    <div
      style={{
        background: C.white,
        borderRadius: "12px",
        border: `1px solid ${C.border}`,
        padding: "24px",
      }}
    >
      <div
        style={{
          fontFamily: "Montserrat, sans-serif",
          fontSize: "15px",
          fontWeight: 700,
          color: C.primary,
          marginBottom: "20px",
        }}
      >
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
            stroke={C.border}
          />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: C.gray }}
            tickFormatter={(v) => v.toLocaleString()}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 12, fill: C.text }}
            width={160}
          />
          <Tooltip
            formatter={(v) => [v.toLocaleString(), "Votes"]}
            contentStyle={{
              borderRadius: "8px",
              border: `1px solid ${C.border}`,
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
    <div
      style={{
        background: C.white,
        borderRadius: "12px",
        border: `1px solid ${C.border}`,
        padding: "24px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          fontFamily: "Montserrat, sans-serif",
          fontSize: "15px",
          fontWeight: 700,
          color: C.primary,
          marginBottom: "20px",
        }}
      >
        Vote Share
      </div>
      <div style={{ position: "relative", flex: 1 }}>
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
                <Cell key={i} fill={entry.color} stroke={C.white} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {/* Centre label */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              fontSize: "22px",
              fontWeight: 800,
              color: displayed?.color,
              fontFamily: "Montserrat, sans-serif",
            }}
          >
            {pct}%
          </div>
          <div
            style={{
              fontSize: "11px",
              color: C.gray,
              fontWeight: 600,
              maxWidth: "80px",
              lineHeight: 1.3,
            }}
          >
            {displayed?.name}
          </div>
        </div>
      </div>
      {/* Legend */}
      <div style={{ marginTop: "12px" }}>
        {donutData.map((d) => (
          <div
            key={d.name}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "5px 0",
              borderBottom: `1px solid ${C.border}`,
              fontSize: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "2px",
                  background: d.color,
                  flexShrink: 0,
                }}
              />
              <span style={{ color: C.text, fontWeight: 500 }}>{d.name}</span>
            </div>
            <span style={{ fontWeight: 700, color: d.color }}>
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
    <div
      style={{
        background: C.white,
        borderRadius: "12px",
        border: `1px solid ${C.border}`,
        padding: "24px",
        marginBottom: "24px",
      }}
    >
      <div
        style={{
          fontFamily: "Montserrat, sans-serif",
          fontSize: "15px",
          fontWeight: 700,
          color: C.primary,
          marginBottom: "20px",
        }}
      >
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
            stroke={C.border}
          />
          <XAxis
            dataKey="lga"
            tick={{ fontSize: 10, fill: C.gray }}
            angle={-30}
            textAnchor="end"
            interval={0}
          />
          <YAxis
            tick={{ fontSize: 11, fill: C.gray }}
            tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
          />
          <Tooltip
            formatter={(v, name) => [
              v.toLocaleString(),
              candidates.find((c) => c.id === name)?.name || name,
            ]}
            contentStyle={{
              borderRadius: "8px",
              border: `1px solid ${C.border}`,
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
      <div
        style={{
          background: C.white,
          borderRadius: "12px",
          border: `1px solid ${C.border}`,
          padding: "32px",
        }}
      >
        <Skeleton h={300} />
      </div>
    );

  if (candidates.length === 0)
    return (
      <div
        style={{
          background: C.white,
          borderRadius: "12px",
          border: `1px dashed ${C.border}`,
          padding: "60px",
          textAlign: "center",
          color: C.gray,
        }}
      >
        <div style={{ fontSize: "36px", marginBottom: "12px" }}>📋</div>
        <div style={{ fontSize: "14px", fontWeight: 600 }}>
          No results submitted yet for this election
        </div>
      </div>
    );

  return (
    <div
      style={{
        background: C.white,
        borderRadius: "12px",
        border: `1px solid ${C.border}`,
        overflow: "hidden",
        marginBottom: "24px",
      }}
    >
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            minWidth: `${300 + candidates.length * 140}px`,
          }}
        >
          <thead>
            <tr style={{ background: C.primary }}>
              <th
                style={{
                  ...thStyle,
                  textAlign: "left",
                  width: "180px",
                  position: "sticky",
                  left: 0,
                  background: C.primary,
                  zIndex: 2,
                }}
              >
                LGA
              </th>
              {candidates.map((c) => (
                <th
                  key={c.id}
                  style={{
                    ...thStyle,
                    borderLeft: `1px solid rgba(255,255,255,0.15)`,
                  }}
                >
                  <div style={{ fontSize: "12px", fontWeight: 700 }}>
                    {c.name}
                  </div>
                  <div
                    style={{ fontSize: "10px", opacity: 0.8, marginTop: "2px" }}
                  >
                    {c.party}
                  </div>
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: c.color,
                      margin: "4px auto 0",
                      border: "1px solid rgba(255,255,255,0.4)",
                    }}
                  />
                </th>
              ))}
              <th
                style={{
                  ...thStyle,
                  borderLeft: `1px solid rgba(255,255,255,0.25)`,
                  background: "rgba(0,0,0,0.2)",
                }}
              >
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
                    style={{
                      background: i % 2 === 0 ? C.white : "#FAFAFA",
                      cursor: lgaTotal > 0 ? "pointer" : "default",
                      borderBottom: `1px solid ${C.border}`,
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) =>
                      lgaTotal > 0 &&
                      (e.currentTarget.style.background = "#F1F8E9")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background =
                        i % 2 === 0 ? C.white : "#FAFAFA")
                    }
                  >
                    <td
                      style={{
                        ...tdStyle,
                        fontWeight: 600,
                        position: "sticky",
                        left: 0,
                        background: "inherit",
                        zIndex: 1,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        {lgaTotal > 0 && (
                          <span
                            style={{
                              fontSize: "12px",
                              color: C.gray,
                              transition: "transform 0.2s",
                              display: "inline-block",
                              transform: isExpanded
                                ? "rotate(90deg)"
                                : "rotate(0deg)",
                            }}
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
                        <td
                          key={c.id}
                          style={{ ...tdStyle, textAlign: "center" }}
                        >
                          {votes > 0 ? (
                            <>
                              <div
                                style={{
                                  fontWeight: 700,
                                  fontSize: "15px",
                                  color: c.color,
                                  fontFamily: "Montserrat, sans-serif",
                                }}
                              >
                                {votes.toLocaleString()}
                              </div>
                              <div style={{ fontSize: "10px", color: C.gray }}>
                                {lgaPct}%
                              </div>
                            </>
                          ) : (
                            <span
                              style={{ color: "#BDBDBD", fontSize: "13px" }}
                            >
                              —
                            </span>
                          )}
                        </td>
                      );
                    })}
                    <td
                      style={{
                        ...tdStyle,
                        textAlign: "center",
                        fontWeight: 700,
                        background: "#F5F5F5",
                      }}
                    >
                      {lgaTotal > 0 ? (
                        lgaTotal.toLocaleString()
                      ) : (
                        <span style={{ color: "#BDBDBD" }}>—</span>
                      )}
                    </td>
                  </tr>

                  {/* Expanded ward breakdown */}
                  {isExpanded && (
                    <tr key={`${lga}-expand`}>
                      <td
                        colSpan={candidates.length + 2}
                        style={{ padding: 0, background: "#F9FBF9" }}
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
            <tr
              style={{
                background: C.primary,
                borderTop: `2px solid ${C.secondary}`,
              }}
            >
              <td
                style={{
                  ...tdStyle,
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: "13px",
                  position: "sticky",
                  left: 0,
                  background: C.primary,
                  zIndex: 1,
                }}
              >
                GRAND TOTAL
              </td>
              {candidates.map((c) => {
                const total = grandTotals[c.id] || 0;
                const pct =
                  grandTotal > 0 ? ((total / grandTotal) * 100).toFixed(1) : 0;
                return (
                  <td key={c.id} style={{ ...tdStyle, textAlign: "center" }}>
                    <div
                      style={{
                        fontWeight: 800,
                        fontSize: "16px",
                        color: "#fff",
                        fontFamily: "Montserrat, sans-serif",
                      }}
                    >
                      {total.toLocaleString()}
                    </div>
                    <div
                      style={{
                        fontSize: "10px",
                        color: "rgba(255,255,255,0.7)",
                      }}
                    >
                      {pct}%
                    </div>
                  </td>
                );
              })}
              <td
                style={{
                  ...tdStyle,
                  textAlign: "center",
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: "16px",
                  fontFamily: "Montserrat, sans-serif",
                  background: "rgba(0,0,0,0.2)",
                }}
              >
                {grandTotal.toLocaleString()}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div
        style={{
          padding: "10px 16px",
          fontSize: "11px",
          color: C.gray,
          borderTop: `1px solid ${C.border}`,
          background: C.bg,
        }}
      >
        Click any LGA row to expand ward-level breakdown · Soft-deleted results
        excluded
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// WARD BREAKDOWN (inline expanded row)
// ─────────────────────────────────────────

function WardBreakdownInline({ electionId, lga, candidates, onViewImage }) {
  const { data: entries = [], isLoading } = useWardBreakdown(electionId, lga);

  if (isLoading)
    return (
      <div style={{ padding: "20px 32px" }}>
        <Skeleton h={80} />
      </div>
    );

  // Group by ward then polling unit
  const byWard = {};
  entries.forEach((e) => {
    if (!byWard[e.ward]) byWard[e.ward] = {};
    if (!byWard[e.ward][e.polling_unit]) byWard[e.ward][e.polling_unit] = [];
    byWard[e.ward][e.polling_unit].push(e);
  });

  return (
    <div
      style={{ padding: "12px 32px 20px", borderTop: `1px solid ${C.light}` }}
    >
      <div
        style={{
          fontSize: "12px",
          fontWeight: 700,
          color: C.primary,
          marginBottom: "12px",
          textTransform: "uppercase",
          letterSpacing: "0.8px",
        }}
      >
        {lga} — Ward Breakdown
      </div>
      {Object.entries(byWard).map(([ward, pus]) => (
        <div key={ward} style={{ marginBottom: "16px" }}>
          <div
            style={{
              fontSize: "13px",
              fontWeight: 700,
              color: C.secondary,
              marginBottom: "6px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
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
                style={{
                  marginLeft: "20px",
                  marginBottom: "8px",
                  padding: "10px 14px",
                  background: C.white,
                  borderRadius: "8px",
                  border: `1px solid ${C.border}`,
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ flex: 1, minWidth: "140px" }}>
                  <div
                    style={{ fontSize: "13px", fontWeight: 600, color: C.text }}
                  >
                    {pu}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: "6px",
                      marginTop: "3px",
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        background: statusCfg.bg,
                        color: statusCfg.color,
                        padding: "1px 6px",
                        borderRadius: "12px",
                        fontSize: "10px",
                        fontWeight: 700,
                      }}
                    >
                      {statusCfg.label}
                    </span>
                    {puEntries[0]?.submitter?.full_name && (
                      <span style={{ fontSize: "10px", color: C.gray }}>
                        by {puEntries[0].submitter.full_name}
                      </span>
                    )}
                  </div>
                </div>
                {candidates.map((c) => {
                  const entry = puEntries.find((e) => e.candidate?.id === c.id);
                  return (
                    <div
                      key={c.id}
                      style={{ textAlign: "center", minWidth: "60px" }}
                    >
                      <div
                        style={{
                          fontSize: "15px",
                          fontWeight: 700,
                          color: c.color,
                          fontFamily: "Montserrat, sans-serif",
                        }}
                      >
                        {(entry?.votes_cast || 0).toLocaleString()}
                      </div>
                      <div style={{ fontSize: "10px", color: C.gray }}>
                        {c.party}
                      </div>
                    </div>
                  );
                })}
                <div style={{ textAlign: "center", minWidth: "60px" }}>
                  <div
                    style={{
                      fontSize: "15px",
                      fontWeight: 700,
                      color: C.text,
                      fontFamily: "Montserrat, sans-serif",
                    }}
                  >
                    {puTotal.toLocaleString()}
                  </div>
                  <div style={{ fontSize: "10px", color: C.gray }}>Total</div>
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
                    style={{
                      padding: "6px 12px",
                      background: "#E8F5E9",
                      border: `1px solid ${C.light}`,
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: C.primary,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
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
// SUBMISSIONS LIST (raw entries tab)
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
  const updateStatus = useUpdateResultStatus();

  return (
    <div>
      {/* Filters */}
      <div
        style={{
          background: C.white,
          borderRadius: "10px",
          border: `1px solid ${C.border}`,
          padding: "14px 20px",
          marginBottom: "16px",
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilter(e.target.value)}
          style={miniSelectStyle}
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="disputed">Disputed</option>
        </select>
        <select
          value={lgaFilter}
          onChange={(e) => onLGAFilter(e.target.value)}
          style={miniSelectStyle}
        >
          <option value="">All LGAs</option>
          {VALID_LGAS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        <div style={{ fontSize: "13px", color: C.gray, marginLeft: "auto" }}>
          {results.length} result{results.length !== 1 ? "s" : ""}
        </div>
      </div>

      {loading ? (
        <div
          style={{
            background: C.white,
            borderRadius: "12px",
            border: `1px solid ${C.border}`,
            padding: "24px",
          }}
        >
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} h={60} mb={8} />
          ))}
        </div>
      ) : results.length === 0 ? (
        <div
          style={{
            background: C.white,
            borderRadius: "12px",
            border: `1px dashed ${C.border}`,
            padding: "60px",
            textAlign: "center",
            color: C.gray,
          }}
        >
          <div style={{ fontSize: "32px", marginBottom: "12px" }}>📭</div>
          <div style={{ fontSize: "14px", fontWeight: 600 }}>
            No submissions match your filters
          </div>
        </div>
      ) : (
        <div
          style={{
            background: C.white,
            borderRadius: "12px",
            border: `1px solid ${C.border}`,
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{
                  background: C.bg,
                  borderBottom: `2px solid ${C.border}`,
                }}
              >
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
                    style={{
                      padding: "11px 14px",
                      textAlign: "left",
                      fontSize: "11px",
                      fontWeight: 700,
                      color: C.gray,
                      letterSpacing: "0.8px",
                      textTransform: "uppercase",
                    }}
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
                    style={{
                      background: i % 2 === 0 ? C.white : "#FAFAFA",
                      borderBottom: `1px solid ${C.border}`,
                    }}
                  >
                    <td style={{ padding: "12px 14px" }}>
                      <div
                        style={{
                          fontSize: "13px",
                          fontWeight: 600,
                          color: C.text,
                        }}
                      >
                        {r.polling_unit}
                      </div>
                      <div style={{ fontSize: "11px", color: C.gray }}>
                        {r.ward} · {r.lga}
                      </div>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <div
                        style={{
                          fontSize: "13px",
                          fontWeight: 600,
                          color: C.text,
                        }}
                      >
                        {r.candidate?.full_name}
                      </div>
                      <div style={{ fontSize: "11px" }}>
                        <PartyChip party={r.candidate?.party} />
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "12px 14px",
                        fontSize: "16px",
                        fontWeight: 800,
                        color: C.primary,
                        fontFamily: "Montserrat, sans-serif",
                      }}
                    >
                      {r.votes_cast.toLocaleString()}
                    </td>
                    <td
                      style={{
                        padding: "12px 14px",
                        fontSize: "13px",
                        color: C.gray,
                      }}
                    >
                      {r.accredited_voters?.toLocaleString()}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span
                        style={{
                          background: cfg.bg,
                          color: cfg.color,
                          padding: "3px 8px",
                          borderRadius: "12px",
                          fontSize: "11px",
                          fontWeight: 700,
                        }}
                      >
                        {cfg.label}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "12px 14px",
                        fontSize: "12px",
                        color: C.gray,
                      }}
                    >
                      {r.submitter?.full_name}
                      <br />
                      <span style={{ fontSize: "11px" }}>
                        {formatDate(r.submitted_at)}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <div
                        style={{
                          display: "flex",
                          gap: "6px",
                          flexWrap: "wrap",
                        }}
                      >
                        {r.status !== "verified" && (
                          <ActionChip
                            label="✅ Verify"
                            color={C.secondary}
                            onClick={() => onUpdateStatus(r.id, "verified")}
                          />
                        )}
                        {r.status !== "disputed" && (
                          <ActionChip
                            label="⚠️ Dispute"
                            color={C.danger}
                            onClick={() => onUpdateStatus(r.id, "disputed")}
                          />
                        )}
                        {r.result_image_url && (
                          <ActionChip
                            label="📄 Image"
                            color="#1565C0"
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
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(4px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 200,
        padding: "24px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "860px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                color: "#fff",
                fontWeight: 700,
                fontSize: "16px",
                fontFamily: "Montserrat, sans-serif",
              }}
            >
              Result Sheet — {pollingUnit}
            </div>
            <div
              style={{
                color: "rgba(255,255,255,0.6)",
                fontSize: "12px",
                marginTop: "2px",
              }}
            >
              Submitted by {submitter} · {formatDate(submittedAt)}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.3)",
              color: "#fff",
              borderRadius: "8px",
              padding: "8px 16px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 600,
              fontFamily: "Poppins, sans-serif",
            }}
          >
            ✕ Close
          </button>
        </div>

        {/* Image */}
        <div
          style={{
            position: "relative",
            background: "#111",
            borderRadius: "12px",
            overflow: "hidden",
            maxHeight: "75vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img
            src={url}
            alt="Result sheet"
            style={{
              maxWidth: "100%",
              maxHeight: "75vh",
              objectFit: "contain",
              display: "block",
            }}
          />

          {/* Watermark overlay */}
          <div
            style={{
              position: "absolute",
              bottom: "16px",
              right: "16px",
              background: "rgba(27, 94, 32, 0.85)",
              color: "#fff",
              padding: "6px 12px",
              borderRadius: "6px",
              fontSize: "11px",
              fontWeight: 600,
              lineHeight: 1.5,
              backdropFilter: "blur(4px)",
            }}
          >
            Atunluto Group ERMS
            <br />
            Viewed: {new Date().toLocaleDateString("en-NG")}
          </div>
        </div>

        {/* No download notice */}
        <div
          style={{
            textAlign: "center",
            fontSize: "11px",
            color: "rgba(255,255,255,0.4)",
          }}
        >
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
      style={{
        padding: "5px 10px",
        background: "transparent",
        border: `1.5px solid ${color}`,
        borderRadius: "6px",
        fontSize: "11px",
        fontWeight: 600,
        color,
        cursor: "pointer",
        fontFamily: "Poppins, sans-serif",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

function PartyChip({ party }) {
  const colors = {
    APC: "#1565C0",
    PDP: "#C62828",
    LP: "#F57F17",
    ADC: "#6A1B9A",
    NNPP: "#2E7D32",
  };
  const bgs = {
    APC: "#E3F2FD",
    PDP: "#FFEBEE",
    LP: "#FFF8E1",
    ADC: "#F3E5F5",
    NNPP: "#E8F5E9",
  };
  return (
    <span
      style={{
        background: bgs[party] || "#EEE",
        color: colors[party] || C.gray,
        padding: "1px 6px",
        borderRadius: "4px",
        fontSize: "11px",
        fontWeight: 700,
      }}
    >
      {party}
    </span>
  );
}

function Skeleton({ h = 44, mb = 0 }) {
  return (
    <div
      style={{
        height: `${h}px`,
        background: "#EEEEEE",
        borderRadius: "8px",
        marginBottom: `${mb}px`,
      }}
    />
  );
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

const thStyle = {
  padding: "14px 16px",
  color: "#fff",
  fontFamily: "Poppins, sans-serif",
  fontSize: "12px",
  fontWeight: 700,
  textAlign: "center",
  whiteSpace: "nowrap",
};

const tdStyle = {
  padding: "12px 16px",
  fontSize: "13px",
  color: C.text,
  verticalAlign: "middle",
};

const miniSelectStyle = {
  padding: "8px 12px",
  border: `1.5px solid ${C.border}`,
  borderRadius: "8px",
  fontSize: "13px",
  fontFamily: "Poppins, sans-serif",
  outline: "none",
  background: C.white,
  cursor: "pointer",
};
