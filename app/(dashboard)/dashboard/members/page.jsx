"use client";

import { useState, useMemo } from "react";
import { format, differenceInYears } from "date-fns";
import { useMembers } from "@/hooks/use-members";
import {
  useCurrentAdmin,
  useMemberCollationByLGA,
  useMemberStats,
} from "@/hooks/use-admins";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  MapPin,
  Phone,
  MessageCircle,
  Eye,
  Calendar,
  User,
  CreditCard,
  Users,
  TrendingUp,
  TrendingDown,
  BarChart2,
  List,
  Building2,
} from "lucide-react";
import * as XLSX from "xlsx";
import Link from "next/link";
import ViewMemberModal from "@/components/common/admin/view";
import EditMemberModal from "@/components/common/admin/edit";
import MembershipCardPrinter from "@/components/shared/admin/card-printer";
import { AnimatePresence, motion } from "framer-motion";

// ─── Role helpers ─────────────────────────────────────────────────────────────
const canAddMember = (role) =>
  ["state_admin", "super_user", "administrator", "registration"].includes(role);
const canEditMember = (role) =>
  ["state_admin", "super_user", "administrator"].includes(role);
const canDeleteMember = (role) => ["state_admin", "super_user"].includes(role);
const canExport = (role) =>
  ["state_admin", "super_user", "administrator"].includes(role);

