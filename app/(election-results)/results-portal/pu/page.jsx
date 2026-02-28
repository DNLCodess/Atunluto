/**
 * app/results-portal/pu/page.jsx
 * Polling Unit Admin Dashboard — server component
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

export default async function PUDashboard() {
  const hdrs = await headers();
  const adminId = hdrs.get("x-erms-id") || "";
  const name = hdrs.get("x-erms-name") || "Agent";
  const lga = hdrs.get("x-erms-lga") || "";
  const ward = hdrs.get("x-erms-ward") || "";
  const pu = hdrs.get("x-erms-polling-unit") || "";

  const supabase = createAdminClient();

  const [{ data: activeElections }, { data: myResults }] = await Promise.all([
    supabase
      .from("elections")
      .select("id, title, election_type, election_date")
      .eq("status", "active"),
    supabase
      .from("election_results")
      .select(
        `id, ward, polling_unit, votes_cast, status, submitted_at, election:election_id(title), candidate:candidate_id(full_name, party)`,
      )
      .eq("submitted_by", adminId)
      .is("deleted_at", null)
      .order("submitted_at", { ascending: false })
      .limit(50),
  ]);

  const results = myResults || [];
  const pending = results.filter((r) => r.status === "pending").length;
  const verified = results.filter((r) => r.status === "verified").length;
  const disputed = results.filter((r) => r.status === "disputed").length;
  const hasActive = (activeElections || []).length > 0;

  // Group results by election
  const byElection = new Map();
  for (const r of results) {
    const key = r.election?.title || "Unknown";
    if (!byElection.has(key)) byElection.set(key, []);
    byElection.get(key).push(r);
  }
  const recentElections = Array.from(byElection.entries()).slice(0, 3);

  return (
    <div className="p-8 font-[Poppins,sans-serif] text-[#212121]">
      {/* Welcome */}
      <div className="mb-7">
        <h1 className="font-[Montserrat,sans-serif] text-[26px] font-extrabold text-[#1B5E20] mb-2">
          Welcome, {name.split(" ")[0]}
        </h1>
        <div className="inline-flex items-center gap-1.5 bg-green-50 border border-[#C8E6C9] rounded-full px-3 py-1">
          <span className="text-xs">📍</span>
          <span className="text-[13px] font-bold text-[#1B5E20]">
            Polling Unit Agent
          </span>
        </div>
      </div>

      {/* Assigned PU card */}
      <div className="bg-[#1B5E20] rounded-2xl p-6 mb-7 text-white">
        <div className="text-[11px] font-bold tracking-widest uppercase text-[#A5D6A7] mb-3">
          Your Assigned Polling Unit
        </div>
        <div className="font-[Montserrat,sans-serif] text-2xl font-extrabold mb-4 leading-tight">
          {pu}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/10 rounded-xl px-3.5 py-2.5">
            <div className="text-[10px] text-[#A5D6A7] font-bold uppercase tracking-widest mb-0.5">
              Ward
            </div>
            <div className="text-sm font-semibold text-white">{ward}</div>
          </div>
          <div className="bg-white/10 rounded-xl px-3.5 py-2.5">
            <div className="text-[10px] text-[#A5D6A7] font-bold uppercase tracking-widest mb-0.5">
              LGA
            </div>
            <div className="text-sm font-semibold text-white">{lga}</div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {disputed > 0 && (
        <div className="bg-red-50 border-[1.5px] border-red-200 rounded-xl px-4 py-3.5 mb-5 flex items-center justify-between gap-3">
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
            href="/results-portal/pu/results"
            className="bg-red-700 text-white px-4 py-2 rounded-lg text-[13px] font-semibold no-underline hover:bg-red-800 transition-colors duration-150 shrink-0"
          >
            View →
          </Link>
        </div>
      )}
      {!hasActive && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3.5 mb-5 text-[13px] text-yellow-900">
          ℹ️ No active elections at the moment. Submission will open when the
          State Admin activates an election.
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-7">
        {[
          {
            label: "Total Submitted",
            value: results.length,
            color: "text-[#1B5E20]",
            icon: "📋",
            href: "/results-portal/pu/results",
          },
          {
            label: "Pending Review",
            value: pending,
            color: "text-blue-800",
            icon: "⏳",
            href: "/results-portal/pu/results",
          },
          {
            label: "Verified",
            value: verified,
            color: "text-[#2E7D32]",
            icon: "✅",
            href: "/results-portal/pu/results",
          },
          {
            label: "Disputed",
            value: disputed,
            color: "text-red-700",
            icon: "⚠️",
            href: "/results-portal/pu/results",
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

      {/* Two-column */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5">
        {/* Recent by election */}
        <div className="bg-white rounded-xl border border-[#E0E0E0] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E0E0E0] flex justify-between items-center">
            <span className="font-[Montserrat,sans-serif] text-[15px] font-bold text-[#1B5E20]">
              My Submissions
            </span>
            <Link
              href="/results-portal/pu/results"
              className="text-xs text-[#2E7D32] font-semibold no-underline hover:underline"
            >
              View all →
            </Link>
          </div>
          {recentElections.length === 0 ? (
            <div className="py-14 px-6 text-center">
              <div className="text-4xl mb-3">📋</div>
              <div className="text-sm font-semibold text-[#212121] mb-1.5">
                No submissions yet
              </div>
              {hasActive && (
                <Link
                  href="/results-portal/pu/submit"
                  className="inline-block mt-2 px-5 py-2.5 bg-[#1B5E20] text-white rounded-lg text-[13px] font-semibold no-underline hover:bg-[#2E7D32] transition-colors duration-150"
                >
                  Submit First Result
                </Link>
              )}
            </div>
          ) : (
            recentElections.map(([electionTitle, rows]) => (
              <div
                key={electionTitle}
                className="border-b border-[#E0E0E0] last:border-b-0"
              >
                <div className="px-5 py-2.5 bg-[#F5F5F5] border-b border-[#E0E0E0]">
                  <span className="text-[12px] font-bold text-[#1B5E20] uppercase tracking-wide">
                    {electionTitle}
                  </span>
                </div>
                {rows.map((r, i) => {
                  const cfg = STATUS_CFG[r.status] || STATUS_CFG.pending;
                  return (
                    <div
                      key={r.id}
                      className={`px-5 py-3 flex items-center gap-3.5 ${i < rows.length - 1 ? "border-b border-[#E0E0E0]" : ""}`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg ${cfg.bg} flex items-center justify-center text-sm shrink-0`}
                      >
                        {cfg.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-[#212121] truncate">
                          {r.candidate?.full_name}
                          <span className="ml-2 text-[11px] font-bold text-[#757575]">
                            {r.candidate?.party}
                          </span>
                        </div>
                        <div className="text-xs text-[#757575]">
                          {formatDate(r.submitted_at)}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-[Montserrat,sans-serif] text-lg font-extrabold text-[#1B5E20]">
                          {r.votes_cast.toLocaleString()}
                        </div>
                        <span
                          className={`${cfg.bg} ${cfg.color} px-2 py-0.5 rounded-full text-[11px] font-bold`}
                        >
                          {cfg.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Quick actions */}
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-xl border border-[#E0E0E0] p-5">
            <div className="font-[Montserrat,sans-serif] text-sm font-bold text-[#1B5E20] mb-3.5">
              Quick Actions
            </div>
            <div className="flex flex-col gap-2">
              {[
                {
                  label: "📊 Submit Results",
                  href: "/results-portal/pu/submit",
                  primary: true,
                  disabled: !hasActive,
                },
                {
                  label: "📋 View My Results",
                  href: "/results-portal/pu/results",
                  primary: false,
                  disabled: false,
                },
                {
                  label: "🚨 File Security Report",
                  href: "/results-portal/pu/report",
                  primary: false,
                  disabled: false,
                },
                {
                  label: "🔑 Change Password",
                  href: "/results-portal/pu/settings",
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
                          ? "bg-[#1B5E20] text-white border-[#1B5E20] hover:bg-[#2E7D32]"
                          : "bg-[#F5F5F5] text-[#212121] border-[#E0E0E0] hover:bg-[#E8F5E9] hover:border-[#C8E6C9]"
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
              (activeElections || []).map((e) => (
                <div
                  key={e.id}
                  className="bg-green-50 border border-[#C8E6C9] rounded-lg px-3 py-2.5 mb-2 last:mb-0"
                >
                  <div className="text-[13px] font-semibold text-[#1B5E20]">
                    {e.title}
                  </div>
                  <div className="text-[11px] text-[#757575] mt-0.5">
                    {formatElectionType(e.election_type)} ·{" "}
                    {formatDate(e.election_date)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

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
