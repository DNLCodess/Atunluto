"use client";

/**
 * app/results-portal/admin/reports/page.jsx
 * State Admin — Security Reports inbox + Checksum Verification Panel
 */

import { useState } from "react";
import {
  useSecurityReports,
  useUpdateReport,
  useChecksumScan,
} from "@/hooks/use-audit-log";
import { useElections } from "@/hooks/use-elections";

const URGENCY_CFG = {
  low: {
    badge: "bg-green-50 text-green-800",
    dot: "bg-green-400",
    label: "Low",
  },
  medium: {
    badge: "bg-yellow-50 text-yellow-800",
    dot: "bg-yellow-400",
    label: "Medium",
  },
  high: {
    badge: "bg-orange-50 text-orange-800",
    dot: "bg-orange-400",
    label: "High",
  },
  critical: {
    badge: "bg-red-50 text-red-800",
    dot: "bg-red-500",
    label: "Critical",
  },
};

const STATUS_CFG = {
  open: {
    badge: "bg-red-50 text-red-800",
    border: "border-red-300",
    label: "Open",
    btn: "bg-red-50 text-red-800 border-red-300",
  },
  investigating: {
    badge: "bg-orange-50 text-orange-800",
    border: "border-orange-300",
    label: "Investigating",
    btn: "bg-orange-50 text-orange-800 border-orange-300",
  },
  resolved: {
    badge: "bg-green-50 text-green-800",
    border: "border-green-300",
    label: "Resolved",
    btn: "bg-green-50 text-green-800 border-green-300",
  },
};

const TYPE_LABELS = {
  tampering: "Tampering",
  unauthorized_access: "Unauthorised Access",
  suspicious_activity: "Suspicious Activity",
  other: "Other",
};

