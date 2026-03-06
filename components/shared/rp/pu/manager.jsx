"use client";

/**
 * components/shared/rp/pu/manager.jsx
 * Shared component used by both State Admin and LGA Admin to manage PU Agents.
 * Props:
 *   viewerRole: "state_admin" | "lga_admin"
 *   viewerLGA:  string (locks LGA field for lga_admin)
 */

import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  usePUAdmins,
  useTogglePUAdminStatus,
} from "@/hooks/use-election-admins";
import {
  OYO_SOUTH_LGA_NAMES,
  useWardsForLGA,
  usePollingUnitsForWard,
  prefetchPollingUnits,
} from "@/hooks/use-pu";
import {
  createPUAdmin,
  regeneratePUAdminPassword,
} from "@/app/actions/election-auth";

export default function PollingUnitAdminsManager({ viewerRole, viewerLGA }) {
  const [lgaFilter, setLgaFilter] = useState(viewerLGA || "");
  const [wardFilter, setWardFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [passwordModal, setPasswordModal] = useState(null);
  const [regenConfirm, setRegenConfirm] = useState(null);
  const [regenLoading, setRegenLoading] = useState(false);

  const queryClient = useQueryClient();

  const {
    data: admins = [],
    isLoading,
    isError,
  } = usePUAdmins(
    viewerRole === "lga_admin" ? viewerLGA : lgaFilter || undefined,
  );
  const toggleStatus = useTogglePUAdminStatus();

  const filtered = admins.filter((a) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      a.full_name.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      a.polling_unit?.toLowerCase().includes(q);
    const matchWard = !wardFilter || a.ward === wardFilter;
    const matchStatus = !statusFilter || String(a.is_active) === statusFilter;
    return matchSearch && matchWard && matchStatus;
  });

  const uniqueWards = [
    ...new Set(admins.map((a) => a.ward).filter(Boolean)),
  ].sort();

  async function handleRegen() {
    if (!regenConfirm) return;
    setRegenLoading(true);
    const result = await regeneratePUAdminPassword(regenConfirm.id);
    setRegenLoading(false);
    setRegenConfirm(null);
    if (result?.error) return alert(result.error);
    queryClient.invalidateQueries({ queryKey: ["pu-admins"] });
    setPasswordModal({
      adminName: regenConfirm.full_name,
      password: result.plainPassword,
      isRegen: true,
    });
  }

  function handleCreateSuccess(data) {
    queryClient.invalidateQueries({ queryKey: ["pu-admins"] });
    setShowCreate(false);
    setPasswordModal({
      adminName: data.admin.full_name,
      password: data.plainPassword,
      isRegen: false,
    });
  }

  return (
    <div className="font-[Poppins,sans-serif] text-[#212121]">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="font-[Montserrat,sans-serif] text-[26px] font-extrabold text-[#1B5E20] mb-1.5">
            PU Agent Accounts
          </h1>
          <p className="text-[#757575] text-sm">
            {viewerRole === "lga_admin"
              ? `Manage polling unit agents for ${viewerLGA}`
              : "Manage polling unit agents across all 9 LGAs"}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-[#1B5E20] text-white rounded-[10px] px-6 py-3 text-sm font-semibold cursor-pointer flex items-center gap-2 border-none"
        >
          <span className="text-[18px]">+</span> Add PU Agent
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-7">
        {[
          { label: "Total Agents", value: admins.length, color: "#1B5E20" },
          {
            label: "Active",
            value: admins.filter((a) => a.is_active).length,
            color: "#2E7D32",
          },
          {
            label: "Pending Setup",
            value: admins.filter((a) => a.must_change_password).length,
            color: "#E65100",
          },
          {
            label: "Inactive",
            value: admins.filter((a) => !a.is_active).length,
            color: "#757575",
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

      {/* Filters */}
      <div className="bg-white rounded-xl border border-[#E0E0E0] px-5 py-4 mb-5 flex gap-3 flex-wrap items-center">
        <input
          placeholder="Search name, email, or polling unit..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 min-w-[200px] px-3.5 py-[9px] border-[1.5px] border-[#E0E0E0] rounded-lg text-[13px] outline-none focus:border-[#1B5E20]"
        />
        {viewerRole === "state_admin" && (
          <select
            value={lgaFilter}
            onChange={(e) => {
              setLgaFilter(e.target.value);
              setWardFilter("");
            }}
            className="px-3.5 py-[9px] border-[1.5px] border-[#E0E0E0] rounded-lg text-[13px] bg-white outline-none cursor-pointer"
          >
            <option value="">All LGAs</option>
            {OYO_SOUTH_LGA_NAMES.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        )}
        <select
          value={wardFilter}
          onChange={(e) => setWardFilter(e.target.value)}
          className="px-3.5 py-[9px] border-[1.5px] border-[#E0E0E0] rounded-lg text-[13px] bg-white outline-none cursor-pointer"
        >
          <option value="">All Wards</option>
          {uniqueWards.map((w) => (
            <option key={w} value={w}>
              {w}
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
        {(searchQuery ||
          wardFilter ||
          statusFilter ||
          (viewerRole === "state_admin" && lgaFilter)) && (
          <button
            onClick={() => {
              setSearchQuery("");
              setWardFilter("");
              setStatusFilter("");
              setLgaFilter(viewerLGA || "");
            }}
            className="px-3.5 py-[9px] border-[1.5px] border-[#E0E0E0] rounded-lg text-[13px] cursor-pointer bg-[#F5F5F5] text-[#757575]"
          >
            Clear
          </button>
        )}
        <div className="text-[13px] text-[#757575] ml-auto">
          {filtered.length} of {admins.length} agents
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#E0E0E0] overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-[60px] bg-[#F5F5F5] rounded-lg mb-2 animate-pulse"
              />
            ))}
          </div>
        ) : isError ? (
          <div className="p-10 text-center text-[#C62828]">
            Failed to load agents. Please refresh.
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="text-4xl mb-4">📍</div>
            <div className="text-base font-semibold text-[#212121] mb-2">
              {searchQuery || wardFilter || statusFilter
                ? "No agents match your filters"
                : "No PU Agents yet"}
            </div>
            <div className="text-[13px] text-[#757575]">
              {searchQuery || wardFilter || statusFilter
                ? "Try adjusting your filters."
                : 'Click "Add PU Agent" to create the first polling unit agent.'}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#F5F5F5] border-b-2 border-[#E0E0E0]">
                  {[
                    "Agent",
                    "LGA",
                    "Ward · Polling Unit",
                    "Status",
                    "Last Login",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-[11px] font-bold text-[#757575] tracking-[0.8px] uppercase whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((agent, i) => (
                  <PUAgentRow
                    key={agent.id}
                    agent={agent}
                    isEven={i % 2 === 0}
                    onToggle={(activate) =>
                      toggleStatus.mutate({ adminId: agent.id, activate })
                    }
                    onRegen={() =>
                      setRegenConfirm({
                        id: agent.id,
                        full_name: agent.full_name,
                      })
                    }
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreate && (
        <CreatePUAdminModal
          viewerRole={viewerRole}
          lockedLGA={viewerLGA}
          onClose={() => setShowCreate(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
      {passwordModal && (
        <PasswordDisplayModal
          adminName={passwordModal.adminName}
          password={passwordModal.password}
          isRegen={passwordModal.isRegen}
          onClose={() => setPasswordModal(null)}
        />
      )}
      {regenConfirm && (
        <RegenConfirmModal
          adminName={regenConfirm.full_name}
          loading={regenLoading}
          onConfirm={handleRegen}
          onClose={() => setRegenConfirm(null)}
        />
      )}
    </div>
  );
}

// ── PU Agent Row ──────────────────────────────────────────────────────────────

function PUAgentRow({ agent, isEven, onToggle, onRegen }) {
  const [toggling, setToggling] = useState(false);

  async function handleToggle() {
    setToggling(true);
    await onToggle(!agent.is_active);
    setToggling(false);
  }

  return (
    <tr
      className={`${isEven ? "bg-white" : "bg-[#FAFAFA]"} border-b border-[#E0E0E0]`}
    >
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${agent.is_active ? "bg-[#C8E6C9] text-[#1B5E20]" : "bg-[#EEEEEE] text-[#757575]"}`}
          >
            {agent.full_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-semibold text-[#212121]">
              {agent.full_name}
            </div>
            <div className="text-xs text-[#757575]">{agent.email}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5">
        <span className="bg-[#E8F5E9] text-[#1B5E20] px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
          {agent.lga}
        </span>
      </td>
      <td className="px-4 py-3.5">
        <div className="text-[13px] font-semibold text-[#212121]">
          {agent.ward}
        </div>
        <div className="text-xs text-[#757575] mt-0.5">
          {agent.polling_unit}
        </div>
      </td>
      <td className="px-4 py-3.5">
        <div className="flex flex-col gap-1">
          <span
            className={`inline-block px-2.5 py-[3px] rounded-full text-[11px] font-bold ${agent.is_active ? "bg-[#E8F5E9] text-[#2E7D32]" : "bg-[#EEEEEE] text-[#757575]"}`}
          >
            {agent.is_active ? "● ACTIVE" : "● INACTIVE"}
          </span>
          {agent.must_change_password && agent.is_active && (
            <span className="bg-[#FFF3E0] text-[#E65100] px-2 py-0.5 rounded-full text-[10px] font-semibold inline-block">
              PENDING SETUP
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3.5 text-[13px] text-[#757575]">
        {agent.last_login ? (
          new Date(agent.last_login).toLocaleDateString("en-NG", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        ) : (
          <span className="text-[#BDBDBD] italic">Never</span>
        )}
      </td>
      <td className="px-4 py-3.5">
        <div className="flex gap-2">
          <button
            onClick={onRegen}
            className="px-3 py-1.5 bg-transparent border-[1.5px] border-[#1B5E20] text-[#1B5E20] rounded-md text-xs font-semibold cursor-pointer whitespace-nowrap"
          >
            🔑 Regen
          </button>
          <button
            onClick={handleToggle}
            disabled={toggling}
            className={`px-3 py-1.5 bg-transparent border-[1.5px] rounded-md text-xs font-semibold whitespace-nowrap ${agent.is_active ? "border-[#C62828] text-[#C62828]" : "border-[#2E7D32] text-[#2E7D32]"} ${toggling ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
          >
            {toggling
              ? "..."
              : agent.is_active
                ? "⛔ Deactivate"
                : "✅ Activate"}
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── Create PU Admin Modal ─────────────────────────────────────────────────────

function CreatePUAdminModal({ viewerRole, lockedLGA, onClose, onSuccess }) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedLGA, setSelectedLGA] = useState(lockedLGA || "");
  const [selectedWard, setSelectedWard] = useState("");

  // Wards from DB
  const { data: wardOptions = [], isLoading: wardsLoading } =
    useWardsForLGA(selectedLGA);

  // Polling units from DB — cascades from selected ward
  const { data: puOptions = [], isLoading: puLoading } = usePollingUnitsForWard(
    selectedLGA,
    selectedWard,
  );

  // Prefetch all PUs for this LGA as soon as ward list resolves
  useEffect(() => {
    if (!selectedLGA || wardOptions.length === 0) return;
    wardOptions.forEach(({ ward_name }) =>
      prefetchPollingUnits(queryClient, selectedLGA, ward_name),
    );
  }, [selectedLGA, wardOptions]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await createPUAdmin(new FormData(e.currentTarget));
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
        title="Add PU Agent"
        subtitle="A secure password will be auto-generated."
        onClose={onClose}
        width="520px"
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
            placeholder="agent@example.com"
            required
          />
          <FormField
            label="Phone Number"
            name="phone"
            type="tel"
            placeholder="+234 800 000 0000"
          />

          {/* LGA */}
          <div className="mb-5">
            <label className="block text-[13px] font-semibold text-[#212121] mb-2">
              LGA <span className="text-[#C62828]">*</span>
            </label>
            {viewerRole === "lga_admin" ? (
              <>
                <input type="hidden" name="lga" value={lockedLGA} />
                <div className="px-3.5 py-[11px] bg-[#F5F5F5] border-[1.5px] border-[#E0E0E0] rounded-lg text-sm text-[#757575]">
                  {lockedLGA}
                </div>
              </>
            ) : (
              <select
                name="lga"
                required
                value={selectedLGA}
                onChange={(e) => {
                  setSelectedLGA(e.target.value);
                  setSelectedWard("");
                }}
                className="w-full px-3.5 py-[11px] border-[1.5px] border-[#E0E0E0] rounded-lg text-sm bg-white outline-none cursor-pointer"
              >
                <option value="">Select LGA...</option>
                {OYO_SOUTH_LGA_NAMES.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Ward — from DB */}
          <div className="mb-5">
            <label className="block text-[13px] font-semibold text-[#212121] mb-2">
              Ward <span className="text-[#C62828]">*</span>
            </label>
            <div className="relative">
              {wardsLoading ? (
                <div className="h-11 bg-[#EEEEEE] rounded-lg animate-pulse" />
              ) : (
                <select
                  name="ward"
                  required
                  value={selectedWard}
                  disabled={!selectedLGA}
                  onChange={(e) => setSelectedWard(e.target.value)}
                  className="w-full px-3.5 py-[11px] border-[1.5px] border-[#E0E0E0] rounded-lg text-sm bg-white outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {selectedLGA ? "Select ward..." : "Select LGA first"}
                  </option>
                  {wardOptions.map((w) => (
                    <option key={w.ward_number} value={w.ward_name}>
                      {w.ward_name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Polling Unit — from DB, cascades from ward */}
          <div className="mb-5">
            <label className="block text-[13px] font-semibold text-[#212121] mb-2">
              Polling Unit <span className="text-[#C62828]">*</span>
            </label>
            <div className="relative">
              {puLoading ? (
                <div className="h-11 bg-[#EEEEEE] rounded-lg animate-pulse" />
              ) : (
                <select
                  name="polling_unit"
                  required
                  disabled={!selectedWard}
                  className="w-full px-3.5 py-[11px] border-[1.5px] border-[#E0E0E0] rounded-lg text-sm bg-white outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {selectedWard
                      ? puOptions.length === 0
                        ? "No polling units found"
                        : "Select polling unit..."
                      : "Select ward first"}
                  </option>
                  {puOptions.map((pu) => (
                    <option key={pu.id} value={pu.pu_name}>
                      {pu.pu_code} — {pu.pu_name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="bg-[#E8F5E9] border border-[#C8E6C9] rounded-lg px-3.5 py-3 mb-6 text-xs text-[#2E7D32] leading-relaxed">
            🔒 A 12-character password will be auto-generated and displayed
            once. The agent must change it on first login.
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

// ── Password Modal ────────────────────────────────────────────────────────────

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
            Share it via a secure channel. They will be required to change it on
            first login.
          </div>
        </div>
        <div className="text-[13px] text-[#757575] mb-2">
          Agent: <strong className="text-[#212121]">{adminName}</strong>
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

// ── Regen Confirm Modal ───────────────────────────────────────────────────────

function RegenConfirmModal({ adminName, loading, onConfirm, onClose }) {
  return (
    <Overlay onClose={onClose}>
      <ModalCard title="Regenerate Password?" width="420px" onClose={onClose}>
        <div className="bg-[#FFEBEE] border border-[#FFCDD2] rounded-lg p-3.5 mb-6 text-[13px] text-[#C62828] leading-[1.7]">
          <strong>⚠️ This will:</strong>
          <ul className="mt-2 ml-4">
            <li>
              Generate a new password for <strong>{adminName}</strong>
            </li>
            <li>Revoke all their active sessions</li>
            <li>Force a password change on next login</li>
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

// ── Shared primitives ─────────────────────────────────────────────────────────

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
