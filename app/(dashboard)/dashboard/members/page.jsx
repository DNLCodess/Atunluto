// app/dashboard/members/page.jsx
"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { useMembers } from "@/hooks/use-members";
import { useAuth } from "@/hooks/useAuth";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Download,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Phone,
  MessageCircle,
  Eye,
  Calendar,
  User,
  CreditCard,
} from "lucide-react";
import * as XLSX from "xlsx";
import Link from "next/link";
import ViewMemberModal from "@/components/common/admin/view";
import EditMemberModal from "@/components/common/admin/edit";
import MembershipCardPrinter from "@/components/shared/admin/card-printer";
import { AnimatePresence, motion } from "framer-motion";

// ─── Role helpers ─────────────────────────────────────────────────────────────
// Centralised so role string changes only need updating here
const canAddMember = (role) =>
  ["super_user", "administrator", "registration"].includes(role);
const canEditMember = (role) => ["super_user", "administrator"].includes(role);
const canDeleteMember = (role) => role === "super_user";

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

function exportToExcel(members) {
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
    Registered: format(new Date(m.created_at), "dd/MM/yyyy"),
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), "Members");
  XLSX.writeFile(
    wb,
    `Atunluto_Members_${format(new Date(), "yyyy-MM-dd")}.xlsx`,
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MemberCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
      <div className="h-28 bg-gray-200" />
      <div className="p-6 space-y-3">
        <div className="h-3 bg-gray-100 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="h-3 bg-gray-100 rounded w-2/3" />
        <div className="flex justify-end gap-2 pt-2">
          <div className="h-8 w-20 bg-gray-100 rounded-lg" />
          <div className="h-8 w-16 bg-gray-100 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

function MemberCard({ member, role, onView, onEdit, onDelete, onPrintCard }) {
  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all border border-gray-100 overflow-hidden">
      {/* Card Header */}
      <div
        className="p-6 text-white"
        style={{ background: "linear-gradient(135deg, #1B5E20, #2E7D32)" }}
      >
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold font-montserrat truncate">
              {member.full_name}
            </h3>
            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-lg">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
                />
              </svg>
              <span className="text-sm font-mono font-semibold">
                {member.membership_number}
              </span>
            </div>
            <p className="text-green-100 text-xs mt-2">
              Registered: {format(new Date(member.created_at), "dd MMM yyyy")}
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
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center font-bold text-xl font-montserrat">
                {member.full_name[0]}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-6 space-y-4">
        {(member.date_of_birth || member.gender) && (
          <div className="flex items-center gap-4 text-sm pb-3 border-b border-gray-100">
            {member.date_of_birth && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-green-600" />
                <span className="text-gray-700">
                  {calculateAge(member.date_of_birth)} yrs
                </span>
              </div>
            )}
            {member.gender && (
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-green-600" />
                <span className="text-gray-700 capitalize font-poppins text-xs">
                  {formatGender(member.gender)}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="space-y-3 text-sm font-poppins">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-medium">{member.lga} LGA</p>
              <p className="text-gray-500 text-xs">
                Ward {member.ward} • {member.polling_unit}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-green-600 flex-shrink-0" />
            <span className="truncate">{member.phone}</span>
          </div>
          {member.whatsapp && (
            <div className="flex items-center gap-3">
              <MessageCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <span className="truncate">{member.whatsapp}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap justify-end gap-2 pt-4 border-t border-gray-100">
          <button
            onClick={() => onPrintCard(member)}
            className="text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg text-xs font-medium font-poppins flex items-center gap-1.5 transition"
          >
            <CreditCard className="w-4 h-4" /> Print Card
          </button>
          <button
            onClick={() => onView(member)}
            className="text-green-600 hover:bg-green-50 px-3 py-2 rounded-lg text-xs font-medium font-poppins flex items-center gap-1.5 transition"
          >
            <Eye className="w-4 h-4" /> View
          </button>
          {canEditMember(role) && (
            <button
              onClick={() => onEdit(member)}
              className="text-green-600 hover:bg-green-50 px-3 py-2 rounded-lg text-xs font-medium font-poppins flex items-center gap-1.5 transition"
            >
              <Edit2 className="w-4 h-4" /> Edit
            </button>
          )}
          {canDeleteMember(role) && (
            <button
              onClick={() => onDelete(member)}
              className="text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg text-xs font-medium font-poppins flex items-center gap-1.5 transition"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          )}
        </div>
      </div>
    </div>
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

// ─── Page ─────────────────────────────────────────────────────────────────────
const PAGE_SIZE = 10;

export default function MembersPage() {
  const { role } = useAuth();
  const { members, isLoading, deleteMember, isDeleting, deleteError } =
    useMembers();

  const [search, setSearch] = useState("");
  const [lgaFilter, setLgaFilter] = useState("all");
  const [wardFilter, setWardFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [page, setPage] = useState(1);

  const [viewMember, setViewMember] = useState(null);
  const [editMember, setEditMember] = useState(null);
  const [deleteMemberTarget, setDeleteMemberTarget] = useState(null);
  const [printCardMember, setPrintCardMember] = useState(null);

  const uniqueLGAs = useMemo(() => {
    if (!members.length) return [];
    return [...new Set(members.map((m) => m.lga).filter(Boolean))].sort();
  }, [members]);

  const uniqueWards = useMemo(() => {
    if (!members.length) return [];
    return [...new Set(members.map((m) => m.ward).filter(Boolean))].sort();
  }, [members]);

  const filteredMembers = useMemo(() => {
    const q = search.toLowerCase();
    return members.filter((m) => {
      if (
        q &&
        !(
          m.full_name?.toLowerCase().includes(q) ||
          m.phone?.includes(q) ||
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

  const resetFilters = () => {
    setSearch("");
    setLgaFilter("all");
    setWardFilter("all");
    setGenderFilter("all");
    setPage(1);
  };

  const handleDelete = () => {
    if (!deleteMemberTarget) return;
    deleteMember(deleteMemberTarget.id, {
      onSuccess: () => setDeleteMemberTarget(null),
    });
  };

  const isFiltered =
    search ||
    lgaFilter !== "all" ||
    wardFilter !== "all" ||
    genderFilter !== "all";

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 font-montserrat">
            Members Directory
          </h1>
          <p className="text-gray-500 mt-1 font-poppins text-sm">
            {isLoading ? (
              <span className="inline-block h-4 w-32 bg-gray-200 rounded animate-pulse" />
            ) : (
              <>
                Showing <strong>{filteredMembers.length}</strong> of{" "}
                <strong>{members.length}</strong> members
              </>
            )}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {canAddMember(role) && (
            <Link
              href="/dashboard/add-member"
              className="inline-flex items-center gap-2 px-5 py-3 text-white font-medium font-poppins rounded-xl shadow-md hover:shadow-lg transition"
              style={{ backgroundColor: "#1B5E20" }}
            >
              <Plus className="w-5 h-5" />
              Add Member
            </Link>
          )}
          <button
            onClick={() => exportToExcel(filteredMembers)}
            disabled={isLoading || filteredMembers.length === 0}
            className="inline-flex items-center gap-2 px-5 py-3 bg-blue-700 hover:bg-blue-800 text-white font-medium font-poppins rounded-xl shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-5 h-5" />
            Export Excel
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search name, phone, polling unit..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent outline-none font-poppins text-sm"
              style={{ "--tw-ring-color": "#1B5E20" }}
            />
          </div>
          {[
            {
              value: lgaFilter,
              onChange: (v) => {
                setLgaFilter(v);
                setPage(1);
              },
              placeholder: "All LGAs",
              options: uniqueLGAs.map((l) => ({ value: l, label: l })),
            },
            {
              value: wardFilter,
              onChange: (v) => {
                setWardFilter(v);
                setPage(1);
              },
              placeholder: "All Wards",
              options: uniqueWards.map((w) => ({
                value: w,
                label: `Ward ${w}`,
              })),
            },
            {
              value: genderFilter,
              onChange: (v) => {
                setGenderFilter(v);
                setPage(1);
              },
              placeholder: "All Genders",
              options: [
                { value: "male", label: "Male" },
                { value: "female", label: "Female" },
                { value: "prefer_not_to_say", label: "Prefer not to say" },
              ],
            },
          ].map(({ value, onChange, placeholder, options }) => (
            <select
              key={placeholder}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 outline-none font-poppins text-sm text-gray-700"
            >
              <option value="all">{placeholder}</option>
              {options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ))}
        </div>
      </div>

      {/* Delete error toast */}
      <AnimatePresence>
        {deleteError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-4 rounded-xl border flex items-center gap-3 font-poppins text-sm"
            style={{
              backgroundColor: "#FFEBEE",
              borderColor: "#e53935",
              color: "#c62828",
            }}
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

      {/* Loading skeletons */}
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <MemberCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2 font-montserrat">
            No Members Found
          </h3>
          <p className="text-gray-500 font-poppins text-sm mb-4">
            {isFiltered
              ? "No members match your current filters."
              : "No members have been registered yet."}
          </p>
          {isFiltered && (
            <button
              onClick={resetFilters}
              className="text-sm font-poppins font-medium px-4 py-2 rounded-lg transition"
              style={{ color: "#1B5E20", backgroundColor: "#E8F5E9" }}
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
                className="p-3 rounded-xl bg-white shadow hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-gray-700 font-medium font-poppins text-sm">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-3 rounded-xl bg-white shadow hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Modals */}
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
