"use client";

import { useState, useMemo } from "react";
import {
  Users,
  Search,
  Filter,
  Download,
  ChevronDown,
  ChevronUp,
  MapPin,
  Calendar,
  User,
  CreditCard,
  Phone,
  Edit2,
  Trash2,
  Eye,
  TrendingUp,
  TrendingDown,
  BarChart2,
  Grid,
  List,
  SlidersHorizontal,
  X,
  Building2,
  ArrowUpDown,
} from "lucide-react";
import { format, differenceInYears } from "date-fns";
import { useMembers, useDeleteMember } from "@/hooks/useMembers";
import {
  useCurrentAdmin,
  useMemberCollationByLGA,
  useMemberStats,
} from "@/hooks/useAdmins";
import * as XLSX from "xlsx";
import Link from "next/link";
import ViewMemberModal from "@/components/common/admin/view";
import EditMemberModal from "@/components/common/admin/edit";
import MembershipCardPrinter from "@/components/shared/admin/card-printer";
import { AnimatePresence, motion } from "framer-motion";

// ─── Permissions ──────────────────────────────────────────────────────────────
const canEdit = (role) =>
  ["state_admin", "super_user", "administrator"].includes(role);
const canDelete = (role) => ["state_admin", "super_user"].includes(role);
const canExport = (role) =>
  ["state_admin", "super_user", "administrator"].includes(role);
const canViewCollation = (role) =>
  ["state_admin", "super_user", "administrator", "registration"].includes(role);

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, trend, icon: Icon, accent }) {
  return (
    <div className="bg-white rounded-xl border border-border-gray p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-text-gray font-medium uppercase tracking-wide mb-1">
            {label}
          </p>
          <p className="text-2xl font-extrabold font-primary text-text-dark">
            {value?.toLocaleString() ?? "—"}
          </p>
          {sub && <p className="text-xs text-text-gray mt-0.5">{sub}</p>}
        </div>
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${accent || "bg-light-green/40"}`}
        >
          <Icon size={17} className="text-primary-green" />
        </div>
      </div>
      {trend !== null && trend !== undefined && (
        <div
          className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend >= 0 ? "text-green-700" : "text-red-600"}`}
        >
          {trend >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
          {Math.abs(trend)}% vs last month
        </div>
      )}
    </div>
  );
}

