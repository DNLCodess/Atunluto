"use client";

/**
 * app/results-portal/admin/audit/page.jsx
 * State Admin — Paginated, filterable audit log with colour-coded rows and diff viewer.
 */

import { useState } from "react";
import { useAuditLog, useAdminsList } from "@/hooks/use-audit-log";

const ACTION_STYLE = {
  INSERT: { bg: "#E8F5E9", color: "#2E7D32", dot: "#4CAF50", label: "INSERT" },
  UPDATE: { bg: "#FFF8E1", color: "#F57F17", dot: "#FFC107", label: "UPDATE" },
  DELETE: { bg: "#FFEBEE", color: "#C62828", dot: "#EF5350", label: "DELETE" },
  LOGIN_SUCCESS: {
    bg: "#E3F2FD",
    color: "#1565C0",
    dot: "#42A5F5",
    label: "LOGIN",
  },
  LOGIN_FAILED: {
    bg: "#FFEBEE",
    color: "#C62828",
    dot: "#EF5350",
    label: "FAILED LOGIN",
  },
  PASSWORD_CHANGE: {
    bg: "#F3E5F5",
    color: "#6A1B9A",
    dot: "#AB47BC",
    label: "PWD CHANGE",
  },
  PASSWORD_REGENERATE: {
    bg: "#FFF3E0",
    color: "#E65100",
    dot: "#FF7043",
    label: "PWD REGEN",
  },
  ACCOUNT_ACTIVATED: {
    bg: "#E8F5E9",
    color: "#2E7D32",
    dot: "#4CAF50",
    label: "ACTIVATED",
  },
  ACCOUNT_DEACTIVATED: {
    bg: "#EEEEEE",
    color: "#616161",
    dot: "#9E9E9E",
    label: "DEACTIVATED",
  },
  CHECKSUM_MISMATCH: {
    bg: "#FFEBEE",
    color: "#B71C1C",
    dot: "#D32F2F",
    label: "⚠ TAMPER",
  },
};

const TABLE_NAMES = [
  "election_results",
  "elections",
  "candidates",
  "election_admins",
  "security_reports",
];

const PAGE_SIZE = 50;