// ─────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("reports");
  const [statusFilter, setStatusFilter] = useState("");
  const [urgencyFilter, setUrgencyFilter] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const {
    data: reports = [],
    isLoading,
    isError,
  } = useSecurityReports({ status: statusFilter, urgency: urgencyFilter });
  const updateReport = useUpdateReport();

  const critical = reports.filter(
    (r) => ["high", "critical"].includes(r.urgency) && r.status === "open",
  );
  const stats = {
    open: reports.filter((r) => r.status === "open").length,
    investigating: reports.filter((r) => r.status === "investigating").length,
    resolved: reports.filter((r) => r.status === "resolved").length,
  };

  return (
    <div className="p-8 font-[Poppins,sans-serif] text-[#212121]">
      {/* Header */}
      <div className="mb-7">
        <h1 className="font-[Montserrat,sans-serif] text-[26px] font-extrabold text-[#1B5E20] mb-1.5">
          Security & Integrity
        </h1>
        <p className="text-sm text-text-gray">
          Security reports from LGA Admins and checksum tamper-detection scans
        </p>
      </div>

      {/* Critical alert */}
      {critical.length > 0 && (
        <div className="bg-red-50 border-[1.5px] border-red-200 rounded-xl px-5 py-4 mb-6 flex items-center gap-3">
          <span className="text-2xl">🚨</span>
          <div className="flex-1">
            <div className="font-bold text-red-800 text-[15px]">
              {critical.length} High-Priority Report
              {critical.length > 1 ? "s" : ""} Require Immediate Attention
            </div>
            <div className="text-[13px] text-red-700 opacity-80 mt-0.5">
              {critical
                .map((r) => `${r.reporter?.full_name} (${r.reporter?.lga})`)
                .join(" · ")}
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3.5 mb-6">
        {[
          {
            label: "Open",
            value: stats.open,
            color: "text-red-700",
            icon: "🔴",
          },
          {
            label: "Investigating",
            value: stats.investigating,
            color: "text-orange-700",
            icon: "🟡",
          },
          {
            label: "Resolved",
            value: stats.resolved,
            color: "text-[#2E7D32]",
            icon: "🟢",
          },
        ].map(({ label, value, color, icon }) => (
          <div
            key={label}
            className="bg-white rounded-xl px-5 py-5 border border-[#E0E0E0] flex items-center gap-3.5"
          >
            <span className="text-3xl">{icon}</span>
            <div>
              <div
                className={`font-[Montserrat,sans-serif] text-[28px] font-extrabold ${color}`}
              >
                {value}
              </div>
              <div className="text-xs text-text-gray font-semibold mt-0.5">
                {label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-[#F5F5F5] rounded-xl p-1 w-fit">
        {[
          { key: "reports", label: "📋 Security Reports" },
          { key: "checksum", label: "🔍 Checksum Verification" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-5 py-2.5 rounded-lg text-[13px] border-none cursor-pointer transition-all duration-150
              ${
                activeTab === key
                  ? "bg-white font-bold text-[#1B5E20] shadow-sm"
                  : "bg-transparent font-medium text-text-gray"
              }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── REPORTS TAB ── */}
      {activeTab === "reports" && (
        <>
          {/* Filters */}
          <div className="bg-white rounded-xl border border-[#E0E0E0] px-5 py-3.5 mb-4 flex gap-3 flex-wrap items-center">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border-[1.5px] border-[#E0E0E0] rounded-lg text-[13px] bg-white outline-none cursor-pointer focus:border-[#1B5E20] transition-colors duration-150"
            >
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="investigating">Investigating</option>
              <option value="resolved">Resolved</option>
            </select>
            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
              className="px-3 py-2 border-[1.5px] border-[#E0E0E0] rounded-lg text-[13px] bg-white outline-none cursor-pointer focus:border-[#1B5E20] transition-colors duration-150"
            >
              <option value="">All Urgency</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            {(statusFilter || urgencyFilter) && (
              <button
                onClick={() => {
                  setStatusFilter("");
                  setUrgencyFilter("");
                }}
                className="px-3 py-2 border-[1.5px] border-[#E0E0E0] rounded-lg text-[13px] bg-[#F5F5F5] text-text-gray cursor-pointer"
              >
                Clear
              </button>
            )}
            <div className="ml-auto text-[13px] text-text-gray">
              {reports.length} report{reports.length !== 1 ? "s" : ""}
            </div>
          </div>

          {isLoading ? (
            <div className="bg-white rounded-xl border border-[#E0E0E0] p-6 space-y-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : isError ? (
            <ErrorBox message="Failed to load reports." />
          ) : reports.length === 0 ? (
            <EmptyBox
              icon="📭"
              title="No reports"
              subtitle={
                statusFilter || urgencyFilter
                  ? "No reports match your filters."
                  : "No security reports filed yet."
              }
            />
          ) : (
            <div className="flex flex-col gap-2.5">
              {reports.map((report) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  expanded={expandedId === report.id}
                  onToggle={() =>
                    setExpandedId(expandedId === report.id ? null : report.id)
                  }
                  onUpdate={(status, notes) =>
                    updateReport.mutate({
                      reportId: report.id,
                      status,
                      resolution_notes: notes,
                    })
                  }
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── CHECKSUM TAB ── */}
      {activeTab === "checksum" && <ChecksumPanel />}
    </div>
  );
}

// ─────────────────────────────────────────
// REPORT CARD
// ─────────────────────────────────────────

function ReportCard({ report, expanded, onToggle, onUpdate }) {
  const urgCfg = URGENCY_CFG[report.urgency] || URGENCY_CFG.low;
  const stsCfg = STATUS_CFG[report.status] || STATUS_CFG.open;

  const [newStatus, setNewStatus] = useState(report.status);
  const [notes, setNotes] = useState(report.resolution_notes || "");
  const [saving, setSaving] = useState(false);

  const isHighPriority =
    ["high", "critical"].includes(report.urgency) && report.status === "open";

  async function handleSave() {
    setSaving(true);
    await onUpdate(newStatus, notes);
    setSaving(false);
  }

  return (
    <div
      className={`bg-white rounded-xl overflow-hidden border-[1.5px] ${isHighPriority ? "border-red-200" : "border-[#E0E0E0]"}`}
    >
      {/* Header */}
      <div
        onClick={onToggle}
        className="px-5 py-4.5 cursor-pointer flex items-start gap-4"
      >
        <div
          className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${urgCfg.dot}`}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span
              className={`${urgCfg.badge} px-2 py-0.5 rounded text-[11px] font-bold`}
            >
              {urgCfg.label.toUpperCase()}
            </span>
            <span
              className={`${stsCfg.badge} px-2 py-0.5 rounded text-[11px] font-bold`}
            >
              {stsCfg.label}
            </span>
            <span className="text-xs text-text-gray">
              {TYPE_LABELS[report.report_type] || report.report_type}
            </span>
          </div>
          <div
            className={`text-sm text-[#212121] leading-relaxed ${expanded ? "" : "line-clamp-2"}`}
          >
            {report.description}
          </div>
          <div className="flex gap-3 mt-2 text-xs text-text-gray flex-wrap">
            <span>👤 {report.reporter?.full_name}</span>
            <span>📍 {report.reporter?.lga}</span>
            <span>🕐 {formatDate(report.created_at)}</span>
            {report.evidence_url && <span>📎 Evidence attached</span>}
          </div>
        </div>

        <span
          className={`text-text-gray text-base shrink-0 transition-transform duration-200 ${expanded ? "rotate-180" : "rotate-0"}`}
        >
          ▾
        </span>
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="border-t border-[#E0E0E0] px-5 py-5 bg-[#FAFAFA] space-y-5">
          {/* Full description */}
          <div>
            <div className="text-[11px] font-bold text-text-gray tracking-widest uppercase mb-2">
              Full Description
            </div>
            <div className="text-sm text-[#212121] leading-relaxed bg-white px-3.5 py-3.5 rounded-lg border border-[#E0E0E0]">
              {report.description}
            </div>
          </div>

          {/* Evidence */}
          {report.evidence_url && (
            <div>
              <div className="text-[11px] font-bold text-text-gray tracking-widest uppercase mb-2">
                Evidence
              </div>
              <a
                href={report.evidence_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 text-blue-800 rounded-lg text-[13px] font-semibold no-underline hover:bg-blue-100 transition-colors duration-150"
              >
                📎 View Evidence File
              </a>
            </div>
          )}

          {/* Resolution notes (existing) */}
          {report.resolution_notes && (
            <div className="bg-green-50 border border-[#C8E6C9] rounded-lg px-3.5 py-3.5">
              <div className="text-[11px] font-bold text-[#2E7D32] tracking-widest uppercase mb-1.5">
                Resolution Notes
              </div>
              <div className="text-[13px] text-[#212121]">
                {report.resolution_notes}
              </div>
              {report.resolver && (
                <div className="text-[11px] text-text-gray mt-1.5">
                  Resolved by {report.resolver.full_name} ·{" "}
                  {formatDate(report.resolved_at)}
                </div>
              )}
            </div>
          )}

          {/* Update controls */}
          {report.status !== "resolved" && (
            <div className="pt-4 border-t border-[#E0E0E0]">
              <div className="text-[11px] font-bold text-text-gray tracking-widest uppercase mb-3">
                Update Report
              </div>
              <div className="flex gap-3 mb-3 flex-wrap">
                {["open", "investigating", "resolved"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setNewStatus(s)}
                    className={`px-4 py-2 border-[1.5px] rounded-lg text-[13px] cursor-pointer transition-all duration-150
                      ${newStatus === s ? `${STATUS_CFG[s].btn} font-bold` : "bg-white text-text-gray border-[#E0E0E0] font-normal"}`}
                  >
                    {STATUS_CFG[s].label}
                  </button>
                ))}
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add resolution notes (optional)..."
                rows={3}
                className="w-full px-3 py-2.5 border-[1.5px] border-[#E0E0E0] rounded-lg text-[13px] outline-none resize-y focus:border-[#1B5E20] transition-colors duration-150 mb-3 box-border"
              />
              <button
                onClick={handleSave}
                disabled={saving}
                className={`px-6 py-2.5 text-white border-none rounded-lg text-[13px] font-semibold transition-colors duration-150
                  ${saving ? "bg-[#A5D6A7] cursor-not-allowed" : "bg-[#1B5E20] hover:bg-[#2E7D32] cursor-pointer"}`}
              >
                {saving ? "Saving..." : "Save Update"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// CHECKSUM PANEL
// ─────────────────────────────────────────

function ChecksumPanel() {
  const { data: elections = [] } = useElections();
  const [electionId, setElectionId] = useState("");
  const scan = useChecksumScan();

  const scanResult = scan.data || null;
  const scanError = scan.error?.message || "";
  const scanning = scan.isPending;

  function handleScan() {
    if (!electionId) return;
    scan.mutate(electionId);
  }

  return (
    <div className="space-y-5">
      {/* Explanation */}
      <div className="bg-green-50 border border-[#C8E6C9] rounded-xl px-5 py-5">
        <div className="font-[Montserrat,sans-serif] text-[15px] font-bold text-[#1B5E20] mb-2">
          🔍 How Checksum Verification Works
        </div>
        <p className="text-[13px] text-[#2E7D32] leading-relaxed m-0">
          Every result submission generates a SHA-256 checksum of the vote data
          at the time of submission. Running a scan recomputes this checksum
          from the current database values and compares it to the stored one.
          Any mismatch indicates the record has been{" "}
          <strong>modified outside the application</strong> — a potential
          integrity breach.
        </p>
      </div>

      {/* Selector */}
      <div className="bg-white rounded-xl border border-[#E0E0E0] p-6">
        <div className="text-[13px] font-semibold text-[#212121] mb-2.5">
          Select Election to Scan
        </div>
        <div className="flex gap-3 items-end flex-wrap">
          <select
            value={electionId}
            onChange={(e) => {
              setElectionId(e.target.value);
              scan.reset?.();
            }}
            className="flex-1 min-w-[280px] px-3.5 py-2.5 border-[1.5px] border-[#E0E0E0] rounded-lg text-sm bg-white outline-none focus:border-[#1B5E20] transition-colors duration-150 cursor-pointer"
          >
            <option value="">Choose election...</option>
            {elections.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title}
              </option>
            ))}
          </select>
          <button
            onClick={handleScan}
            disabled={!electionId || scanning}
            className={`flex items-center gap-2 px-7 py-2.5 text-white border-none rounded-lg text-sm font-semibold transition-colors duration-150
              ${!electionId || scanning ? "bg-[#A5D6A7] cursor-not-allowed" : "bg-[#1B5E20] hover:bg-[#2E7D32] cursor-pointer"}`}
          >
            {scanning ? (
              <>
                <span className="animate-spin inline-block">⏳</span>{" "}
                Scanning...
              </>
            ) : (
              "🔍 Run Verification Scan"
            )}
          </button>
        </div>
      </div>

      {/* Error */}
      {scanError && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3.5 text-[13px] text-red-800">
          ⚠️ {scanError}
        </div>
      )}

      {/* Results */}
      {scanResult && (
        <div className="space-y-4">
          {/* Summary */}
          <div
            className={`rounded-xl border-[1.5px] px-6 py-5 flex items-center gap-4
            ${scanResult.mismatchCount === 0 ? "bg-green-50 border-[#C8E6C9]" : "bg-red-50 border-red-200"}`}
          >
            <span className="text-4xl">
              {scanResult.mismatchCount === 0 ? "✅" : "🚨"}
            </span>
            <div>
              <div
                className={`font-[Montserrat,sans-serif] text-lg font-extrabold mb-1
                ${scanResult.mismatchCount === 0 ? "text-[#1B5E20]" : "text-red-800"}`}
              >
                {scanResult.mismatchCount === 0
                  ? "All checksums verified — No tampering detected"
                  : `${scanResult.mismatchCount} Checksum Mismatch${scanResult.mismatchCount > 1 ? "es" : ""} Detected`}
              </div>
              <div className="text-[13px] text-text-gray">
                Scanned {scanResult.totalScanned} result
                {scanResult.totalScanned !== 1 ? "s" : ""} ·{" "}
                {formatDate(scanResult.scannedAt)}
              </div>
            </div>
          </div>

          {/* Mismatch list */}
          {scanResult.mismatches.length > 0 && (
            <div className="bg-white rounded-xl border-[1.5px] border-red-200 overflow-hidden">
              <div className="px-5 py-3.5 bg-red-50 border-b border-red-200 text-[13px] font-bold text-red-800">
                ⚠️ Flagged Records — Potential Integrity Breach
              </div>
              {scanResult.mismatches.map((m, i) => (
                <div
                  key={m.id}
                  className={`px-5 py-4.5 ${i < scanResult.mismatches.length - 1 ? "border-b border-[#E0E0E0]" : ""} ${i % 2 === 0 ? "bg-white" : "bg-[#FAFAFA]"}`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="text-sm font-bold text-[#212121]">
                        {m.pollingUnit}
                      </div>
                      <div className="text-xs text-text-gray mt-0.5">
                        {m.ward} · {m.lga} · {m.candidateName} ({m.party}) ·
                        Submitted by {m.submitter}
                      </div>
                    </div>
                    <span className="bg-red-50 text-red-800 px-2.5 py-0.5 rounded text-[11px] font-bold shrink-0">
                      MISMATCH
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="bg-red-50 rounded-lg px-3 py-2.5">
                      <div className="text-[10px] font-bold text-red-800 uppercase tracking-wide mb-1">
                        Stored Checksum
                      </div>
                      <div className="font-mono text-[11px] text-[#212121] break-all">
                        {m.storedChecksum}
                      </div>
                    </div>
                    <div className="bg-orange-50 rounded-lg px-3 py-2.5">
                      <div className="text-[10px] font-bold text-orange-800 uppercase tracking-wide mb-1">
                        Recomputed Checksum
                      </div>
                      <div className="font-mono text-[11px] text-[#212121] break-all">
                        {m.recomputedChecksum}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// SHARED PRIMITIVES
// ─────────────────────────────────────────

function Skeleton({ className = "" }) {
  return (
    <div className={`bg-gray-100 rounded-lg animate-pulse ${className}`} />
  );
}

function ErrorBox({ message }) {
  return (
    <div className="bg-red-50 rounded-xl p-8 text-center text-red-800 text-sm">
      ⚠️ {message}
    </div>
  );
}

function EmptyBox({ icon, title, subtitle }) {
  return (
    <div className="bg-white rounded-xl border border-dashed border-[#E0E0E0] p-16 text-center text-text-gray">
      <div className="text-4xl mb-3">{icon}</div>
      <div className="text-[15px] font-semibold text-[#212121] mb-1.5">
        {title}
      </div>
      <div className="text-[13px]">{subtitle}</div>
    </div>
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
