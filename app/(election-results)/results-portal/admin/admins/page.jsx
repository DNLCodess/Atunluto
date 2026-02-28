"use client";

/**
 * app/results-portal/admin/admins/page.jsx
 * State Admin — Admin account management.
 * Tabs: LGA Admins | PU Agents
 */

import { useState } from "react";
import {
  useLGAAdmins,
  useToggleLGAAdminStatus,
} from "@/hooks/use-election-admins";
import {
  createLGAAdmin,
  regenerateLGAAdminPassword,
} from "@/app/actions/election-auth";
import PollingUnitAdminsManager from "@/components/shared/rp/pu/manager";

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

export default function AdminsPage() {
  const [activeTab, setActiveTab] = useState("lga");

  return (
    <div className="font-[Poppins,sans-serif] text-[#212121] p-8">
      <div className="flex gap-1 bg-[#F5F5F5] rounded-xl p-1.5 mb-8 w-fit border border-[#E0E0E0]">
        {[
          { id: "lga", label: "🏛️ LGA Admins" },
          { id: "pu", label: "📍 PU Agents" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 border-none cursor-pointer ${activeTab === tab.id ? "bg-white text-[#1B5E20] shadow-sm" : "bg-transparent text-[#757575] hover:text-[#212121]"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {activeTab === "lga" ? (
        <LGAAdminsPanel />
      ) : (
        <PollingUnitAdminsManager viewerRole="state_admin" />
      )}
    </div>
  );
}

function LGAAdminsPanel() {
  const { data: admins = [], isLoading, isError } = useLGAAdmins();
  const toggleStatus = useToggleLGAAdminStatus();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(null);
  const [showRegenConfirm, setShowRegenConfirm] = useState(null);
  const [regenLoading, setRegenLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [lgaFilter, setLgaFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filtered = admins.filter((a) => {
    const matchesSearch =
      !searchQuery ||
      a.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLga = !lgaFilter || a.lga === lgaFilter;
    const matchesStatus = !statusFilter || String(a.is_active) === statusFilter;
    return matchesSearch && matchesLga && matchesStatus;
  });

  const totalActive = admins.filter((a) => a.is_active).length;
  const totalPending = admins.filter((a) => a.must_change_password).length;
  const totalInactive = admins.filter((a) => !a.is_active).length;

  async function handleRegen() {
    if (!showRegenConfirm) return;
    setRegenLoading(true);
    const result = await regenerateLGAAdminPassword(showRegenConfirm.id);
    setRegenLoading(false);
    setShowRegenConfirm(null);
    if (result?.error) return alert(result.error);
    setShowPasswordModal({
      adminName: showRegenConfirm.full_name,
      password: result.plainPassword,
      isRegen: true,
    });
  }

  function handleCreateSuccess(data) {
    setShowCreateModal(false);
    setShowPasswordModal({
      adminName: data.admin.full_name,
      password: data.plainPassword,
      isRegen: false,
    });
  }

  return (
    <div>
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="font-[Montserrat,sans-serif] text-[26px] font-extrabold text-[#1B5E20] mt-0 mb-1.5">
            LGA Admin Accounts
          </h1>
          <p className="text-[#757575] text-sm">
            Manage field administrators for the 9 Local Government Areas
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-[#1B5E20] text-white border-none rounded-[10px] px-6 py-3 text-sm font-semibold cursor-pointer flex items-center gap-2"
        >
          <span className="text-[18px]">+</span> Add LGA Admin
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-7">
        {[
          { label: "Total Admins", value: admins.length, color: "#1B5E20" },
          { label: "Active", value: totalActive, color: "#2E7D32" },
          { label: "Pending Setup", value: totalPending, color: "#E65100" },
          { label: "Inactive", value: totalInactive, color: "#757575" },
          {
            label: "LGAs Covered",
            value: new Set(admins.filter((a) => a.is_active).map((a) => a.lga))
              .size,
            color: "#2E7D32",
          },
          {
            label: "LGAs Missing",
            value:
              VALID_LGAS.length -
              new Set(admins.filter((a) => a.is_active).map((a) => a.lga)).size,
            color: "#C62828",
          },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="bg-white rounded-xl px-6 py-5 border border-[#E0E0E0]"
          >
            <div
              className="text-[28px] font-bold font-[Montserrat,sans-serif]"
              style={{ color }}
            >
              {value}
            </div>
            <div className="text-xs text-[#757575] font-semibold mt-1">
              {label}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-[#E0E0E0] px-5 py-4 mb-5 flex gap-3 flex-wrap items-center">
        <input
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 min-w-[200px] px-3.5 py-[9px] border-[1.5px] border-[#E0E0E0] rounded-lg text-[13px] outline-none focus:border-[#1B5E20]"
        />
        <select
          value={lgaFilter}
          onChange={(e) => setLgaFilter(e.target.value)}
          className="px-3.5 py-[9px] border-[1.5px] border-[#E0E0E0] rounded-lg text-[13px] bg-white outline-none cursor-pointer"
        >
          <option value="">All LGAs</option>
          {VALID_LGAS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-[9px] border-[1.5px] border-[#E0E0E0] rounded-lg text-[13px] bg-white outline-none cursor-pointer"
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        {(searchQuery || lgaFilter || statusFilter) && (
          <button
            onClick={() => {
              setSearchQuery("");
              setLgaFilter("");
              setStatusFilter("");
            }}
            className="px-3.5 py-[9px] border-[1.5px] border-[#E0E0E0] rounded-lg text-[13px] cursor-pointer bg-[#F5F5F5] text-[#757575]"
          >
            Clear
          </button>
        )}
        <div className="text-[13px] text-[#757575] ml-auto">
          {filtered.length} of {admins.length} admins
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#E0E0E0] overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-[60px] bg-[#F5F5F5] rounded-lg mb-2 animate-pulse"
              />
            ))}
          </div>
        ) : isError ? (
          <div className="p-10 text-center text-[#C62828]">
            Failed to load admin accounts. Please refresh.
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-[60px] text-center">
            <div className="text-[40px] mb-4">👥</div>
            <div className="text-base font-semibold text-[#212121] mb-2">
              {searchQuery || lgaFilter || statusFilter
                ? "No admins match your filters"
                : "No LGA Admins yet"}
            </div>
            <div className="text-[13px] text-[#757575]">
              {searchQuery || lgaFilter || statusFilter
                ? "Try adjusting your filters."
                : 'Click "Add LGA Admin" to create the first field administrator.'}
            </div>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#F5F5F5] border-b-2 border-[#E0E0E0]">
                {[
                  "Admin",
                  "LGA",
                  "Status",
                  "Last Login",
                  "Created",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-[11px] font-bold text-[#757575] tracking-[0.8px] uppercase"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((admin, i) => (
                <AdminRow
                  key={admin.id}
                  admin={admin}
                  isEven={i % 2 === 0}
                  onToggle={(activate) =>
                    toggleStatus.mutate({ adminId: admin.id, activate })
                  }
                  onRegen={() =>
                    setShowRegenConfirm({
                      id: admin.id,
                      full_name: admin.full_name,
                    })
                  }
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showCreateModal && (
        <CreateAdminModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
      {showPasswordModal && (
        <PasswordDisplayModal
          adminName={showPasswordModal.adminName}
          password={showPasswordModal.password}
          isRegen={showPasswordModal.isRegen}
          onClose={() => setShowPasswordModal(null)}
        />
      )}
      {showRegenConfirm && (
        <RegenConfirmModal
          adminName={showRegenConfirm.full_name}
          loading={regenLoading}
          onConfirm={handleRegen}
          onClose={() => setShowRegenConfirm(null)}
        />
      )}
    </div>
  );
}

function AdminRow({ admin, isEven, onToggle, onRegen }) {
  const [toggling, setToggling] = useState(false);
  async function handleToggle() {
    setToggling(true);
    await onToggle(!admin.is_active);
    setToggling(false);
  }
  return (
    <tr
      className={`${isEven ? "bg-white" : "bg-[#FAFAFA]"} border-b border-[#E0E0E0]`}
    >
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div
            className={`w-[38px] h-[38px] rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${admin.is_active ? "bg-[#C8E6C9] text-[#1B5E20]" : "bg-[#EEEEEE] text-[#757575]"}`}
          >
            {admin.full_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-semibold text-[#212121]">
              {admin.full_name}
            </div>
            <div className="text-xs text-[#757575]">{admin.email}</div>
            {admin.phone && (
              <div className="text-[11px] text-[#757575]">{admin.phone}</div>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5">
        <span className="bg-[#E8F5E9] text-[#1B5E20] px-2.5 py-1 rounded-full text-xs font-semibold">
          {admin.lga}
        </span>
      </td>
      <td className="px-4 py-3.5">
        <div className="flex flex-col gap-1">
          <span
            className={`inline-block px-2.5 py-[3px] rounded-full text-[11px] font-bold ${admin.is_active ? "bg-[#E8F5E9] text-[#2E7D32]" : "bg-[#EEEEEE] text-[#757575]"}`}
          >
            {admin.is_active ? "● ACTIVE" : "● INACTIVE"}
          </span>
          {admin.must_change_password && admin.is_active && (
            <span className="bg-[#FFF3E0] text-[#E65100] px-2 py-0.5 rounded-full text-[10px] font-semibold inline-block">
              PENDING SETUP
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3.5 text-[13px] text-[#757575]">
        {admin.last_login ? (
          formatDate(admin.last_login)
        ) : (
          <span className="text-[#BDBDBD] italic">Never</span>
        )}
      </td>
      <td className="px-4 py-3.5 text-[13px] text-[#757575]">
        {formatDate(admin.created_at)}
      </td>
      <td className="px-4 py-3.5">
        <div className="flex gap-2">
          <button
            onClick={onRegen}
            className="px-3 py-1.5 bg-transparent border-[1.5px] border-[#1B5E20] text-[#1B5E20] rounded-md text-xs font-semibold cursor-pointer"
          >
            🔑 Regen
          </button>
          <button
            onClick={handleToggle}
            disabled={toggling}
            className={`px-3 py-1.5 bg-transparent border-[1.5px] rounded-md text-xs font-semibold ${admin.is_active ? "border-[#C62828] text-[#C62828]" : "border-[#2E7D32] text-[#2E7D32]"} ${toggling ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
          >
            {toggling
              ? "..."
              : admin.is_active
                ? "⛔ Deactivate"
                : "✅ Activate"}
          </button>
        </div>
      </td>
    </tr>
  );
}

function CreateAdminModal({ onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await createLGAAdmin(new FormData(e.currentTarget));
    setLoading(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    onSuccess(result);
  }
  return (
    <Overlay onClose={onClose}>
      <ModalCard
        title="Add LGA Admin"
        subtitle="A secure password will be auto-generated."
        onClose={onClose}
        width="480px"
      >
        {error && (
          <div className="bg-[#FFEBEE] border border-[#FFCDD2] rounded-lg px-3.5 py-3 mb-5 text-[13px] text-[#C62828]">
            ⚠️ {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <FormField
            label="Full Name"
            name="full_name"
            type="text"
            placeholder="e.g. Adebayo Okafor"
            required
          />
          <FormField
            label="Email Address"
            name="email"
            type="email"
            placeholder="admin@example.com"
            required
          />
          <FormField
            label="Phone Number"
            name="phone"
            type="tel"
            placeholder="+234 800 000 0000"
          />
          <div className="mb-5">
            <label className="block text-[13px] font-semibold text-[#212121] mb-2">
              Assigned LGA <span className="text-[#C62828]">*</span>
            </label>
            <select
              name="lga"
              required
              className="w-full px-3.5 py-[11px] border-[1.5px] border-[#E0E0E0] rounded-lg text-sm bg-white outline-none cursor-pointer box-border"
            >
              <option value="">Select LGA...</option>
              {VALID_LGAS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div className="bg-[#E8F5E9] border border-[#C8E6C9] rounded-lg px-3.5 py-3 mb-6 text-xs text-[#2E7D32] leading-relaxed">
            🔒 A 12-character password will be generated automatically. It will
            be displayed <strong>once</strong>.
          </div>
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-[11px] bg-white text-[#212121] border-[1.5px] border-[#E0E0E0] rounded-lg text-sm font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-[11px] text-white border-none rounded-lg text-sm font-semibold ${loading ? "bg-[#A5D6A7] cursor-not-allowed" : "bg-[#1B5E20] cursor-pointer"}`}
            >
              {loading ? "Creating..." : "Create Account"}
            </button>
          </div>
        </form>
      </ModalCard>
    </Overlay>
  );
}

function PasswordDisplayModal({ adminName, password, isRegen, onClose }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(password).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }
  return (
    <Overlay onClose={() => {}}>
      <ModalCard
        title={isRegen ? "Password Regenerated" : "Account Created"}
        subtitle={`Share securely with ${adminName}.`}
        width="480px"
        hideClose
      >
        <div className="bg-[#FFF8E1] border border-[#FFE082] rounded-lg px-3.5 py-3 mb-6 flex gap-2.5 items-start">
          <span className="text-[18px]">⚠️</span>
          <div className="text-[13px] text-[#5D4037] leading-relaxed">
            <strong>This password will not be shown again.</strong>
            <br />
            Share via a secure channel. Must be changed on first login.
          </div>
        </div>
        <div className="text-[13px] text-[#757575] mb-2">
          Admin: <strong className="text-[#212121]">{adminName}</strong>
        </div>
        <div className="bg-[#1B5E20] rounded-[10px] px-6 py-5 mb-3 flex items-center justify-between gap-4">
          <code className="font-['Courier_New',monospace] text-[22px] font-bold text-white tracking-[3px]">
            {password}
          </code>
          <button
            onClick={handleCopy}
            className={`border border-white/30 rounded-lg px-4 py-2 text-white text-[13px] font-semibold cursor-pointer whitespace-nowrap transition-colors duration-200 ${copied ? "bg-[#4CAF50]" : "bg-white/15"}`}
          >
            {copied ? "✅ Copied!" : "📋 Copy"}
          </button>
        </div>
        <div className="text-[11px] text-[#757575] mb-7 text-center">
          12-character password · Alphanumeric + symbols
        </div>
        <button
          onClick={onClose}
          className="w-full px-6 py-[11px] bg-[#1B5E20] text-white border-none rounded-lg text-sm font-semibold cursor-pointer"
        >
          I've copied the password — Close
        </button>
      </ModalCard>
    </Overlay>
  );
}

function RegenConfirmModal({ adminName, loading, onConfirm, onClose }) {
  return (
    <Overlay onClose={onClose}>
      <ModalCard title="Regenerate Password?" width="420px" onClose={onClose}>
        <div className="bg-[#FFEBEE] border border-[#FFCDD2] rounded-lg p-3.5 mb-6 text-[13px] text-[#C62828] leading-[1.7]">
          <strong>⚠️ This will:</strong>
          <ul className="mt-2 ml-4 pl-1">
            <li>
              Generate a new password for <strong>{adminName}</strong>
            </li>
            <li>Revoke all active sessions</li>
            <li>Force password change on next login</li>
          </ul>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-white text-[#212121] border-[1.5px] border-[#E0E0E0] rounded-lg text-sm font-medium cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-6 py-2.5 bg-[#C62828] text-white border-none rounded-lg text-sm font-semibold ${loading ? "opacity-70 cursor-not-allowed" : "cursor-pointer"}`}
          >
            {loading ? "Regenerating..." : "Yes, Regenerate"}
          </button>
        </div>
      </ModalCard>
    </Overlay>
  );
}

function Overlay({ children, onClose }) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/55 backdrop-blur-[2px] flex items-center justify-center z-50 p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full flex justify-center"
      >
        {children}
      </div>
    </div>
  );
}

function ModalCard({
  title,
  subtitle,
  children,
  onClose,
  width = "480px",
  hideClose = false,
}) {
  return (
    <div
      className="bg-white rounded-2xl p-9 w-full shadow-[0_24px_64px_rgba(0,0,0,0.25)]"
      style={{ maxWidth: width }}
    >
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="font-[Montserrat,sans-serif] text-xl font-extrabold text-[#1B5E20] mt-0 mb-1">
            {title}
          </h2>
          {subtitle && (
            <p className="text-[13px] text-[#757575] m-0">{subtitle}</p>
          )}
        </div>
        {!hideClose && onClose && (
          <button
            onClick={onClose}
            className="bg-transparent border-none text-xl cursor-pointer text-[#757575] pl-4 leading-none"
          >
            ×
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function FormField({ label, name, type, placeholder, required }) {
  return (
    <div className="mb-5">
      <label className="block text-[13px] font-semibold text-[#212121] mb-2">
        {label} {required && <span className="text-[#C62828]">*</span>}
      </label>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        required={required}
        className="w-full px-3.5 py-[11px] border-[1.5px] border-[#E0E0E0] rounded-lg text-sm outline-none box-border transition-colors duration-200 focus:border-[#1B5E20]"
      />
    </div>
  );
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