export default function AuditLogPage() {
  const [page, setPage] = useState(0);
  const [action, setAction] = useState("");
  const [table, setTable] = useState("");
  const [adminId, setAdminId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const { data, isLoading, isError, isFetching } = useAuditLog({
    page,
    action,
    table,
    adminId,
    dateFrom,
    dateTo,
  });
  const { data: admins = [] } = useAdminsList();

  const entries = data?.entries || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  function resetFilters() {
    setAction("");
    setTable("");
    setAdminId("");
    setDateFrom("");
    setDateTo("");
    setPage(0);
  }

  const hasFilters = action || table || adminId || dateFrom || dateTo;

  return (
    <div className="font-[Poppins,sans-serif] text-text-dark">
      {/* Header */}
      <div className="mb-7">
        <h1 className="font-[Montserrat,sans-serif] text-[26px] font-extrabold text-[#1B5E20] m-0 mb-1.5">
          Audit Log
        </h1>
        <p className="text-text-gray text-sm m-0">
          Tamper-evident, append-only record of every action in the system
        </p>
      </div>

      {/* Immutability notice */}
      <div className="bg-[#E8F5E9] border border-[#C8E6C9] rounded-[10px] px-[18px] py-3 mb-6 flex gap-2.5 items-center text-[13px] text-[#2E7D32]">
        <span className="text-base">🔒</span>
        <span>
          This log is <strong>append-only</strong>. No entries can be edited or
          deleted by any application role.
        </span>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-[#E0E0E0] px-5 py-[18px] mb-5">
        <div className="grid grid-cols-5 gap-3 items-end">
          <div>
            <label className="block text-xs font-semibold text-text-dark mb-1.5">
              Action Type
            </label>
            <select
              value={action}
              onChange={(e) => {
                setAction(e.target.value);
                setPage(0);
              }}
              className="w-full px-3 py-[9px] border-[1.5px] border-[#E0E0E0] rounded-lg text-[13px] font-[Poppins,sans-serif] outline-none box-border bg-white cursor-pointer"
            >
              <option value="">All Actions</option>
              {Object.entries(ACTION_STYLE).map(([key, cfg]) => (
                <option key={key} value={key}>
                  {cfg.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-dark mb-1.5">
              Table
            </label>
            <select
              value={table}
              onChange={(e) => {
                setTable(e.target.value);
                setPage(0);
              }}
              className="w-full px-3 py-[9px] border-[1.5px] border-[#E0E0E0] rounded-lg text-[13px] font-[Poppins,sans-serif] outline-none box-border bg-white cursor-pointer"
            >
              <option value="">All Tables</option>
              {TABLE_NAMES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-dark mb-1.5">
              Performed By
            </label>
            <select
              value={adminId}
              onChange={(e) => {
                setAdminId(e.target.value);
                setPage(0);
              }}
              className="w-full px-3 py-[9px] border-[1.5px] border-[#E0E0E0] rounded-lg text-[13px] font-[Poppins,sans-serif] outline-none box-border bg-white cursor-pointer"
            >
              <option value="">Anyone</option>
              {admins.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.full_name} (
                  {a.role === "state_admin" ? "State Admin" : a.lga})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-dark mb-1.5">
              From Date
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(0);
              }}
              className="w-full px-3 py-[9px] border-[1.5px] border-[#E0E0E0] rounded-lg text-[13px] font-[Poppins,sans-serif] outline-none box-border"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-dark mb-1.5">
              To Date
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(0);
              }}
              className="w-full px-3 py-[9px] border-[1.5px] border-[#E0E0E0] rounded-lg text-[13px] font-[Poppins,sans-serif] outline-none box-border"
            />
          </div>
        </div>

        {hasFilters && (
          <div className="flex justify-between items-center mt-3 pt-3 border-t border-[#E0E0E0]">
            <span className="text-[13px] text-text-gray">
              {total.toLocaleString()} result{total !== 1 ? "s" : ""} found
            </span>
            <button
              onClick={resetFilters}
              className="px-3.5 py-[7px] bg-[#F5F5F5] border border-[#E0E0E0] rounded-[7px] text-xs cursor-pointer font-[Poppins,sans-serif] text-text-gray"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Log table */}
      <div
        className={`bg-white rounded-xl border border-[#E0E0E0] overflow-hidden mb-5 transition-opacity duration-200 ${
          isFetching ? "opacity-70" : "opacity-100"
        }`}
      >
        {isLoading ? (
          <div className="p-6">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} h={56} mb={6} />
            ))}
          </div>
        ) : isError ? (
          <div className="p-10 text-center text-[#C62828] text-sm">
            Failed to load audit log. Please refresh.
          </div>
        ) : entries.length === 0 ? (
          <div className="p-[60px] text-center text-text-gray">
            <div className="text-[36px] mb-3">📋</div>
            <div className="text-sm font-semibold">
              No entries match your filters
            </div>
          </div>
        ) : (
          <>
            <div className="px-5 py-3 bg-[#F5F5F5] border-b border-[#E0E0E0] flex justify-between text-xs text-text-gray font-semibold">
              <span>
                Showing {page * PAGE_SIZE + 1}–
                {Math.min((page + 1) * PAGE_SIZE, total)} of{" "}
                {total.toLocaleString()} entries
              </span>
              <span>
                Page {page + 1} of {totalPages}
              </span>
            </div>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-[#E0E0E0] bg-[#FAFAFA]">
                  {[
                    "Action",
                    "Table",
                    "Description",
                    "Performed By",
                    "IP Address",
                    "Timestamp",
                    "",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-3.5 py-[11px] text-left text-[11px] font-bold text-text-gray tracking-[0.8px] uppercase whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, i) => (
                  <AuditRow
                    key={entry.id}
                    entry={entry}
                    isEven={i % 2 === 0}
                    expanded={expandedId === entry.id}
                    onToggle={() =>
                      setExpandedId(expandedId === entry.id ? null : entry.id)
                    }
                  />
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mb-6">
          <PageBtn
            label="← Prev"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          />
          {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
            const p = page < 4 ? i : page - 3 + i;
            if (p >= totalPages) return null;
            return (
              <PageBtn
                key={p}
                label={p + 1}
                active={p === page}
                onClick={() => setPage(p)}
              />
            );
          })}
          <PageBtn
            label="Next →"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
          />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// AUDIT ROW (with expandable diff)
// ─────────────────────────────────────────

function AuditRow({ entry, isEven, expanded, onToggle }) {
  const cfg = ACTION_STYLE[entry.action] || {
    bg: "#F5F5F5",
    color: "#757575",
    dot: "#9E9E9E",
    label: entry.action,
  };
  const hasDiff = entry.old_values || entry.new_values;

  return (
    <>
      <tr
        className={`${isEven ? "bg-white" : "bg-[#FAFAFA]"} ${
          expanded ? "" : "border-b border-[#E0E0E0]"
        } ${hasDiff ? "cursor-pointer" : "cursor-default"}`}
        onClick={() => hasDiff && onToggle()}
      >
        {/* Action badge */}
        <td className="px-3.5 py-3 whitespace-nowrap">
          <span
            className="px-[9px] py-[3px] rounded text-[11px] font-bold inline-flex items-center gap-[5px]"
            style={{ background: cfg.bg, color: cfg.color }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full inline-block shrink-0"
              style={{ background: cfg.dot }}
            />
            {cfg.label}
          </span>
        </td>

        {/* Table */}
        <td className="px-3.5 py-3 text-xs text-text-gray font-mono whitespace-nowrap">
          {entry.table_name || "—"}
        </td>

        {/* Description */}
        <td className="px-3.5 py-3 text-[13px] text-text-dark max-w-[300px]">
          <div className="whitespace-nowrap overflow-hidden text-ellipsis">
            {entry.notes || `${entry.action} on ${entry.table_name}`}
          </div>
          {entry.record_id && (
            <div className="text-[10px] text-[#BDBDBD] font-mono mt-0.5">
              ID: {entry.record_id.substring(0, 16)}...
            </div>
          )}
        </td>

        {/* Performer */}
        <td className="px-3.5 py-3">
          {entry.performer ? (
            <div>
              <div className="text-[13px] font-semibold text-text-dark">
                {entry.performer.full_name}
              </div>
              <div className="text-[11px] text-text-gray">
                {entry.performer.role === "state_admin"
                  ? "State Admin"
                  : entry.performer.lga}
              </div>
            </div>
          ) : (
            <span className="text-[#BDBDBD] text-xs italic">System</span>
          )}
        </td>

        {/* IP */}
        <td className="px-3.5 py-3 text-xs text-text-gray font-mono whitespace-nowrap">
          {entry.ip_address || "—"}
        </td>

        {/* Timestamp */}
        <td className="px-3.5 py-3 text-xs text-text-gray whitespace-nowrap">
          {formatDateTime(entry.created_at)}
        </td>

        {/* Expand trigger */}
        <td className="px-3.5 py-3 text-center">
          {hasDiff && (
            <span
              className={`text-sm text-text-gray transition-transform duration-200 inline-block ${
                expanded ? "rotate-180" : "rotate-0"
              }`}
            >
              ▾
            </span>
          )}
        </td>
      </tr>

      {/* Diff viewer */}
      {expanded && hasDiff && (
        <tr className="bg-[#F9FBF9] border-b border-[#E0E0E0]">
          <td colSpan={7} className="px-3.5 pt-0 pb-4">
            <DiffViewer
              oldValues={entry.old_values}
              newValues={entry.new_values}
            />
          </td>
        </tr>
      )}
    </>
  );
}

// ─────────────────────────────────────────
// DIFF VIEWER — side-by-side JSON comparison
// ─────────────────────────────────────────

function DiffViewer({ oldValues, newValues }) {
  const oldKeys = oldValues ? Object.keys(oldValues) : [];
  const newKeys = newValues ? Object.keys(newValues) : [];
  const allKeys = [...new Set([...oldKeys, ...newKeys])];

  if (allKeys.length === 0) return null;

  return (
    <div className="mt-3">
      <div className="text-[11px] font-bold text-text-gray tracking-[0.8px] uppercase mb-2">
        Field Changes
      </div>
      <div className="grid grid-cols-[160px_1fr_1fr] rounded-lg overflow-hidden border border-[#E0E0E0] text-xs">
        {/* Header */}
        <div className="px-3 py-2 bg-[#EEEEEE] font-bold text-text-gray border-r border-[#E0E0E0]">
          Field
        </div>
        <div className="px-3 py-2 bg-[#FFEBEE] font-bold text-[#C62828] border-r border-[#E0E0E0]">
          Before
        </div>
        <div className="px-3 py-2 bg-[#E8F5E9] font-bold text-[#2E7D32]">
          After
        </div>

        {/* Rows */}
        {allKeys.map((key, i) => {
          const oldVal = oldValues?.[key];
          const newVal = newValues?.[key];
          const changed = JSON.stringify(oldVal) !== JSON.stringify(newVal);
          const rowBg = i % 2 === 0 ? "#FFFFFF" : "#FAFAFA";

          return [
            <div
              key={`k-${key}`}
              className={`px-3 py-2 border-t border-r border-[#E0E0E0] font-mono text-text-dark ${
                changed ? "font-bold" : "font-normal"
              }`}
              style={{ background: rowBg }}
            >
              {key}
            </div>,
            <div
              key={`o-${key}`}
              className={`px-3 py-2 border-t border-r border-[#E0E0E0] font-mono break-all ${
                changed ? "text-[#C62828]" : "text-text-gray"
              }`}
              style={{ background: changed ? "#FFF5F5" : rowBg }}
            >
              {oldVal != null ? (
                String(oldVal)
              ) : (
                <span className="text-[#BDBDBD] italic">—</span>
              )}
            </div>,
            <div
              key={`n-${key}`}
              className={`px-3 py-2 border-t border-[#E0E0E0] font-mono break-all ${
                changed ? "text-[#2E7D32]" : "text-text-gray"
              }`}
              style={{ background: changed ? "#F5FBF5" : rowBg }}
            >
              {newVal != null ? (
                String(newVal)
              ) : (
                <span className="text-[#BDBDBD] italic">—</span>
              )}
            </div>,
          ];
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// SHARED PRIMITIVES
// ─────────────────────────────────────────

function PageBtn({ label, onClick, disabled, active }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-3.5 py-2 rounded-lg text-[13px] font-[Poppins,sans-serif] min-w-10 border-[1.5px] ${
        active
          ? "bg-[#1B5E20] text-white border-[#1B5E20] font-bold cursor-pointer"
          : disabled
            ? "bg-[#F5F5F5] text-[#BDBDBD] border-[#E0E0E0] cursor-not-allowed font-normal"
            : "bg-white text-text-dark border-[#E0E0E0] cursor-pointer font-normal"
      }`}
    >
      {label}
    </button>
  );
}

function Skeleton({ h = 44, mb = 0 }) {
  return (
    <div
      className="bg-[#EEEEEE] rounded-lg"
      style={{ height: `${h}px`, marginBottom: `${mb}px` }}
    />
  );
}

function formatDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
