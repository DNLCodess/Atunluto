// app/dashboard/members/page.jsx
"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { useMembers } from "@/hooks/useMember";
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
import Image from "next/image";

export default function MembersPage() {
  const { role } = useAuth();
  const { members, isLoading, deleteMember, isDeleting } = useMembers();

  const [search, setSearch] = useState("");
  const [lgaFilter, setLgaFilter] = useState("all");
  const [wardFilter, setWardFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [editMember, setEditMember] = useState(null);
  const [deleteMemberModal, setDeleteMemberModal] = useState(null);
  const [viewMember, setViewMember] = useState(null);
  const [printCardMember, setPrintCardMember] = useState(null);

  const PAGE_SIZE = 10;

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }

    return age;
  };

  // Filters
  const filteredMembers = useMemo(() => {
    if (!members || members.length === 0) return [];

    return members.filter((m) => {
      const matchesSearch =
        m.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        m.phone?.includes(search) ||
        m.polling_unit?.toLowerCase().includes(search.toLowerCase());

      const matchesLga = lgaFilter === "all" || m.lga === lgaFilter;
      const matchesWard = wardFilter === "all" || m.ward === wardFilter;
      const matchesGender = genderFilter === "all" || m.gender === genderFilter;

      return matchesSearch && matchesLga && matchesWard && matchesGender;
    });
  }, [members, search, lgaFilter, wardFilter, genderFilter]);

  const paginated = useMemo(() => {
    return filteredMembers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  }, [filteredMembers, page]);

  const totalPages = Math.ceil(filteredMembers.length / PAGE_SIZE);

  const uniqueLGAs = useMemo(() => {
    if (!members || members.length === 0) return [];
    return [...new Set(members.map((m) => m.lga))].sort();
  }, [members]);

  const uniqueWards = useMemo(() => {
    if (!members || members.length === 0) return [];
    return [...new Set(members.map((m) => m.ward))].sort();
  }, [members]);

  // Export to Excel
  const exportToExcel = () => {
    const data = filteredMembers.map((m) => ({
      "Membership Number": m.membership_number,
      "Full Name": m.full_name,
      Gender: m.gender ? m.gender.replace("_", " ").toUpperCase() : "N/A",
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
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Members");
    XLSX.writeFile(
      wb,
      `Atunluto_Members_${format(new Date(), "yyyy-MM-dd")}.xlsx`
    );
  };

  // Delete handler
  const handleDelete = () => {
    if (!deleteMemberModal) return;

    deleteMember(deleteMemberModal.id, {
      onSuccess: () => {
        setDeleteMemberModal(null);
      },
      onError: (error) => {
        console.error("Delete failed:", error);
        alert("Failed to delete member. Please try again.");
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading Members...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Members Directory
          </h1>
          <p className="text-gray-600 mt-1">
            Total: <strong>{filteredMembers.length}</strong> members
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {(role === "admin" ||
            role === "super_user" ||
            role === "registration") && (
            <Link
              href="/dashboard/add-member"
              className="inline-flex items-center gap-2 px-5 py-3 bg-green-700 hover:bg-green-800 text-white font-medium rounded-xl shadow-md hover:shadow-lg transition"
            >
              <Plus className="w-5 h-5" />
              Add Member
            </Link>
          )}

          <button
            onClick={exportToExcel}
            disabled={filteredMembers.length === 0}
            className="inline-flex items-center gap-2 px-5 py-3 bg-blue-700 hover:bg-blue-800 text-white font-medium rounded-xl shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
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
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>
          <select
            value={lgaFilter}
            onChange={(e) => {
              setLgaFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
          >
            <option value="all">All LGAs</option>
            {uniqueLGAs.map((lga) => (
              <option key={lga} value={lga}>
                {lga}
              </option>
            ))}
          </select>
          <select
            value={wardFilter}
            onChange={(e) => {
              setWardFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
          >
            <option value="all">All Wards</option>
            {uniqueWards.map((ward) => (
              <option key={ward} value={ward}>
                Ward {ward}
              </option>
            ))}
          </select>
          <select
            value={genderFilter}
            onChange={(e) => {
              setGenderFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
          >
            <option value="all">All Genders</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="prefer_not_to_say">Prefer not to say</option>
          </select>
        </div>
      </div>

      {/* Empty State */}
      {filteredMembers.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No Members Found
          </h3>
          <p className="text-gray-600">
            {search ||
            lgaFilter !== "all" ||
            wardFilter !== "all" ||
            genderFilter !== "all"
              ? "Try adjusting your search filters"
              : "No members have been registered yet"}
          </p>
        </div>
      ) : (
        <>
          {/* Members Grid */}
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {paginated.map((member) => (
              <div
                key={member.id}
                className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all border border-gray-100 overflow-hidden"
              >
                <div className="bg-gradient-to-r from-green-700 to-green-900 p-6 text-white">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold truncate">
                        {member.full_name}
                      </h3>
                      {/* Membership Number Badge */}
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
                        Registered:{" "}
                        {format(new Date(member.created_at), "dd MMM yyyy")}
                      </p>
                    </div>
                    <div className="shrink-0">
                      {member.profile_image_url ? (
                        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/30">
                          <img
                            src={member.profile_image_url}
                            alt={member.full_name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center font-bold text-xl">
                          {member.full_name[0]}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  {(member.date_of_birth || member.gender) && (
                    <div className="flex items-center gap-4 text-sm pb-3 border-b border-gray-100">
                      {member.date_of_birth && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-green-600" />
                          <span className="text-gray-700">
                            {calculateAge(member.date_of_birth)} years
                          </span>
                        </div>
                      )}
                      {member.gender && (
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-green-600" />
                          <span className="text-gray-700 capitalize">
                            {member.gender.replace("_", " ")}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-3 text-sm">
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

                  <div className="flex flex-wrap justify-end gap-2 pt-4 border-t">
                    <button
                      onClick={() => setPrintCardMember(member)}
                      className="text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition"
                    >
                      <CreditCard className="w-4 h-4" />
                      Print Card
                    </button>
                    <button
                      onClick={() => setViewMember(member)}
                      className="text-green-600 hover:bg-green-50 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                    {role === "admin" && (
                      <button
                        onClick={() => setEditMember(member)}
                        className="text-green-600 hover:bg-green-50 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </button>
                    )}
                    {role === "super_user" && (
                      <button
                        onClick={() => setDeleteMemberModal(member)}
                        className="text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-3 rounded-xl bg-white shadow hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-gray-700 font-medium">
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

      {/* View Member Modal */}
      {viewMember && (
        <ViewMemberModal
          member={viewMember}
          onClose={() => setViewMember(null)}
        />
      )}

      {/* Edit Member Modal */}
      {editMember && (
        <EditMemberModal
          member={editMember}
          onClose={() => setEditMember(null)}
        />
      )}

      {/* Print Membership Card Modal */}
      {printCardMember && (
        <MembershipCardPrinter
          member={printCardMember}
          onClose={() => setPrintCardMember(null)}
        />
      )}

      {/* Delete Modal */}
      <AnimatePresence>
        {deleteMemberModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-gradient-to-br from-red-900/40 via-gray-900/60 to-red-900/40 backdrop-blur-md"
              onClick={() => !isDeleting && setDeleteMemberModal(null)}
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{
                duration: 0.3,
                ease: [0.16, 1, 0.3, 1],
                type: "spring",
                stiffness: 300,
                damping: 30,
              }}
              className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full p-8"
            >
              {/* Icon & Header */}
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
                    animate={{
                      rotate: [0, -10, 10, -10, 0],
                    }}
                    transition={{
                      delay: 0.3,
                      duration: 0.5,
                    }}
                  >
                    <Trash2 className="w-10 h-10 text-red-600" />
                  </motion.div>
                </motion.div>

                <motion.h3
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="text-2xl font-bold text-gray-900"
                >
                  Delete Member?
                </motion.h3>

                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-gray-600 mt-4 leading-relaxed"
                >
                  Are you sure you want to permanently delete{" "}
                  <span className="font-bold text-gray-900">
                    {deleteMemberModal.full_name}
                  </span>
                  ?
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl"
                >
                  <p className="text-sm text-red-800 font-semibold flex items-center justify-center gap-2">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    This action cannot be undone
                  </p>
                </motion.div>
              </div>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex gap-4"
              >
                <motion.button
                  whileHover={{ scale: isDeleting ? 1 : 1.02 }}
                  whileTap={{ scale: isDeleting ? 1 : 0.98 }}
                  onClick={() => setDeleteMemberModal(null)}
                  disabled={isDeleting}
                  className="flex-1 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-semibold text-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: isDeleting ? 1 : 1.02 }}
                  whileTap={{ scale: isDeleting ? 1 : 0.98 }}
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl font-semibold shadow-lg shadow-red-600/30 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
              </motion.div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
