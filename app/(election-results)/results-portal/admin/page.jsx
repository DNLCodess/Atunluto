/**
 * app/results-portal/admin/page.jsx
 * State Admin overview dashboard — server component.
 */

import { createAdminClient } from "@/supabase/admin";

import Link from "next/link";

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

export default async function StateAdminDashboard() {
  const supabase = createAdminClient();

  // Parallel data fetch
  const [
    { count: totalAdmins },
    { count: activeAdmins },
    { count: totalResults },
    { count: pendingResults },
    { count: disputedResults },
    { count: openReports },
    { data: criticalReports },
    { data: recentActivity },
    { data: activeElections },
  ] = await Promise.all([
    supabase
      .from("election_admins")
      .select("*", { count: "exact", head: true })
      .eq("role", "lga_admin"),
    supabase
      .from("election_admins")
      .select("*", { count: "exact", head: true })
      .eq("role", "lga_admin")
      .eq("is_active", true),
    supabase
      .from("election_results")
      .select("*", { count: "exact", head: true })
      .is("deleted_at", null),
    supabase
      .from("election_results")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending")
      .is("deleted_at", null),
    supabase
      .from("election_results")
      .select("*", { count: "exact", head: true })
      .eq("status", "disputed")
      .is("deleted_at", null),
    supabase
      .from("security_reports")
      .select("*", { count: "exact", head: true })
      .eq("status", "open"),
    supabase
      .from("security_reports")
      .select("id")
      .in("urgency", ["high", "critical"])
      .eq("status", "open"),
    supabase
      .from("result_audit_log")
      .select("action, table_name, notes, created_at, performed_by(full_name)")
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("elections")
      .select("id, title, election_type, election_date")
      .eq("status", "active"),
  ]);

  // Per-LGA submission counts
  const { data: lgaStats } = await supabase
    .from("election_results")
    .select("lga, status")
    .is("deleted_at", null);

  const lgaMap = {};
  VALID_LGAS.forEach((l) => {
    lgaMap[l] = { total: 0, pending: 0, verified: 0, disputed: 0 };
  });
  (lgaStats || []).forEach(({ lga, status }) => {
    if (lgaMap[lga]) {
      lgaMap[lga].total++;
      lgaMap[lga][status]++;
    }
  });

  const hasCritical = (criticalReports || []).length > 0;

  return (
    <div className="font-sans text-gray-900 p-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="font-montserrat text-2xl font-extrabold text-green-900 mb-1.5">
          State Admin Dashboard
        </h1>
        <p className="text-gray-500 text-sm m-0">
          Oyo South Senatorial District — Election Results Overview
        </p>
      </div>

      {/* Critical alert banner */}
      {hasCritical && (
        <div className="bg-red-50 border border-red-300 rounded-lg py-3.5 px-5 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-sm text-red-800">
            <span className="text-xl">🚨</span>
            <strong>
              {criticalReports.length} high-priority security report
              {criticalReports.length > 1 ? "s" : ""} require your attention.
            </strong>
          </div>
          <Link
            href="/results-portal/admin/reports"
            className="bg-red-800 text-white py-2 px-4 rounded-lg text-xs font-semibold no-underline"
          >
            View Reports
          </Link>
        </div>
      )}

      {/* Key metrics */}
      <div className="grid grid-cols-4 gap-4 mb-7">
        {[
          {
            label: "Total Results",
            value: totalResults ?? 0,
            icon: "📊",
            colorClass: "text-green-900",
            href: "/results-portal/admin/results",
          },
          {
            label: "Pending Review",
            value: pendingResults ?? 0,
            icon: "⏳",
            colorClass: "text-orange-700",
            href: "/results-portal/admin/results?status=pending",
          },
          {
            label: "Disputed",
            value: disputedResults ?? 0,
            icon: "⚠️",
            colorClass: "text-red-800",
            href: "/results-portal/admin/results?status=disputed",
          },
          {
            label: "Open Reports",
            value: openReports ?? 0,
            icon: "🚨",
            colorClass: "text-purple-800",
            href: "/results-portal/admin/reports",
          },
        ].map(({ label, value, icon, colorClass, href }) => (
          <Link key={label} href={href} className="no-underline">
            <div className="bg-white rounded-xl py-5 px-6 border border-gray-200 transition-shadow duration-200 cursor-pointer hover:shadow-md">
              <div className="flex justify-between items-start">
                <div>
                  <div
                    className={`text-3xl font-extrabold font-montserrat ${colorClass}`}
                  >
                    {value}
                  </div>
                  <div className="text-xs text-gray-500 font-semibold mt-1">
                    {label}
                  </div>
                </div>
                <span className="text-2xl">{icon}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Active elections + LGA breakdown */}
      <div className="grid grid-cols-2 gap-5 mb-6">
        {/* Active elections */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-montserrat text-sm font-bold text-green-900 m-0">
              Active Elections
            </h2>
            <Link
              href="/results-portal/admin/elections"
              className="text-xs text-green-800 no-underline font-semibold"
            >
              Manage →
            </Link>
          </div>
          {(activeElections || []).length === 0 ? (
            <div className="text-center py-6 text-gray-500 text-sm">
              <div className="text-3xl mb-2">🗳️</div>
              No active elections.{" "}
              <Link
                href="/results-portal/admin/elections"
                className="text-green-800"
              >
                Create one
              </Link>
              .
            </div>
          ) : (
            (activeElections || []).map((e) => (
              <div
                key={e.id}
                className="py-3 px-3.5 bg-green-50 rounded-lg mb-2 border border-green-200"
              >
                <div className="text-sm font-semibold text-green-900">
                  {e.title}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {formatElectionType(e.election_type)} ·{" "}
                  {formatDate(e.election_date)}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Admin accounts summary */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-montserrat text-sm font-bold text-green-900 m-0">
              LGA Admins
            </h2>
            <Link
              href="/results-portal/admin/admins"
              className="text-xs text-green-800 no-underline font-semibold"
            >
              Manage →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                label: "Total",
                value: totalAdmins ?? 0,
                colorClass: "text-green-900",
              },
              {
                label: "Active",
                value: activeAdmins ?? 0,
                colorClass: "text-green-800",
              },
              {
                label: "LGAs Covered",
                value: activeAdmins ?? 0,
                colorClass: "text-green-500",
              },
              {
                label: "LGAs Missing",
                value: VALID_LGAS.length - (activeAdmins ?? 0),
                colorClass: "text-red-800",
              },
            ].map(({ label, value, colorClass }) => (
              <div
                key={label}
                className="bg-gray-100 rounded-lg p-3.5 text-center"
              >
                <div
                  className={`text-2xl font-bold font-montserrat ${colorClass}`}
                >
                  {value}
                </div>
                <div className="text-xs text-gray-500 font-semibold mt-0.5">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* LGA breakdown cards */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-montserrat text-sm font-bold text-green-900 m-0">
            Results by LGA
          </h2>
          <Link
            href="/results-portal/admin/results"
            className="text-xs text-green-800 no-underline font-semibold"
          >
            Full collation →
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {VALID_LGAS.map((lga) => {
            const stats = lgaMap[lga];
            const pct =
              stats.total > 0
                ? Math.round((stats.verified / stats.total) * 100)
                : 0;
            return <LGACard key={lga} lga={lga} stats={stats} pct={pct} />;
          })}
        </div>
      </div>

      {/* Recent audit activity */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-montserrat text-sm font-bold text-green-900 m-0">
            Recent Activity
          </h2>
          <Link
            href="/results-portal/admin/audit"
            className="text-xs text-green-800 no-underline font-semibold"
          >
            Full audit log →
          </Link>
        </div>
        {(recentActivity || []).length === 0 ? (
          <div className="text-center py-5 text-gray-500 text-sm">
            No activity yet.
          </div>
        ) : (
          (recentActivity || []).map((log, i) => <AuditRow key={i} log={log} />)
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────

function LGACard({ lga, stats, pct }) {
  const hasData = stats.total > 0;
  return (
    <div
      className={`border border-gray-200 rounded-lg py-3.5 px-4 border-l-4 ${
        hasData ? "border-l-green-500" : "border-l-gray-200"
      }`}
    >
      <div className="text-sm font-bold text-green-900 mb-2">{lga}</div>
      <div className="flex gap-2 flex-wrap mb-2">
        <MiniStat label="Total" value={stats.total} />
        <MiniStat
          label="Verified"
          value={stats.verified}
          colorClass="text-green-800"
        />
        {stats.pending > 0 && (
          <MiniStat
            label="Pending"
            value={stats.pending}
            colorClass="text-orange-700"
          />
        )}
        {stats.disputed > 0 && (
          <MiniStat
            label="Disputed"
            value={stats.disputed}
            colorClass="text-red-800"
          />
        )}
      </div>
      {hasData && (
        <div>
          <div className="h-1 bg-gray-200 rounded-sm overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-0.5">{pct}% verified</div>
        </div>
      )}
      {!hasData && (
        <div className="text-xs text-gray-400 italic">No submissions yet</div>
      )}
    </div>
  );
}

function MiniStat({ label, value, colorClass = "text-gray-500" }) {
  return (
    <div className="text-xs">
      <span className={`font-bold ${colorClass}`}>{value}</span>
      <span className="text-gray-500 ml-0.5">{label}</span>
    </div>
  );
}

const ACTION_COLORS = {
  INSERT: { className: "bg-green-100 text-green-800", label: "INSERT" },
  UPDATE: { className: "bg-amber-50 text-amber-900", label: "UPDATE" },
  DELETE: { className: "bg-red-50 text-red-800", label: "DELETE" },
  LOGIN_SUCCESS: { className: "bg-blue-50 text-blue-900", label: "LOGIN" },
  LOGIN_FAILED: { className: "bg-red-50 text-red-800", label: "FAILED" },
  PASSWORD_CHANGE: {
    className: "bg-purple-50 text-purple-800",
    label: "PWD CHG",
  },
  PASSWORD_REGENERATE: {
    className: "bg-orange-50 text-orange-800",
    label: "PWD REGEN",
  },
  ACCOUNT_ACTIVATED: {
    className: "bg-green-100 text-green-800",
    label: "ACTIVATED",
  },
  ACCOUNT_DEACTIVATED: {
    className: "bg-gray-100 text-gray-600",
    label: "DEACTIVATED",
  },
};

function AuditRow({ log }) {
  const actionStyle = ACTION_COLORS[log.action] || {
    className: "bg-gray-100 text-gray-500",
    label: log.action,
  };
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-200">
      <span
        className={`py-0.5 px-2 rounded text-xs font-bold min-w-16 text-center ${actionStyle.className}`}
      >
        {actionStyle.label}
      </span>
      <div className="flex-1 text-sm text-gray-900">
        {log.notes || `${log.action} on ${log.table_name}`}
        {log.performed_by?.full_name && (
          <span className="text-gray-500"> · {log.performed_by.full_name}</span>
        )}
      </div>
      <div className="text-xs text-gray-500 whitespace-nowrap">
        {formatDate(log.created_at)}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatElectionType(type) {
  return (
    {
      senatorial: "Senatorial",
      house_of_reps: "House of Reps",
      governorship: "Governorship",
      local_government: "Local Government",
    }[type] || type
  );
}