// ─── LGA Collation Row ────────────────────────────────────────────────────────
function LGACollationRow({ data, rank }) {
  const [expanded, setExpanded] = useState(false);
  const wards = Object.entries(data.byWard || {}).sort(
    (a, b) => b[1].total - a[1].total,
  );
  const malePercent =
    data.total > 0 ? Math.round((data.male / data.total) * 100) : 0;
  const femalePercent =
    data.total > 0 ? Math.round((data.female / data.total) * 100) : 0;

  return (
    <div className="border-b border-border-gray last:border-0">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-4 px-4 py-4 hover:bg-off-white/60 transition-colors text-left"
      >
        {/* Rank */}
        <div className="w-6 text-center shrink-0">
          <span className="text-xs font-bold text-text-gray">{rank}</span>
        </div>

        {/* LGA Name */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-text-dark truncate">
              {data.lga}
            </span>
            <span className="text-xs text-text-gray">
              {wards.length} ward{wards.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Progress bar */}
          <div className="flex h-1.5 rounded-full overflow-hidden mt-2 bg-border-gray w-full max-w-xs">
            <div
              className="bg-primary-green transition-all"
              style={{ width: `${malePercent}%` }}
            />
            <div
              className="bg-accent-green transition-all"
              style={{ width: `${femalePercent}%` }}
            />
          </div>
        </div>

        {/* Counts */}
        <div className="hidden sm:flex items-center gap-4 shrink-0">
          <div className="text-right">
            <div className="text-sm font-bold text-text-dark">
              {data.total.toLocaleString()}
            </div>
            <div className="text-xs text-text-gray">total</div>
          </div>
          <div className="text-right">
            <div className="text-xs font-medium text-primary-green">
              {data.male}
            </div>
            <div className="text-xs text-text-gray">male</div>
          </div>
          <div className="text-right">
            <div className="text-xs font-medium text-accent-green">
              {data.female}
            </div>
            <div className="text-xs text-text-gray">female</div>
          </div>
        </div>

        {/* Mobile count */}
        <div className="sm:hidden shrink-0">
          <span className="text-sm font-bold text-text-dark">
            {data.total.toLocaleString()}
          </span>
        </div>

        {expanded ? (
          <ChevronUp size={15} className="text-text-gray shrink-0" />
        ) : (
          <ChevronDown size={15} className="text-text-gray shrink-0" />
        )}
      </button>

      {expanded && wards.length > 0 && (
        <div className="bg-off-white/50 border-t border-border-gray">
          <div className="px-4 py-2 border-b border-border-gray">
            <span className="text-xs font-medium text-text-gray uppercase tracking-wide">
              Ward Breakdown
            </span>
          </div>
          {wards.map(([ward, wStats]) => (
            <div
              key={ward}
              className="flex items-center gap-4 px-8 py-2.5 border-b border-border-gray/50 last:border-0"
            >
              <div className="flex-1 min-w-0">
                <span className="text-xs font-medium text-text-dark truncate">
                  {ward}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-text-gray shrink-0">
                <span className="font-semibold text-text-dark">
                  {wStats.total}
                </span>
                <span>M:{wStats.male}</span>
                <span>F:{wStats.female}</span>
              </div>
              {/* Mini bar */}
              <div className="w-16 h-1.5 rounded-full overflow-hidden bg-border-gray shrink-0">
                <div
                  className="h-full bg-accent-green rounded-full"
                  style={{
                    width:
                      data.total > 0
                        ? `${Math.round((wStats.total / data.total) * 100)}%`
                        : "0%",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Member Table Row ─────────────────────────────────────────────────────────
function MemberRow({ member, actor, onDelete, onView, onEdit }) {
  const age = member.date_of_birth
    ? differenceInYears(new Date(), new Date(member.date_of_birth))
    : null;

  return (
    <tr className="border-b border-border-gray hover:bg-off-white/40 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {member.profile_image_url ? (
            <img
              src={member.profile_image_url}
              alt=""
              className="w-8 h-8 rounded-full object-cover border border-border-gray shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-light-green/40 flex items-center justify-center shrink-0 border border-light-green">
              <User size={13} className="text-primary-green" />
            </div>
          )}
          <div className="min-w-0">
            <div className="text-sm font-medium text-text-dark truncate max-w-40">
              {member.full_name}
            </div>
            <div className="text-xs text-text-gray font-mono">
              {member.membership_number}
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 hidden md:table-cell">
        <span className="text-xs text-text-gray">
          {member.gender?.replace(/_/g, " ") || "—"}
          {age && `, ${age}y`}
        </span>
      </td>
      <td className="px-4 py-3 hidden sm:table-cell">
        <div className="text-xs text-text-gray">
          <div className="font-medium text-text-dark">{member.lga}</div>
          <div>{member.ward}</div>
        </div>
      </td>
      <td className="px-4 py-3 hidden lg:table-cell">
        <span className="text-xs text-text-gray">{member.polling_unit}</span>
      </td>
      <td className="px-4 py-3 hidden lg:table-cell">
        <span className="text-xs text-text-gray">
          {member.created_at
            ? format(new Date(member.created_at), "dd MMM yyyy")
            : "—"}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 justify-end">
          <button
            onClick={() => onView(member)}
            className="p-1.5 rounded-lg hover:bg-border-gray transition-colors"
            title="View"
          >
            <Eye size={14} className="text-text-gray" />
          </button>
          {canEdit(actor?.role) && (
            <button
              onClick={() => onEdit(member)}
              className="p-1.5 rounded-lg hover:bg-border-gray transition-colors"
              title="Edit"
            >
              <Edit2 size={14} className="text-text-gray" />
            </button>
          )}
          {canDelete(actor?.role) && (
            <button
              onClick={() => onDelete(member)}
              className="p-1.5 rounded-lg hover:bg-red-50 transition-colors group"
              title="Delete"
            >
              <Trash2
                size={14}
                className="text-text-gray group-hover:text-red-500 transition-colors"
              />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
function DeleteModal({ member, isDeleting, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-gradient-to-br from-red-900/40 via-gray-900/60 to-red-900/40 backdrop-blur-md"
        onClick={() => !isDeleting && onCancel()}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full p-8"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              delay: 0.1,
              type: "spring",
              stiffness: 200,
              damping: 15,
            }}
            className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-100"
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <Trash2 className="w-10 h-10 text-red-600" />
            </motion.div>
          </motion.div>

          <h3 className="text-2xl font-bold text-gray-900 font-montserrat">
            Delete Member?
          </h3>
          <p className="text-gray-600 mt-4 leading-relaxed font-poppins text-sm">
            Are you sure you want to permanently delete{" "}
            <span className="font-bold text-gray-900">{member.full_name}</span>?
          </p>
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-800 font-semibold font-poppins flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              This action cannot be undone
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <motion.button
            whileHover={{ scale: isDeleting ? 1 : 1.02 }}
            whileTap={{ scale: isDeleting ? 1 : 0.98 }}
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-semibold font-poppins text-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </motion.button>
          <motion.button
            whileHover={{ scale: isDeleting ? 1 : 1.02 }}
            whileTap={{ scale: isDeleting ? 1 : 0.98 }}
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl font-semibold font-poppins shadow-lg shadow-red-600/30 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Permanently"
            )}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MembersPage() {
  const { data: actor } = useCurrentAdmin();
  const { data: stats } = useMemberStats();
  const { data: collation = [], isLoading: collationLoading } =
    useMemberCollationByLGA();

  const [activeTab, setActiveTab] = useState("collation"); // "collation" | "members"
  const [filters, setFilters] = useState({
    search: "",
    lga: "",
    ward: "",
    gender: "",
    page: 1,
  });
  const PAGE_SIZE = 25;

  const { data: membersData, isLoading: membersLoading } = useMembers({
    ...filters,
    limit: PAGE_SIZE,
    offset: (filters.page - 1) * PAGE_SIZE,
  });
  const deleteMember = useDeleteMember();

  const [viewMember, setViewMember] = useState(null);
  const [editMember, setEditMember] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  function exportToExcel() {
    const rows = (membersData?.data || []).map((m) => ({
      "Membership No.": m.membership_number,
      "Full Name": m.full_name,
      Gender: m.gender?.replace(/_/g, " "),
      DOB: m.date_of_birth,
      Age: m.date_of_birth
        ? differenceInYears(new Date(), new Date(m.date_of_birth))
        : "",
      Phone: m.phone,
      WhatsApp: m.whatsapp,
      LGA: m.lga,
      Ward: m.ward,
      "Polling Unit": m.polling_unit,
      Address: m.address,
      "Registered On": m.created_at
        ? format(new Date(m.created_at), "dd/MM/yyyy")
        : "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Members");
    XLSX.writeFile(
      wb,
      `atunluto-members-${format(new Date(), "yyyy-MM-dd")}.xlsx`,
    );
  }

  const totalMembers = stats?.total || 0;
  const collationTotal = collation.reduce((s, l) => s + l.total, 0);

  return (
    <div className="min-h-screen bg-off-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-extrabold font-primary text-text-dark">
              Members
            </h1>
            <p className="text-sm text-text-gray mt-1">
              {actor?.role === "state_admin"
                ? "All members across Oyo South Senatorial District"
                : `Members in ${actor?.lga}`}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {canExport(actor?.role) && (
              <button
                onClick={exportToExcel}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-border-gray bg-white text-sm font-medium text-text-gray hover:bg-off-white transition-colors"
              >
                <Download size={15} />
                <span className="hidden sm:inline">Export</span>
              </button>
            )}
            {[
              "state_admin",
              "super_user",
              "administrator",
              "registration",
            ].includes(actor?.role) && (
              <Link
                href="/dashboard/add-member"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-green text-white text-sm font-medium hover:bg-secondary-green transition-colors shadow-sm"
              >
                <User size={15} />
                <span className="hidden sm:inline">Register Member</span>
                <span className="sm:hidden">Add</span>
              </Link>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              label="Total Members"
              value={stats.total}
              icon={Users}
              trend={stats.growth}
              sub={`${stats.thisMonth} registered this month`}
            />
            <StatCard
              label="This Month"
              value={stats.thisMonth}
              icon={Calendar}
              sub={`${stats.lastMonth} last month`}
            />
            <StatCard
              label="Male"
              value={stats.male}
              icon={User}
              sub={
                stats.total > 0
                  ? `${Math.round((stats.male / stats.total) * 100)}% of total`
                  : ""
              }
              accent="bg-blue-50"
            />
            <StatCard
              label="Female"
              value={stats.female}
              icon={User}
              sub={
                stats.total > 0
                  ? `${Math.round((stats.female / stats.total) * 100)}% of total`
                  : ""
              }
              accent="bg-pink-50"
            />
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-border-gray/40 rounded-xl mb-6 w-fit">
          {[
            { key: "collation", label: "LGA Collation", icon: BarChart2 },
            { key: "members", label: "Member List", icon: List },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === key
                  ? "bg-white text-text-dark shadow-sm"
                  : "text-text-gray hover:text-text-dark"
              }`}
            >
              <Icon size={15} />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* ── Collation Tab ── */}
        {activeTab === "collation" && (
          <div>
            <div className="bg-white rounded-xl border border-border-gray overflow-hidden">
              {/* Table Header */}
              <div className="px-4 py-3 border-b border-border-gray bg-off-white/50 flex items-center justify-between">
                <span className="text-xs font-semibold text-text-gray uppercase tracking-wide flex items-center gap-2">
                  <Building2 size={13} />
                  {collation.length} LGA{collation.length !== 1 ? "s" : ""} —{" "}
                  {collationTotal.toLocaleString()} total members
                </span>
                <div className="flex items-center gap-2 text-xs text-text-gray">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-primary-green inline-block" />{" "}
                    Male
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-accent-green inline-block" />{" "}
                    Female
                  </span>
                </div>
              </div>

              {collationLoading ? (
                <div className="p-8 text-center">
                  <div className="w-8 h-8 border-2 border-accent-green border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : collation.length === 0 ? (
                <div className="p-16 text-center text-sm text-text-gray">
                  No member data available yet.
                </div>
              ) : (
                <div>
                  {/* Column headers */}
                  <div className="hidden sm:flex items-center gap-4 px-4 py-2 bg-off-white/30 border-b border-border-gray text-xs font-medium text-text-gray uppercase tracking-wide">
                    <div className="w-6">#</div>
                    <div className="flex-1">LGA</div>
                    <div className="w-20 text-right">Total</div>
                    <div className="w-16 text-right">Male</div>
                    <div className="w-16 text-right">Female</div>
                    <div className="w-4" />
                  </div>
                  {collation.map((lgaData, i) => (
                    <LGACollationRow
                      key={lgaData.lga}
                      data={lgaData}
                      rank={i + 1}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Member List Tab ── */}
        {activeTab === "members" && (
          <div>
            {/* Filters bar */}
            <div className="bg-white rounded-xl border border-border-gray p-4 mb-4 flex flex-wrap gap-3">
              <div className="flex-1 min-w-44 flex items-center gap-2 px-3 py-2 rounded-lg border border-border-gray bg-off-white">
                <Search size={14} className="text-text-gray shrink-0" />
                <input
                  type="text"
                  placeholder="Search name or membership no..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters((f) => ({
                      ...f,
                      search: e.target.value,
                      page: 1,
                    }))
                  }
                  className="flex-1 bg-transparent text-sm text-text-dark placeholder-text-light outline-none"
                />
                {filters.search && (
                  <button
                    onClick={() =>
                      setFilters((f) => ({ ...f, search: "", page: 1 }))
                    }
                  >
                    <X size={13} className="text-text-gray" />
                  </button>
                )}
              </div>

              {actor?.role === "state_admin" && (
                <select
                  value={filters.lga}
                  onChange={(e) =>
                    setFilters((f) => ({
                      ...f,
                      lga: e.target.value,
                      ward: "",
                      page: 1,
                    }))
                  }
                  className="px-3 py-2 rounded-lg border border-border-gray bg-white text-sm text-text-dark focus:outline-none focus:border-accent-green min-w-40"
                >
                  <option value="">All LGAs</option>
                  {collation.map((l) => (
                    <option key={l.lga} value={l.lga}>
                      {l.lga}
                    </option>
                  ))}
                </select>
              )}

              <select
                value={filters.gender}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, gender: e.target.value, page: 1 }))
                }
                className="px-3 py-2 rounded-lg border border-border-gray bg-white text-sm text-text-dark focus:outline-none focus:border-accent-green"
              >
                <option value="">All Genders</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="prefer_not_to_say">Not specified</option>
              </select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-border-gray overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border-gray bg-off-white/50">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-text-gray uppercase tracking-wide">
                        Member
                      </th>
                      <th className="hidden md:table-cell text-left px-4 py-3 text-xs font-semibold text-text-gray uppercase tracking-wide">
                        Gender / Age
                      </th>
                      <th className="hidden sm:table-cell text-left px-4 py-3 text-xs font-semibold text-text-gray uppercase tracking-wide">
                        LGA / Ward
                      </th>
                      <th className="hidden lg:table-cell text-left px-4 py-3 text-xs font-semibold text-text-gray uppercase tracking-wide">
                        Polling Unit
                      </th>
                      <th className="hidden lg:table-cell text-left px-4 py-3 text-xs font-semibold text-text-gray uppercase tracking-wide">
                        Registered
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-text-gray uppercase tracking-wide">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {membersLoading ? (
                      <tr>
                        <td colSpan={6} className="py-16 text-center">
                          <div className="w-8 h-8 border-2 border-accent-green border-t-transparent rounded-full animate-spin mx-auto" />
                        </td>
                      </tr>
                    ) : (membersData?.data || []).length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-16 text-center text-sm text-text-gray"
                        >
                          No members found.
                        </td>
                      </tr>
                    ) : (
                      (membersData?.data || []).map((m) => (
                        <MemberRow
                          key={m.id}
                          member={m}
                          actor={actor}
                          onView={setViewMember}
                          onEdit={setEditMember}
                          onDelete={setDeleteTarget}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {membersData?.count > PAGE_SIZE && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-border-gray bg-off-white/30">
                  <span className="text-xs text-text-gray">
                    Showing {(filters.page - 1) * PAGE_SIZE + 1}–
                    {Math.min(filters.page * PAGE_SIZE, membersData.count)} of{" "}
                    {membersData.count.toLocaleString()}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={filters.page === 1}
                      onClick={() =>
                        setFilters((f) => ({ ...f, page: f.page - 1 }))
                      }
                      className="px-3 py-1.5 rounded-lg border border-border-gray text-xs font-medium text-text-gray hover:bg-border-gray transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Prev
                    </button>
                    <span className="text-xs text-text-gray">
                      Page {filters.page}
                    </span>
                    <button
                      disabled={filters.page * PAGE_SIZE >= membersData.count}
                      onClick={() =>
                        setFilters((f) => ({ ...f, page: f.page + 1 }))
                      }
                      className="px-3 py-1.5 rounded-lg border border-border-gray text-xs font-medium text-text-gray hover:bg-border-gray transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {viewMember && (
        <ViewMemberModal
          member={viewMember}
          onClose={() => setViewMember(null)}
        />
      )}
      {editMember && (
        <EditMemberModal
          member={editMember}
          onClose={() => setEditMember(null)}
        />
      )}
      {printCardMember && (
        <MembershipCardPrinter
          member={printCardMember}
          onClose={() => setPrintCardMember(null)}
        />
      )}

      <AnimatePresence>
        {deleteMemberTarget && (
          <DeleteModal
            member={deleteMemberTarget}
            isDeleting={isDeleting}
            onConfirm={handleDelete}
            onCancel={() => !isDeleting && setDeleteMemberTarget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
