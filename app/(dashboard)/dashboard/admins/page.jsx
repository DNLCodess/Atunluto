"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  Search,
  ChevronDown,
  ChevronUp,
  Shield,
  Users,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Copy,
  Check,
  X,
  Building2,
  MapPin,
  Mail,
  Phone,
  Clock,
  AlertCircle,
  Crown,
  UserCheck,
  UserPlus,
  Monitor,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  useAdmins,
  useCurrentAdmin,
  useToggleAdminStatus,
  useDeleteAdmin,
  useAdminStats,
} from "@/hooks/use-admins";
import { createAdminAccount } from "@/app/actions/admins";
import { LGA_NAMES } from "@/lib/oyo-south-lgas";
import { format } from "date-fns";

// ─── Constants ────────────────────────────────────────────────────────────────
const ROLE_META = {
  state_admin: {
    label: "State Admin",
    icon: Crown,
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    badge: "bg-amber-100 text-amber-800",
    desc: "Full platform access — all LGAs",
  },
  super_user: {
    label: "Super User",
    icon: Shield,
    color: "text-primary-green",
    bg: "bg-light-green/30",
    border: "border-accent-green/30",
    badge: "bg-light-green text-primary-green",
    desc: "Full LGA access including deletion",
  },
  administrator: {
    label: "Administrator",
    icon: UserCheck,
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    badge: "bg-blue-100 text-blue-800",
    desc: "Edit members — no deletion",
  },
  registration: {
    label: "Registration Staff",
    icon: UserPlus,
    color: "text-violet-700",
    bg: "bg-violet-50",
    border: "border-violet-200",
    badge: "bg-violet-100 text-violet-800",
    desc: "Register new members only",
  },
  manager: {
    label: "Content Manager",
    icon: Monitor,
    color: "text-text-gray",
    bg: "bg-off-white",
    border: "border-border-gray",
    badge: "bg-border-gray text-text-gray",
    desc: "Media uploads only — no member access",
  },
};

const ROLES_BY_CREATOR = {
  state_admin: ["super_user", "administrator", "registration", "manager"],
  super_user: ["administrator", "registration", "manager"],
};

