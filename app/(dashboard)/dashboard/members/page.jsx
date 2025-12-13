// app/admin/members/page.jsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { createClient } from "@/supabase/client";
import useAuthStore from "@/lib/store";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Download,
  Filter,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Phone,
  MessageCircle,
  X,
  Eye,
} from "lucide-react";
import * as XLSX from "xlsx";
import Link from "next/link";
import ViewMemberModal from "@/components/common/admin/view";
import EditMemberModal from "@/components/common/admin/edit";
import { AnimatePresence, motion } from "framer-motion";

const supabase = createClient();

export default function MembersPage() {
  const { role } = useAuthStore();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [lgaFilter, setLgaFilter] = useState("all");
  const [wardFilter, setWardFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [editMember, setEditMember] = useState(null);
  const [deleteMember, setDeleteMember] = useState(null);
  const [viewMember, setViewMember] = useState(null);

  const PAGE_SIZE = 10;

  // Fetch members + real-time
  useEffect(() => {
    const fetchMembers = async () => {
      const { data, error } = await supabase
        .from("members")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching members:", error);
      } else {
        setMembers(data || []);
      }
      setLoading(false);
    };

    fetchMembers();

    // Real-time subscription
    const channel = supabase
      .channel("members-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "members" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setMembers((prev) => [payload.new, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setMembers((prev) =>
              prev.map((m) => (m.id === payload.new.id ? payload.new : m))
            );
          } else if (payload.eventType === "DELETE") {
            setMembers((prev) => prev.filter((m) => m.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Filters
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const matchesSearch =
        m.full_name.toLowerCase().includes(search.toLowerCase()) ||
        m.phone.includes(search) ||
        m.polling_unit.toLowerCase().includes(search.toLowerCase());

      const matchesLga = lgaFilter === "all" || m.lga === lgaFilter;
      const matchesWard = wardFilter === "all" || m.ward === lgaFilter;

      return matchesSearch && matchesLga && matchesWard;
    });
  }, [members, search, lgaFilter, wardFilter]);

  const paginated = filteredMembers.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );
  const totalPages = Math.ceil(filteredMembers.length / PAGE_SIZE);

  const uniqueLGAs = [...new Set(members.map((m) => m.lga))].sort();
  const uniqueWards = [...new Set(members.map((m) => m.ward))].sort();

  // Export to Excel
  const exportToExcel = () => {
    const data = filteredMembers.map((m) => ({
      "Full Name": m.full_name,
      Phone: m.phone,
      WhatsApp: m.whatsapp,
      LGA: m.lga,
      Ward: m.ward,
      "Polling Unit": m.polling_unit,
      Registered: format(new Date(m.created_at), "PPP"),
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
  const handleDelete = async () => {
    if (!deleteMember) return;
    await supabase.from("members").delete().eq("id", deleteMember.id);
    setDeleteMember(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
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
            className="inline-flex items-center gap-2 px-5 py-3 bg-blue-700 hover:bg-blue-800 text-white font-medium rounded-xl shadow-md transition"
          >
            <Download className="w-5 h-5" />
            Export Excel
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                {ward}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Members Grid */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {paginated.map((member) => (
          <div
            key={member.id}
            className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all border border-gray-100 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-green-700 to-green-900 p-6 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold">{member.full_name}</h3>
                  <p className="text-green-100 text-sm mt-1">
                    {format(new Date(member.created_at), "dd MMM yyyy")}
                  </p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center font-bold">
                  {member.full_name[0]}
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium">{member.lga} LGA</p>
                    <p className="text-gray-500">
                      Ward {member.ward} • {member.polling_unit}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-green-600" />
                  <span>{member.phone}</span>
                </div>
                {member.whatsapp && (
                  <div className="flex items-center gap-3">
                    <MessageCircle className="w-5 h-5 text-green-600" />
                    <span>{member.whatsapp}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => setViewMember(member)}
                  className="text-green-600 hover:bg-green-50 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  View
                </button>
                {role === "admin" && (
                  <button
                    onClick={() => setEditMember(member)}
                    className="text-green-600 hover:bg-green-50 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                )}
                {role === "super_user" && (
                  <button
                    onClick={() => setDeleteMember(member)}
                    className="text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
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
            className="p-3 rounded-xl bg-white shadow hover:shadow-md disabled:opacity-50"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-gray-700 font-medium">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-3 rounded-xl bg-white shadow hover:shadow-md disabled:opacity-50"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
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
          onUpdate={(updated) => {
            setMembers((prev) =>
              prev.map((m) => (m.id === updated.id ? updated : m))
            );
          }}
        />
      )}
      {/* Delete Modal */}
      {deleteMember && (
        <AnimatePresence>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Glossy Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-gradient-to-br from-red-900/40 via-gray-900/60 to-red-900/40 backdrop-blur-md"
              onClick={() => setDeleteMember(null)}
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
                    {deleteMember.full_name}
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
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setDeleteMember(null)}
                  className="flex-1 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-semibold text-gray-700 transition"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDelete}
                  className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl font-semibold shadow-lg shadow-red-600/30 transition"
                >
                  Delete Permanently
                </motion.button>
              </motion.div>
            </motion.div>
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}
