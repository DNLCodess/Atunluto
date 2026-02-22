"use client";

/**
 * app/results/lga/results/page.jsx
 * LGA Admin — read-only view of their own submissions.
 */

import { useState } from "react";
import { useMyResults } from "@/hooks/use-election-results";
import { useActiveElections } from "@/hooks/use-election-results";

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
};

const STATUS_STYLE = {
  pending: { label: "Pending", bg: "#E3F2FD", color: "#1565C0" },
  verified: { label: "Verified", bg: "#E8F5E9", color: "#2E7D32" },
  disputed: { label: "Disputed", bg: "#FFEBEE", color: "#C62828" },
};

export default function MyResultsPage() {
  // adminId comes from session — injected via a server component wrapper or cookie
  const adminId =
    typeof document !== "undefined"
      ? document.documentElement.dataset.ermsId || ""
      : "";

  const [electionFilter, setElectionFilter] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const { data: elections = [] } = useActiveElections();
  const {
    data: results = [],
    isLoading,
    isError,
  } = useMyResults(adminId, electionFilter || undefined);

  // Group results by polling unit for cleaner display
  const grouped = groupByPollingUnit(results);

  const stats = {
    total: results.length,
    pending: results.filter((r) => r.status === "pending").length,
    verified: results.filter((r) => r.status === "verified").length,
    disputed: results.filter((r) => r.status === "disputed").length,
  };

  return (
    <div style={{ fontFamily: "Poppins, sans-serif", color: C.text }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "32px",
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
            My Submissions
          </h1>
          <p style={{ color: C.gray, fontSize: "14px", margin: 0 }}>
            Read-only record of all results you have submitted
          </p>
        </div>
        <a
          href="/results/lga/submit"
          style={{
            background: C.primary,
            color: "#fff",
            textDecoration: "none",
            borderRadius: "10px",
            padding: "12px 24px",
            fontSize: "14px",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          + Submit New Result
        </a>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "14px",
          marginBottom: "24px",
        }}
      >
        {[
          { label: "Total Submitted", value: stats.total, color: C.primary },
          { label: "Pending Review", value: stats.pending, color: "#1565C0" },
          { label: "Verified", value: stats.verified, color: C.secondary },
          { label: "Disputed", value: stats.disputed, color: C.danger },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            style={{
              background: C.white,
              borderRadius: "12px",
              padding: "18px 20px",
              border: `1px solid ${C.border}`,
            }}
          >
            <div
              style={{
                fontSize: "26px",
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
                marginTop: "2px",
              }}
            >
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div
        style={{
          background: C.white,
          borderRadius: "10px",
          border: `1px solid ${C.border}`,
          padding: "14px 20px",
          marginBottom: "20px",
          display: "flex",
          gap: "12px",
          alignItems: "center",
        }}
      >
        <label
          style={{
            fontSize: "13px",
            fontWeight: 600,
            color: C.text,
            whiteSpace: "nowrap",
          }}
        >
          Filter by Election:
        </label>
        <select
          value={electionFilter}
          onChange={(e) => setElectionFilter(e.target.value)}
          style={{
            flex: 1,
            padding: "8px 12px",
            border: `1.5px solid ${C.border}`,
            borderRadius: "8px",
            fontSize: "13px",
            fontFamily: "Poppins, sans-serif",
            outline: "none",
            background: C.white,
          }}
        >
          <option value="">All Elections</option>
          {elections.map((e) => (
            <option key={e.id} value={e.id}>
              {e.title}
            </option>
          ))}
        </select>
        <div style={{ fontSize: "13px", color: C.gray }}>
          {grouped.length} polling unit{grouped.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Disputed warning */}
      {stats.disputed > 0 && (
        <div
          style={{
            background: "#FFEBEE",
            border: "1px solid #FFCDD2",
            borderRadius: "10px",
            padding: "14px 18px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "13px",
            color: C.danger,
          }}
        >
          <span style={{ fontSize: "20px" }}>⚠️</span>
          <div>
            <strong>
              {stats.disputed} submission{stats.disputed > 1 ? "s" : ""} flagged
              as disputed
            </strong>{" "}
            by the State Admin. Please{" "}
            <a
              href="/results/lga/report"
              style={{ color: C.danger, fontWeight: 700 }}
            >
              file a security report
            </a>{" "}
            if you have concerns.
          </div>
        </div>
      )}

      {/* Results list */}
      <div
        style={{
          background: C.white,
          borderRadius: "12px",
          border: `1px solid ${C.border}`,
          overflow: "hidden",
        }}
      >
        {isLoading ? (
          <div style={{ padding: "24px" }}>
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                style={{
                  height: "70px",
                  background: C.bg,
                  borderRadius: "8px",
                  marginBottom: "8px",
                }}
              />
            ))}
          </div>
        ) : isError ? (
          <div
            style={{
              padding: "40px",
              textAlign: "center",
              color: C.danger,
              fontSize: "14px",
            }}
          >
            Failed to load submissions. Please refresh.
          </div>
        ) : grouped.length === 0 ? (
          <div style={{ padding: "60px", textAlign: "center" }}>
            <div style={{ fontSize: "40px", marginBottom: "14px" }}>📋</div>
            <div
              style={{
                fontSize: "16px",
                fontWeight: 600,
                color: C.text,
                marginBottom: "8px",
              }}
            >
              No submissions yet
            </div>
            <div style={{ fontSize: "13px", color: C.gray }}>
              <a
                href="/results/lga/submit"
                style={{ color: C.secondary, fontWeight: 600 }}
              >
                Submit your first result
              </a>
            </div>
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
        <div
          style={{
            marginTop: "16px",
            padding: "12px 16px",
            background: C.bg,
            borderRadius: "8px",
            fontSize: "12px",
            color: C.gray,
            textAlign: "center",
          }}
        >
          🔒 Submitted results cannot be edited. To request a correction,{" "}
          <a
            href="/results/lga/report"
            style={{ color: C.secondary, fontWeight: 600 }}
          >
            file a security report
          </a>
          .
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// POLLING UNIT GROUP (collapsible)
// ─────────────────────────────────────────

function PollingUnitGroup({ group, expanded, onToggle }) {
  const statusCfg = STATUS_STYLE[group.status] || STATUS_STYLE.pending;
  const firstEntry = group.entries[0];

  return (
    <div style={{ borderBottom: `1px solid ${C.border}` }}>
      {/* Group header */}
      <div
        onClick={onToggle}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          padding: "16px 24px",
          cursor: "pointer",
          background: expanded ? "#F1F8E9" : C.white,
          transition: "background 0.15s",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontSize: "14px", fontWeight: 700, color: C.text }}>
              {group.pollingUnit}
            </span>
            <span
              style={{
                background: statusCfg.bg,
                color: statusCfg.color,
                padding: "2px 8px",
                borderRadius: "20px",
                fontSize: "11px",
                fontWeight: 700,
              }}
            >
              {statusCfg.label}
            </span>
            {group.hasImage && (
              <span
                style={{
                  fontSize: "11px",
                  color: C.secondary,
                  fontWeight: 600,
                }}
              >
                📎 Image attached
              </span>
            )}
          </div>
          <div style={{ fontSize: "12px", color: C.gray, marginTop: "3px" }}>
            {group.ward} · {firstEntry?.election?.title} · Submitted{" "}
            {formatDate(firstEntry?.submitted_at)}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            flexShrink: 0,
          }}
        >
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontSize: "18px",
                fontWeight: 800,
                color: C.primary,
                fontFamily: "Montserrat, sans-serif",
              }}
            >
              {group.totalVotes.toLocaleString()}
            </div>
            <div style={{ fontSize: "11px", color: C.gray }}>total votes</div>
          </div>
          <span
            style={{
              color: C.gray,
              fontSize: "18px",
              transition: "transform 0.2s",
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            }}
          >
            ▾
          </span>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ padding: "0 24px 20px", background: "#FAFAFA" }}>
          {/* Candidate breakdown */}
          <div style={{ marginBottom: "16px" }}>
            {group.entries.map((entry) => (
              <div
                key={entry.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 0",
                  borderBottom: `1px solid ${C.border}`,
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <span
                    style={{ fontSize: "13px", fontWeight: 600, color: C.text }}
                  >
                    {entry.candidate?.full_name}
                  </span>
                  <span
                    style={{
                      background: "#EEE",
                      color: C.gray,
                      padding: "1px 6px",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontWeight: 700,
                    }}
                  >
                    {entry.candidate?.party}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: "18px",
                    fontWeight: 800,
                    color: C.primary,
                    fontFamily: "Montserrat, sans-serif",
                  }}
                >
                  {entry.votes_cast.toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          {/* Voter counts */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "10px",
              marginBottom: "14px",
            }}
          >
            {[
              { label: "Accredited", value: firstEntry?.accredited_voters },
              { label: "Registered", value: firstEntry?.registered_voters },
              { label: "Total Votes", value: group.totalVotes },
            ].map(({ label, value }) => (
              <div
                key={label}
                style={{
                  background: C.white,
                  borderRadius: "8px",
                  padding: "10px 12px",
                  textAlign: "center",
                  border: `1px solid ${C.border}`,
                }}
              >
                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: 700,
                    color: C.primary,
                    fontFamily: "Montserrat, sans-serif",
                  }}
                >
                  {(value || 0).toLocaleString()}
                </div>
                <div
                  style={{ fontSize: "11px", color: C.gray, marginTop: "2px" }}
                >
                  {label}
                </div>
              </div>
            ))}
          </div>

          {/* Notes */}
          {firstEntry?.notes && (
            <div
              style={{
                background: "#FFF8E1",
                borderRadius: "8px",
                padding: "10px 14px",
                fontSize: "13px",
                color: "#5D4037",
                lineHeight: 1.6,
              }}
            >
              <strong>Notes:</strong> {firstEntry.notes}
            </div>
          )}

          {/* Checksum reference */}
          <div
            style={{
              marginTop: "12px",
              fontSize: "11px",
              color: "#BDBDBD",
              fontFamily: "monospace",
            }}
          >
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