// ─── Create Admin Modal ───────────────────────────────────────────────────────
function CreateAdminModal({ actor, onClose, onSuccess }) {
  const [form, setForm] = useState({
    email: "",
    full_name: "",
    phone: "",
    role: "",
    lga: actor?.lga || "",
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const availableRoles = ROLES_BY_CREATOR[actor?.role] || [];

  async function handleSubmit() {
    if (!form.email || !form.full_name || !form.role) {
      setError("Email, full name, and role are required.");
      return;
    }
    if (form.role !== "state_admin" && !form.lga) {
      setError("LGA is required.");
      return;
    }

    setPending(true);
    setError("");

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => v && fd.append(k, v));

    const result = await createAdminAccount(fd);
    setPending(false);

    if (result.error) {
      setError(result.error);
    } else {
      onSuccess(result);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-border-gray">
          <div>
            <h2 className="text-lg font-semibold font-primary text-text-dark">
              Create Admin Account
            </h2>
            <p className="text-sm text-text-gray mt-0.5">
              New account will receive a password
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-off-white transition-colors"
          >
            <X size={18} className="text-text-gray" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-dark mb-1.5">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.full_name}
              onChange={(e) =>
                setForm((f) => ({ ...f, full_name: e.target.value }))
              }
              placeholder="e.g. Adewale Johnson"
              className="w-full px-3.5 py-2.5 rounded-lg border border-border-gray text-sm text-text-dark placeholder-text-light focus:outline-none focus:border-accent-green focus:ring-2 focus:ring-accent-green/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-dark mb-1.5">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
              placeholder="admin@example.com"
              className="w-full px-3.5 py-2.5 rounded-lg border border-border-gray text-sm text-text-dark placeholder-text-light focus:outline-none focus:border-accent-green focus:ring-2 focus:ring-accent-green/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-dark mb-1.5">
              Phone Number
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) =>
                setForm((f) => ({ ...f, phone: e.target.value }))
              }
              placeholder="+234 800 000 0000"
              className="w-full px-3.5 py-2.5 rounded-lg border border-border-gray text-sm text-text-dark placeholder-text-light focus:outline-none focus:border-accent-green focus:ring-2 focus:ring-accent-green/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-dark mb-1.5">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-lg border border-border-gray text-sm text-text-dark focus:outline-none focus:border-accent-green focus:ring-2 focus:ring-accent-green/20 transition-all bg-white"
            >
              <option value="">Select a role</option>
              {availableRoles.map((r) => (
                <option key={r} value={r}>
                  {ROLE_META[r]?.label}
                </option>
              ))}
            </select>
            {form.role && ROLE_META[form.role] && (
              <p className="text-xs text-text-gray mt-1.5">
                {ROLE_META[form.role].desc}
              </p>
            )}
          </div>

          {/* LGA selector */}
          {form.role && form.role !== "state_admin" && (
            <div>
              <label className="block text-sm font-medium text-text-dark mb-1.5">
                Local Government Area <span className="text-red-500">*</span>
              </label>
              {actor?.role === "super_user" ? (
                <div className="px-3.5 py-2.5 rounded-lg border border-border-gray bg-off-white text-sm text-text-gray">
                  {actor.lga}
                </div>
              ) : (
                <select
                  value={form.lga}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, lga: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-lg border border-border-gray text-sm text-text-dark focus:outline-none focus:border-accent-green focus:ring-2 focus:ring-accent-green/20 transition-all bg-white"
                >
                  <option value="">Select LGA</option>
                  {LGA_NAMES.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
              <AlertCircle size={15} className="text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        <div className="p-6 pt-0 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg border border-border-gray text-sm font-medium text-text-gray hover:bg-off-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={pending}
            className="flex-1 px-4 py-2.5 rounded-lg bg-primary-green text-white text-sm font-medium hover:bg-secondary-green transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {pending ? "Creating..." : "Create Account"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Password Display Modal ───────────────────────────────────────────────────
function PasswordModal({ data, onClose }) {
  const [copied, setCopied] = useState(false);

  function copyPassword() {
    navigator.clipboard.writeText(data.tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="p-6">
          <div className="w-12 h-12 rounded-full bg-light-green flex items-center justify-center mb-4">
            <Shield size={22} className="text-primary-green" />
          </div>
          <h2 className="text-lg font-semibold font-primary text-text-dark">
            Account Created
          </h2>
          <p className="text-sm text-text-gray mt-1 mb-4">
            {data.message} This password will not be shown again.
          </p>

          <div className="flex items-center gap-2 p-3 bg-off-white rounded-lg border border-border-gray mb-4">
            <code className="flex-1 text-sm font-mono text-text-dark tracking-wider">
              {data.tempPassword}
            </code>
            <button
              onClick={copyPassword}
              className="p-1.5 rounded-md hover:bg-border-gray transition-colors"
            >
              {copied ? (
                <Check size={15} className="text-accent-green" />
              ) : (
                <Copy size={15} className="text-text-gray" />
              )}
            </button>
          </div>

          <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200 mb-4">
            <AlertCircle size={14} className="text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700">
              Share this password securely and don&apos;t lose this
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 rounded-lg bg-primary-green text-white text-sm font-medium hover:bg-secondary-green transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Admin Row ────────────────────────────────────────────────────────────────
function AdminRow({ admin, actor, onToggle, onDelete, togglePending }) {
  const meta = ROLE_META[admin.role];
  const Icon = meta?.icon || Users;
  const canModify =
    actor?.role === "state_admin" ||
    (actor?.role === "super_user" &&
      admin.lga === actor.lga &&
      !["super_user", "state_admin"].includes(admin.role));

  return (
    <div className="flex items-center gap-4 px-4 py-3.5 hover:bg-off-white/60 transition-colors border-b border-border-gray last:border-0">
      {/* Avatar */}
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${meta?.bg} ${meta?.border} border`}
      >
        <Icon size={17} className={meta?.color} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-text-dark truncate">
            {admin.full_name || "—"}
          </span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${meta?.badge}`}
          >
            {meta?.label}
          </span>
          {!admin.is_active && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
              Inactive
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
          <span className="text-xs text-text-gray flex items-center gap-1">
            <Mail size={11} />
            {admin.email}
          </span>
          {admin.lga && (
            <span className="text-xs text-text-gray flex items-center gap-1">
              <MapPin size={11} />
              {admin.lga}
            </span>
          )}
          {admin.last_login && (
            <span className="text-xs text-text-gray flex items-center gap-1">
              <Clock size={11} />
              {format(new Date(admin.last_login), "dd MMM yyyy")}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      {canModify && (
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onToggle(admin.id, !admin.is_active)}
            disabled={togglePending}
            title={admin.is_active ? "Deactivate" : "Activate"}
            className="p-2 rounded-lg hover:bg-border-gray transition-colors disabled:opacity-50"
          >
            {admin.is_active ? (
              <ToggleRight size={18} className="text-accent-green" />
            ) : (
              <ToggleLeft size={18} className="text-text-gray" />
            )}
          </button>
          {(actor?.role === "state_admin" || actor?.role === "super_user") && (
            <button
              onClick={() => onDelete(admin)}
              title="Delete account"
              className="p-2 rounded-lg hover:bg-red-50 transition-colors group"
            >
              <Trash2
                size={16}
                className="text-text-gray group-hover:text-red-500 transition-colors"
              />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── LGA Admin Group Card (state_admin view) ──────────────────────────────────
function LGAGroupCard({
  lga,
  admins,
  actor,
  stats,
  onToggle,
  onDelete,
  togglePending,
}) {
  const [expanded, setExpanded] = useState(false);
  const lgaStats = stats?.[lga];
  const hasSuperUser = admins.some(
    (a) => a.role === "super_user" && a.is_active,
  );

  return (
    <div className="border border-border-gray rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-4 px-5 py-4 bg-white hover:bg-off-white/50 transition-colors text-left"
      >
        <div className="w-10 h-10 rounded-xl bg-light-green/40 border border-accent-green/20 flex items-center justify-center shrink-0">
          <Building2 size={18} className="text-primary-green" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-text-dark font-primary">
              {lga}
            </span>
            {!hasSuperUser && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                No Super User
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            <span className="text-xs text-text-gray">
              {admins.length} admin{admins.length !== 1 ? "s" : ""}
            </span>
            <span className="text-xs text-text-gray">
              {admins.filter((a) => a.is_active).length} active
            </span>
          </div>
        </div>

        {/* Role pills summary */}
        <div className="hidden sm:flex items-center gap-1.5 mr-2">
          {Object.entries(
            admins.reduce((acc, a) => {
              acc[a.role] = (acc[a.role] || 0) + 1;
              return acc;
            }, {}),
          ).map(([role, count]) => {
            const m = ROLE_META[role];
            return m ? (
              <span
                key={role}
                className={`text-xs px-2 py-0.5 rounded-full ${m.badge}`}
              >
                {count} {m.label.split(" ")[0]}
              </span>
            ) : null;
          })}
        </div>

        {expanded ? (
          <ChevronUp size={16} className="text-text-gray shrink-0" />
        ) : (
          <ChevronDown size={16} className="text-text-gray shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-border-gray">
          {admins.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-text-gray">
              No admins created for this LGA yet.
            </div>
          ) : (
            <div>
              {admins.map((admin) => (
                <AdminRow
                  key={admin.id}
                  admin={admin}
                  actor={actor}
                  onToggle={onToggle}
                  onDelete={onDelete}
                  togglePending={togglePending}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
function DeleteConfirmModal({ admin, onConfirm, onClose, pending }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="w-12 h-12 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mb-4">
          <Trash2 size={20} className="text-red-500" />
        </div>
        <h2 className="text-lg font-semibold font-primary text-text-dark">
          Delete Account
        </h2>
        <p className="text-sm text-text-gray mt-1 mb-6">
          Are you sure you want to delete the account for{" "}
          <span className="font-medium text-text-dark">
            {admin.full_name || admin.email}
          </span>
          ? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg border border-border-gray text-sm font-medium text-text-gray hover:bg-off-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={pending}
            className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-60"
          >
            {pending ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminsPage() {
  const { data: actor, isLoading: actorLoading } = useCurrentAdmin();
  const [filters, setFilters] = useState({
    search: "",
    role: "",
    lga: "",
    is_active: undefined,
  });
  const { data: admins = [], isLoading, isError } = useAdmins(filters);
  const { data: stats } = useAdminStats();
  const toggleStatus = useToggleAdminStatus();
  const deleteAdmin = useDeleteAdmin();

  const [showCreate, setShowCreate] = useState(false);
  const [passwordData, setPasswordData] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Group admins by LGA for state_admin view
  const groupedByLGA = useMemo(() => {
    if (actor?.role !== "state_admin") return null;
    const groups = {};
    LGA_NAMES.forEach((l) => {
      groups[l] = [];
    });
    admins.forEach((a) => {
      if (a.lga && groups[a.lga]) groups[a.lga].push(a);
    });
    return groups;
  }, [admins, actor]);

  function handleCreateSuccess(result) {
    setShowCreate(false);
    setPasswordData(result);
  }

  async function handleToggle(adminId, newStatus) {
    toggleStatus.mutate({ adminId, newStatus });
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const result = await deleteAdmin.mutateAsync(deleteTarget.id);
    if (!result?.error) setDeleteTarget(null);
  }

  const canCreate =
    actor?.role === "state_admin" || actor?.role === "super_user";

  if (actorLoading) {
    return (
      <div className="min-h-screen bg-off-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (
    !actor ||
    !["state_admin", "super_user", "administrator"].includes(actor.role)
  ) {
    return (
      <div className="min-h-screen bg-off-white flex items-center justify-center p-8">
        <div className="text-center">
          <Shield size={40} className="mx-auto text-border-gray mb-4" />
          <p className="text-text-gray text-sm">
            You don't have permission to view this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-off-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-extrabold font-primary text-text-dark">
              Admin Management
            </h1>
            <p className="text-sm text-text-gray mt-1">
              {actor.role === "state_admin"
                ? "Manage admin accounts across all 9 LGAs in Oyo South"
                : actor.role === "super_user"
                  ? `Managing admins for ${actor.lga}`
                  : `Viewing admins for ${actor.lga}`}
            </p>
          </div>
          {canCreate && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary-green text-white rounded-xl text-sm font-medium hover:bg-secondary-green transition-colors shadow-sm shrink-0"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Create Admin</span>
              <span className="sm:hidden">New</span>
            </button>
          )}
        </div>

        {/* Role Permission Guide — collapsible */}
        <RoleGuide actor={actor} />

        {/* Filters */}
        <div className="bg-white rounded-xl border border-border-gray p-4 mb-6 flex flex-wrap gap-3">
          <div className="flex-1 min-w-48 flex items-center gap-2 px-3 py-2 rounded-lg border border-border-gray bg-off-white">
            <Search size={15} className="text-text-gray shrink-0" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={filters.search}
              onChange={(e) =>
                setFilters((f) => ({ ...f, search: e.target.value }))
              }
              className="flex-1 bg-transparent text-sm text-text-dark placeholder-text-light outline-none"
            />
          </div>

          {actor.role === "state_admin" && (
            <select
              value={filters.lga}
              onChange={(e) =>
                setFilters((f) => ({ ...f, lga: e.target.value }))
              }
              className="px-3 py-2 rounded-lg border border-border-gray bg-white text-sm text-text-dark focus:outline-none focus:border-accent-green min-w-40"
            >
              <option value="">All LGAs</option>
              {LGA_NAMES.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          )}

          <select
            value={filters.role}
            onChange={(e) =>
              setFilters((f) => ({ ...f, role: e.target.value }))
            }
            className="px-3 py-2 rounded-lg border border-border-gray bg-white text-sm text-text-dark focus:outline-none focus:border-accent-green min-w-40"
          >
            <option value="">All Roles</option>
            {(ROLES_BY_CREATOR[actor?.role] || []).map((r) => (
              <option key={r} value={r}>
                {ROLE_META[r]?.label}
              </option>
            ))}
          </select>

          <select
            value={
              filters.is_active === undefined ? "" : String(filters.is_active)
            }
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                is_active:
                  e.target.value === "" ? undefined : e.target.value === "true",
              }))
            }
            className="px-3 py-2 rounded-lg border border-border-gray bg-white text-sm text-text-dark focus:outline-none focus:border-accent-green"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>

        {/* Content */}
        {isLoading ? (
          <AdminsSkeleton />
        ) : isError ? (
          <ErrorState />
        ) : actor.role === "state_admin" &&
          !filters.lga &&
          !filters.role &&
          !filters.search &&
          !filters.is_active ? (
          // State admin grouped by LGA
          <div className="space-y-3">
            {LGA_NAMES.map((lga) => (
              <LGAGroupCard
                key={lga}
                lga={lga}
                admins={groupedByLGA?.[lga] || []}
                actor={actor}
                stats={stats}
                onToggle={handleToggle}
                onDelete={setDeleteTarget}
                togglePending={toggleStatus.isPending}
              />
            ))}
          </div>
        ) : (
          // Flat list (filtered or non-state-admin)
          <div className="bg-white rounded-xl border border-border-gray overflow-hidden">
            {admins.length === 0 ? (
              <EmptyState
                canCreate={canCreate}
                onCreateClick={() => setShowCreate(true)}
              />
            ) : (
              <div>
                <div className="px-4 py-3 border-b border-border-gray bg-off-white/50">
                  <span className="text-xs font-medium text-text-gray uppercase tracking-wide">
                    {admins.length} admin{admins.length !== 1 ? "s" : ""}
                  </span>
                </div>
                {admins.map((admin) => (
                  <AdminRow
                    key={admin.id}
                    admin={admin}
                    actor={actor}
                    onToggle={handleToggle}
                    onDelete={setDeleteTarget}
                    togglePending={toggleStatus.isPending}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreate && (
        <CreateAdminModal
          actor={actor}
          onClose={() => setShowCreate(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
      {passwordData && (
        <PasswordModal
          data={passwordData}
          onClose={() => setPasswordData(null)}
        />
      )}
      {deleteTarget && (
        <DeleteConfirmModal
          admin={deleteTarget}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
          pending={deleteAdmin.isPending}
        />
      )}
    </div>
  );
}

// ─── Role Guide ───────────────────────────────────────────────────────────────
function RoleGuide({ actor }) {
  const [open, setOpen] = useState(false);
  const visibleRoles =
    actor?.role === "state_admin"
      ? Object.entries(ROLE_META)
      : Object.entries(ROLE_META).filter(([r]) =>
          ROLES_BY_CREATOR[actor?.role]?.includes(r),
        );

  if (visibleRoles.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-border-gray mb-6 overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-off-white/50 transition-colors"
      >
        <span className="text-sm font-medium text-text-dark flex items-center gap-2">
          <Shield size={15} className="text-primary-green" />
          Role Permissions Guide
        </span>
        {open ? (
          <ChevronUp size={15} className="text-text-gray" />
        ) : (
          <ChevronDown size={15} className="text-text-gray" />
        )}
      </button>
      {open && (
        <div className="border-t border-border-gray px-4 pb-4 pt-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {visibleRoles.map(([role, meta]) => {
            const Icon = meta.icon;
            return (
              <div
                key={role}
                className={`p-3 rounded-lg border ${meta.border} ${meta.bg}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon size={14} className={meta.color} />
                  <span className={`text-xs font-semibold ${meta.color}`}>
                    {meta.label}
                  </span>
                </div>
                <p className="text-xs text-text-gray">{meta.desc}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function AdminsSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-xl border border-border-gray p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-border-gray animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-border-gray rounded animate-pulse w-48" />
              <div className="h-3 bg-border-gray rounded animate-pulse w-72" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ canCreate, onCreateClick }) {
  return (
    <div className="px-8 py-16 text-center">
      <Users size={36} className="mx-auto text-border-gray mb-4" />
      <p className="text-sm font-medium text-text-dark mb-1">No admins found</p>
      <p className="text-xs text-text-gray mb-4">
        {canCreate
          ? "Create your first admin account to get started."
          : "No accounts have been created yet."}
      </p>
      {canCreate && (
        <button
          onClick={onCreateClick}
          className="px-4 py-2 rounded-lg bg-primary-green text-white text-sm font-medium hover:bg-secondary-green transition-colors"
        >
          Create Admin
        </button>
      )}
    </div>
  );
}

function ErrorState() {
  return (
    <div className="bg-white rounded-xl border border-border-gray px-8 py-16 text-center">
      <AlertCircle size={36} className="mx-auto text-red-400 mb-4" />
      <p className="text-sm font-medium text-text-dark mb-1">
        Failed to load admins
      </p>
      <p className="text-xs text-text-gray">
        Please refresh the page and try again.
      </p>
    </div>
  );
}