// ─── Utilities ────────────────────────────────────────────────────────────────
export function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null;
  const today = new Date();
  const birth = new Date(dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function formatGender(gender) {
  if (!gender) return "N/A";
  return gender.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function doExportToExcel(members) {
  const data = members.map((m) => ({
    "Membership Number": m.membership_number,
    "Full Name": m.full_name,
    Gender: formatGender(m.gender),
    Age: m.date_of_birth ? calculateAge(m.date_of_birth) : "N/A",
    "Date of Birth": m.date_of_birth
      ? format(new Date(m.date_of_birth), "dd/MM/yyyy")
      : "N/A",
    Phone: m.phone,
    WhatsApp: m.whatsapp || "N/A",
    Messenger: m.messenger || "N/A",
    LGA: m.lga,
    Ward: m.ward,
    "Polling Unit": m.polling_unit,
    Address: m.address || "N/A",
    Registered: m.created_at
      ? format(new Date(m.created_at), "dd/MM/yyyy")
      : "N/A",
  }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), "Members");
  XLSX.writeFile(
    wb,
    `Atunluto_Members_${format(new Date(), "yyyy-MM-dd")}.xlsx`,
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function MemberCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-border-gray overflow-hidden animate-pulse">
      <div className="h-28 bg-border-gray" />
      <div className="p-6 space-y-3">
        <div className="h-3 bg-border-gray rounded w-3/4" />
        <div className="h-3 bg-border-gray rounded w-1/2" />
        <div className="h-3 bg-border-gray rounded w-2/3" />
      </div>
    </div>
  );
}

// ─── Member Card ──────────────────────────────────────────────────────────────
function MemberCard({ member, role, onView, onEdit, onDelete, onPrintCard }) {
  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all border border-border-gray overflow-hidden">
      <div className="p-6 text-white bg-gradient-to-br from-primary-green to-secondary-green">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold font-primary truncate">
              {member.full_name}
            </h3>
            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-lg">
              <CreditCard className="w-4 h-4" />
              <span className="text-sm font-mono font-semibold">
                {member.membership_number}
              </span>
            </div>
            <p className="text-white/70 text-xs mt-2">
              Registered:{" "}
              {member.created_at
                ? format(new Date(member.created_at), "dd MMM yyyy")
                : "—"}
            </p>
          </div>
          <div className="shrink-0">
            {member.profile_image_url ? (
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/30">
                <img
                  src={member.profile_image_url}
                  alt={member.full_name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            ) : (
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center font-bold text-xl font-primary">
                {member.full_name?.[0] || "?"}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {(member.date_of_birth || member.gender) && (
          <div className="flex items-center gap-4 text-sm pb-3 border-b border-border-gray">
            {member.date_of_birth && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-accent-green" />
                <span className="text-text-dark">
                  {calculateAge(member.date_of_birth)} yrs
                </span>
              </div>
            )}
            {member.gender && (
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-accent-green" />
                <span className="text-text-dark text-xs">
                  {formatGender(member.gender)}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-accent-green flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-text-dark">{member.lga} LGA</p>
              <p className="text-text-gray text-xs">
                Ward {member.ward} • {member.polling_unit}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-accent-green flex-shrink-0" />
            <span className="text-text-dark truncate">{member.phone}</span>
          </div>
          {member.whatsapp && (
            <div className="flex items-center gap-3">
              <MessageCircle className="w-5 h-5 text-accent-green flex-shrink-0" />
              <span className="text-text-dark truncate">{member.whatsapp}</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-2 pt-4 border-t border-border-gray">
          <button
            onClick={() => onPrintCard(member)}
            className="text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <CreditCard className="w-4 h-4" /> Print Card
          </button>
          <button
            onClick={() => onView(member)}
            className="text-accent-green hover:bg-light-green/30 px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Eye className="w-4 h-4" /> View
          </button>
          {canEditMember(role) && (
            <button
              onClick={() => onEdit(member)}
              className="text-accent-green hover:bg-light-green/30 px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Edit2 className="w-4 h-4" /> Edit
            </button>
          )}
          {canDeleteMember(role) && (
            <button
              onClick={() => onDelete(member)}
              className="text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Delete Modal ─────────────────────────────────────────────────────────────
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
          <h3 className="text-2xl font-bold text-text-dark font-primary">
            Delete Member?
          </h3>
          <p className="text-text-gray mt-4 leading-relaxed text-sm">
            Are you sure you want to permanently delete{" "}
            <span className="font-bold text-text-dark">{member.full_name}</span>
            ?
          </p>
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-800 font-semibold flex items-center justify-center gap-2">
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
            className="flex-1 py-3 border-2 border-border-gray rounded-xl hover:bg-off-white font-semibold text-text-gray transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </motion.button>
          <motion.button
            whileHover={{ scale: isDeleting ? 1 : 1.02 }}
            whileTap={{ scale: isDeleting ? 1 : 0.98 }}
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl font-semibold shadow-lg shadow-red-600/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
        <div className="w-6 text-center shrink-0">
          <span className="text-xs font-bold text-text-gray">{rank}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-text-dark truncate">
              {data.lga}
            </span>
            <span className="text-xs text-text-gray">
              {wards.length} ward{wards.length !== 1 ? "s" : ""}
            </span>
          </div>
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

// ─── Page ─────────────────────────────────────────────────────────────────────
const PAGE_SIZE = 10;

export default function MembersPage() {
  const { data: actor } = useCurrentAdmin();
  const { data: stats } = useMemberStats();
  const { data: collation = [], isLoading: collationLoading } =
    useMemberCollationByLGA();

  // ↓ useMembers() exposes deleteMember + isDeleting directly — no useDeleteMember export
  const {
    members = [],
    isLoading,
    deleteMember,
    isDeleting,
    deleteError,
  } = useMembers();

  const role = actor?.role;

  const [activeTab, setActiveTab] = useState("collation");
  const [search, setSearch] = useState("");
  const [lgaFilter, setLgaFilter] = useState("all");
  const [wardFilter, setWardFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [page, setPage] = useState(1);

  const [viewMember, setViewMember] = useState(null);
  const [editMember, setEditMember] = useState(null);
  const [deleteMemberTarget, setDeleteMemberTarget] = useState(null);
  const [printCardMember, setPrintCardMember] = useState(null);

  const uniqueLGAs = useMemo(
    () => [...new Set(members.map((m) => m.lga).filter(Boolean))].sort(),
    [members],
  );
  const uniqueWards = useMemo(
    () => [...new Set(members.map((m) => m.ward).filter(Boolean))].sort(),
    [members],
  );

  const filteredMembers = useMemo(() => {
    const q = search.toLowerCase();
    return members.filter((m) => {
      if (
        q &&
        !(
          m.full_name?.toLowerCase().includes(q) ||
          m.phone?.includes(q) ||
          m.membership_number?.toLowerCase().includes(q) ||
          m.polling_unit?.toLowerCase().includes(q)
        )
      )
        return false;
      if (lgaFilter !== "all" && m.lga !== lgaFilter) return false;
      if (wardFilter !== "all" && m.ward !== wardFilter) return false;
      if (genderFilter !== "all" && m.gender !== genderFilter) return false;
      return true;
    });
  }, [members, search, lgaFilter, wardFilter, genderFilter]);

  const totalPages = Math.ceil(filteredMembers.length / PAGE_SIZE);
  const paginated = useMemo(
    () => filteredMembers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredMembers, page],
  );
  const isFiltered =
    search ||
    lgaFilter !== "all" ||
    wardFilter !== "all" ||
    genderFilter !== "all";
  const collationTotal = collation.reduce((s, l) => s + l.total, 0);

  function resetFilters() {
    setSearch("");
    setLgaFilter("all");
    setWardFilter("all");
    setGenderFilter("all");
    setPage(1);
  }

  function handleDelete() {
    if (!deleteMemberTarget) return;
    deleteMember(deleteMemberTarget.id, {
      onSuccess: () => setDeleteMemberTarget(null),
    });
  }

  return (
    <div className="min-h-screen bg-off-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 pb-20">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-extrabold font-primary text-text-dark">
              Members Directory
            </h1>
            <p className="text-text-gray mt-1 text-sm">
              {role === "state_admin"
                ? "All members across Oyo South Senatorial District"
                : `Members in ${actor?.lga || "…"}`}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {canAddMember(role) && (
              <Link
                href="/dashboard/add-member"
                className="inline-flex items-center gap-2 px-5 py-3 bg-primary-green hover:bg-secondary-green text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add Member
              </Link>
            )}
            {canExport(role) && (
              <button
                onClick={() => doExportToExcel(filteredMembers)}
                disabled={isLoading || filteredMembers.length === 0}
                className="inline-flex items-center gap-2 px-5 py-3 bg-blue-700 hover:bg-blue-800 text-white font-medium rounded-xl shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-5 h-5" />
                Export Excel
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Members"
              value={stats.total}
              icon={Users}
              trend={stats.growth}
              sub={`${stats.thisMonth} this month`}
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
              accent="bg-blue-50"
              sub={
                stats.total > 0
                  ? `${Math.round((stats.male / stats.total) * 100)}% of total`
                  : ""
              }
            />
            <StatCard
              label="Female"
              value={stats.female}
              icon={User}
              accent="bg-pink-50"
              sub={
                stats.total > 0
                  ? `${Math.round((stats.female / stats.total) * 100)}% of total`
                  : ""
              }
            />
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-border-gray/40 rounded-xl w-fit">
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
          <div className="bg-white rounded-xl border border-border-gray overflow-hidden">
            <div className="px-4 py-3 border-b border-border-gray bg-off-white/50 flex items-center justify-between">
              <span className="text-xs font-semibold text-text-gray uppercase tracking-wide flex items-center gap-2">
                <Building2 size={13} />
                {collation.length} LGA{collation.length !== 1 ? "s" : ""} —{" "}
                {collationTotal.toLocaleString()} members
              </span>
              <div className="flex items-center gap-3 text-xs text-text-gray">
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
              <>
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
              </>
            )}
          </div>
        )}

        {/* ── Member List Tab ── */}
        {activeTab === "members" && (
          <>
            <div className="bg-white rounded-2xl shadow-sm border border-border-gray p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3.5 w-5 h-5 text-text-gray" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Search name, phone, membership no..."
                    className="w-full pl-10 pr-4 py-3 border border-border-gray rounded-xl focus:outline-none focus:border-accent-green focus:ring-2 focus:ring-accent-green/20 text-sm text-text-dark placeholder-text-light"
                  />
                </div>
                <select
                  value={lgaFilter}
                  onChange={(e) => {
                    setLgaFilter(e.target.value);
                    setPage(1);
                  }}
                  className="px-4 py-3 border border-border-gray rounded-xl focus:outline-none focus:border-accent-green text-sm text-text-dark bg-white"
                >
                  <option value="all">All LGAs</option>
                  {uniqueLGAs.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
                <select
                  value={wardFilter}
                  onChange={(e) => {
                    setWardFilter(e.target.value);
                    setPage(1);
                  }}
                  className="px-4 py-3 border border-border-gray rounded-xl focus:outline-none focus:border-accent-green text-sm text-text-dark bg-white"
                >
                  <option value="all">All Wards</option>
                  {uniqueWards.map((w) => (
                    <option key={w} value={w}>
                      Ward {w}
                    </option>
                  ))}
                </select>
                <select
                  value={genderFilter}
                  onChange={(e) => {
                    setGenderFilter(e.target.value);
                    setPage(1);
                  }}
                  className="px-4 py-3 border border-border-gray rounded-xl focus:outline-none focus:border-accent-green text-sm text-text-dark bg-white"
                >
                  <option value="all">All Genders</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>
            </div>

            <AnimatePresence>
              {deleteError && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="p-4 rounded-xl border border-red-300 bg-red-50 text-red-700 flex items-center gap-3 text-sm"
                >
                  <svg
                    className="w-5 h-5 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Failed to delete member: {deleteError}
                </motion.div>
              )}
            </AnimatePresence>

            {isLoading ? (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <MemberCardSkeleton key={i} />
                ))}
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-border-gray p-12 text-center">
                <div className="w-20 h-20 bg-off-white rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-10 h-10 text-border-gray" />
                </div>
                <h3 className="text-xl font-semibold text-text-dark mb-2 font-primary">
                  No Members Found
                </h3>
                <p className="text-text-gray text-sm mb-4">
                  {isFiltered
                    ? "No members match your current filters."
                    : "No members have been registered yet."}
                </p>
                {isFiltered && (
                  <button
                    onClick={resetFilters}
                    className="text-sm font-medium px-4 py-2 rounded-lg bg-light-green text-primary-green hover:bg-light-green/70 transition-colors"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {paginated.map((member) => (
                    <MemberCard
                      key={member.id}
                      member={member}
                      role={role}
                      onView={setViewMember}
                      onEdit={setEditMember}
                      onDelete={setDeleteMemberTarget}
                      onPrintCard={setPrintCardMember}
                    />
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-4">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-3 rounded-xl bg-white shadow hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-shadow"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-text-gray font-medium text-sm">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={page === totalPages}
                      className="p-3 rounded-xl bg-white shadow hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-shadow"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </>
            )}
          </>
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
