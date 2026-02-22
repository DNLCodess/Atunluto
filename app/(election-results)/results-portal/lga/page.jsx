/**
 * app/results-portal/lga/dashboard/page.jsx
 * LGA Admin — Personal dashboard.
 * Server component: reads session from headers, fetches own stats.
 */

import { createAdminClient } from "@/supabase/admin";
import { headers } from "next/headers";
import Link from "next/link";

const STATUS_CFG = {
  pending: {
    label: "Pending",
    bg: "bg-blue-50",
    color: "text-blue-800",
    icon: "⏳",
  },
  verified: {
    label: "Verified",
    bg: "bg-green-50",
    color: "text-green-800",
    icon: "✅",
  },
  disputed: {
    label: "Disputed",
    bg: "bg-red-50",
    color: "text-red-800",
    icon: "⚠️",
  },
};

export default async function LGADashboardPage() {
  const hdrs = await headers();
  const adminId = hdrs.get("x-erms-id") || "";
  const adminLGA = hdrs.get("x-erms-lga") || "";
  const adminName = hdrs.get("x-erms-name") || "LGA Admin";

  const supabase = createAdminClient();

  const [
    { data: activeElections },
    { data: myResults },
    { data: openReports },
    { data: myReports },
  ] = await Promise.all([
    supabase
      .from("elections")
      .select("id, title, election_type, election_date")
      .eq("status", "active"),
    supabase
      .from("election_results")
      .select(
        "id, ward, polling_unit, votes_cast, status, submitted_at, election:election_id(title)",
      )
      .eq("submitted_by", adminId)
      .is("deleted_at", null)
      .order("submitted_at", { ascending: false })
      .limit(50),
    supabase
      .from("security_reports")
      .select("id")
      .eq("reported_by", adminId)
      .eq("status", "open"),
    supabase
      .from("security_reports")
      .select("id, report_type, urgency, status, created_at")
      .eq("reported_by", adminId)
      .order("created_at", { ascending: false })
      .limit(3),
  ]);

  const results = myResults || [];
  const total = results.length;
  const pending = results.filter((r) => r.status === "pending").length;
  const verified = results.filter((r) => r.status === "verified").length;
  const disputed = results.filter((r) => r.status === "disputed").length;

  const uniquePUs = new Set(results.map((r) => `${r.ward}||${r.polling_unit}`))
    .size;

  const recentPUs = [];
  const seen = new Set();
  for (const r of results) {
    const key = `${r.ward}||${r.polling_unit}`;
    if (!seen.has(key)) {
      seen.add(key);
      recentPUs.push(r);
      if (recentPUs.length >= 5) break;
    }
  }

  const hasDisputed = disputed > 0;
  const hasActive = (activeElections || []).length > 0;

  return (
    <div className="p-8 font-[Poppins,sans-serif] text-text-dark">
      {/* Welcome header */}
      <div className="mb-7">
        <h1 className="font-[Montserrat,sans-serif] text-[26px] font-extrabold text-[#1B5E20] mb-2">
          Welcome, {adminName.split(" ")[0]}
        </h1>
        <div className="inline-flex items-center gap-1.5 bg-green-50 border border-[#C8E6C9] rounded-full px-3 py-1">
          <span className="text-xs">📍</span>
          <span className="text-[13px] font-bold text-[#1B5E20]">
            {adminLGA} LGA Admin
          </span>
        </div>
      </div>

      {/* Alert banners */}
      {hasDisputed && (
        <div className="bg-red-50 border-[1.5px] border-red-200 rounded-xl px-4 py-3.5 mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">⚠️</span>
            <div className="text-sm text-red-800">
              <strong>
                {disputed} submission{disputed > 1 ? "s" : ""} flagged as
                disputed
              </strong>{" "}
              by the State Admin.
            </div>
          </div>
          <Link
            href="/results-portal/lga/results?status=disputed"
            className="bg-red-700 text-white px-4 py-2 rounded-lg text-[13px] font-semibold no-underline shrink-0 hover:bg-red-800 transition-colors duration-150"
          >
            View →
          </Link>
        </div>
      )}

      {!hasActive && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3.5 mb-4 text-[13px] text-yellow-900">
          ℹ️ No active elections at the moment. Contact the State Admin when
          result submission opens.
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        {[
          {
            label: "Polling Units Submitted",
            value: uniquePUs,
            color: "text-[#1B5E20]",
            icon: "📋",
            href: "/results-portal/lga/results",
          },
          {
            label: "Pending Review",
            value: pending,
            color: "text-blue-800",
            icon: "⏳",
            href: "/results-portal/lga/results",
          },
          {
            label: "Verified",
            value: verified,
            color: "text-[#2E7D32]",
            icon: "✅",
            href: "/results-portal/lga/results",
          },
          {
            label: "Disputed",
            value: disputed,
            color: "text-red-700",
            icon: "⚠️",
            href: "/results-portal/lga/results",
          },
        ].map(({ label, value, color, icon, href }) => (
          <Link key={label} href={href} className="no-underline group">
            <div className="bg-white rounded-xl px-5 py-5 border border-[#E0E0E0] transition-shadow duration-200 group-hover:shadow-md">
              <div className="flex justify-between items-start">
                <div>
                  <div
                    className={`font-[Montserrat,sans-serif] text-[30px] font-extrabold ${color}`}
                  >
                    {value}
                  </div>
                  <div className="text-xs text-[#757575] font-semibold mt-1 leading-snug">
                    {label}
                  </div>
                </div>
                <span className="text-2xl">{icon}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_320px] gap-5">
        {/* Recent submissions */}
        <div className="bg-white rounded-xl border border-[#E0E0E0] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E0E0E0] flex justify-between items-center">
            <span className="font-[Montserrat,sans-serif] text-[15px] font-bold text-[#1B5E20]">
              Recent Submissions
            </span>
            <Link
              href="/results-portal/lga/results"
              className="text-xs text-[#2E7D32] font-semibold no-underline hover:underline"
            >
              View all →
            </Link>
          </div>

          {recentPUs.length === 0 ? (
            <div className="py-14 px-6 text-center">
              <div className="text-4xl mb-3">📋</div>
              <div className="text-sm font-semibold text-text-dark mb-1.5">
                No submissions yet
              </div>
              {hasActive && (
                <Link
                  href="/results-portal/lga/submit"
                  className="inline-block mt-2 px-5 py-2.5 bg-[#1B5E20] text-white rounded-lg text-[13px] font-semibold no-underline hover:bg-[#2E7D32] transition-colors duration-150"
                >
                  Submit First Result
                </Link>
              )}
            </div>
          ) : (
            <div>
              {recentPUs.map((r, i) => {
                const cfg = STATUS_CFG[r.status] || STATUS_CFG.pending;
                return (
                  <div
                    key={r.id}
                    className={`px-5 py-3.5 flex items-center gap-3.5 ${i < recentPUs.length - 1 ? "border-b border-[#E0E0E0]" : ""}`}
                  >
                    <div
                      className={`w-9 h-9 rounded-lg ${cfg.bg} flex items-center justify-center text-base shrink-0`}
                    >
                      {cfg.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-text-dark truncate">
                        {r.polling_unit}
                      </div>
                      <div className="text-xs text-[#757575] mt-0.5">
                        {r.ward} · {r.election?.title || "—"}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span
                        className={`${cfg.bg} ${cfg.color} px-2 py-0.5 rounded-full text-[11px] font-bold`}
                      >
                        {cfg.label}
                      </span>
                      <div className="text-[11px] text-[#757575] mt-1">
                        {formatDate(r.submitted_at)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          {/* Quick actions */}
          <div className="bg-white rounded-xl border border-[#E0E0E0] p-5">
            <div className="font-[Montserrat,sans-serif] text-sm font-bold text-[#1B5E20] mb-3.5">
              Quick Actions
            </div>
            <div className="flex flex-col gap-2">
              {[
                {
                  label: "📊 Submit Results",
                  href: "/results-portal/lga/submit",
                  primary: true,
                  disabled: !hasActive,
                },
                {
                  label: "📋 My Submissions",
                  href: "/results-portal/lga/results",
                  primary: false,
                  disabled: false,
                },
                {
                  label: "🚨 File Security Report",
                  href: "/results-portal/lga/report",
                  primary: false,
                  disabled: false,
                },
                {
                  label: "🔑 Change Password",
                  href: "/results-portal/lga/settings",
                  primary: false,
                  disabled: false,
                },
              ].map(({ label, href, primary, disabled }) => (
                <Link
                  key={href}
                  href={disabled ? "#" : href}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-[13px] font-semibold border-[1.5px] no-underline transition-all duration-150
                    ${
                      disabled
                        ? "bg-[#F5F5F5] text-[#BDBDBD] border-[#E0E0E0] cursor-not-allowed pointer-events-none"
                        : primary
                          ? "bg-[#1B5E20] text-white border-[#1B5E20] hover:bg-[#2E7D32] hover:border-[#2E7D32]"
                          : "bg-[#F5F5F5] text-text-dark border-[#E0E0E0] hover:bg-[#E8F5E9] hover:border-[#C8E6C9]"
                    }`}
                >
                  <span>{label}</span>
                  {disabled && (
                    <span className="text-[11px] font-normal text-[#BDBDBD]">
                      No active election
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>

          {/* Active elections */}
          <div className="bg-white rounded-xl border border-[#E0E0E0] p-5">
            <div className="font-[Montserrat,sans-serif] text-sm font-bold text-[#1B5E20] mb-3.5">
              Active Elections
            </div>
            {(activeElections || []).length === 0 ? (
              <p className="text-[13px] text-[#757575] italic">
                None at the moment
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {(activeElections || []).map((e) => (
                  <div
                    key={e.id}
                    className="bg-green-50 border border-[#C8E6C9] rounded-lg px-3 py-2.5"
                  >
                    <div className="text-[13px] font-semibold text-[#1B5E20]">
                      {e.title}
                    </div>
                    <div className="text-[11px] text-[#757575] mt-0.5">
                      {formatElectionType(e.election_type)} ·{" "}
                      {formatDate(e.election_date)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* My reports */}
          {(myReports || []).length > 0 && (
            <div className="bg-white rounded-xl border border-[#E0E0E0] p-5">
              <div className="flex justify-between items-center mb-3.5">
                <span className="font-[Montserrat,sans-serif] text-sm font-bold text-[#1B5E20]">
                  My Reports
                </span>
                {(openReports || []).length > 0 && (
                  <span className="bg-red-50 text-red-800 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                    {openReports.length} open
                  </span>
                )}
              </div>
              <div className="flex flex-col">
                {(myReports || []).map((r, i) => {
                  const statusColor =
                    {
                      open: "text-red-700",
                      investigating: "text-orange-700",
                      resolved: "text-[#2E7D32]",
                    }[r.status] || "text-[#757575]";

                  return (
                    <div
                      key={r.id}
                      className={`py-2.5 flex justify-between items-center text-xs ${i < (myReports || []).length - 1 ? "border-b border-[#E0E0E0]" : ""}`}
                    >
                      <div>
                        <div className="font-semibold text-text-dark">
                          {formatReportType(r.report_type)}
                        </div>
                        <div className="text-[#757575] mt-0.5">
                          {formatDate(r.created_at)}
                        </div>
                      </div>
                      <span className={`font-bold ${statusColor}`}>
                        {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
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
      local_government: "Local Govt",
    }[type] || type
  );
}

function formatReportType(type) {
  return (
    {
      tampering: "Tampering",
      unauthorized_access: "Unauthorised Access",
      suspicious_activity: "Suspicious Activity",
      other: "Other",
    }[type] || type
  );
}
