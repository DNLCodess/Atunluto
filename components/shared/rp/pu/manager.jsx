"use client";

/**
 * components/erms/PollingUnitAdminsManager.jsx
 * Reusable component for managing Polling Unit Admins.
 * Used by both State Admin (/admin/admins tab) and LGA Admin (/lga/agents).
 *
 * Props:
 *   viewerRole  — "state_admin" | "lga_admin"
 *   viewerLGA   — locked LGA string for lga_admin, null for state_admin
 *   wardsData   — optional { [lgaName]: wardsList[] } map
 */

import { useState, useEffect } from "react";
import { usePUAdmins, useTogglePUAdminStatus } from "@/hooks/use-pu-admins";
import {
  createPUAdmin,
  regeneratePUAdminPassword,
} from "@/app/actions/pu-auth";
import { fetchLGAWards } from "@/app/actions/results-fetch";

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

// ─────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────

export default function PollingUnitAdminsManager({ viewerRole, viewerLGA }) {
  const lgaFilter = viewerRole === "lga_admin" ? viewerLGA : undefined;
  const { data: admins = [], isLoading, isError } = usePUAdmins(lgaFilter);
  const toggleStatus = useTogglePUAdminStatus(lgaFilter);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(null);
  const [showRegenConfirm, setShowRegenConfirm] = useState(null);
  const [regenLoading, setRegenLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [lgaFilter2, setLgaFilter2] = useState(viewerLGA || "");
  const [wardFilter, setWardFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filtered = admins.filter((a) => {
    const matchSearch =
      !searchQuery ||
      a.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.polling_unit || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchLGA =
      viewerRole === "lga_admin" || !lgaFilter2 || a.lga === lgaFilter2;
    const matchWard = !wardFilter || a.ward === wardFilter;
    const matchStatus = !statusFilter || String(a.is_active) === statusFilter;
    return matchSearch && matchLGA && matchWard && matchStatus;
  });

  const totalActive = admins.filter((a) => a.is_active).length;
  const totalPending = admins.filter((a) => a.must_change_password).length;
  const uniqueLGAs = [...new Set(admins.map((a) => a.lga))].length;
  const uniqueWards = [
    ...new Set(admins.filter((a) => a.is_active).map((a) => a.ward)),
  ];

  // Unique wards across filtered LGA for ward filter dropdown
  const wardOptions = [
    ...new Set(
      admins
        .filter(
          (a) =>
            viewerRole === "lga_admin" || !lgaFilter2 || a.lga === lgaFilter2,
        )
        .map((a) => a.ward)
        .filter(Boolean),
    ),
  ].sort();

  async function handleRegen() {
    if (!showRegenConfirm) return;
    setRegenLoading(true);
    const result = await regeneratePUAdminPassword(showRegenConfirm.id);
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
    <div className="font-[Poppins,sans-serif] text-[#212121]">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="font-[Montserrat,sans-serif] text-[26px] font-extrabold text-[#1B5E20] mb-1.5">
            Polling Unit Agents
          </h1>
          <p className="text-[#757575] text-sm">
            {viewerRole === "lga_admin"
              ? `Manage agents submitting results for ${viewerLGA}`
              : "Manage polling unit agents across all 9 LGAs"}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-[#1B5E20] hover:bg-[#2E7D32] text-white border-none rounded-xl px-6 py-3 text-sm font-semibold cursor-pointer flex items-center gap-2 transition-colors duration-150"
        >
          <span className="text-lg leading-none">+</span> Add PU Agent
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        {[
          {
            label: "Total Agents",
            value: admins.length,
            color: "text-[#1B5E20]",
          },
          { label: "Active", value: totalActive, color: "text-[#2E7D32]" },
          {
            label: "Pending Setup",
            value: totalPending,
            color: "text-orange-700",
          },
          {
            label:
              viewerRole === "lga_admin" ? "Wards Covered" : "LGAs Covered",
            value: viewerRole === "lga_admin" ? uniqueWards.length : uniqueLGAs,
            color: "text-[#1B5E20]",
          },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="bg-white rounded-xl px-6 py-5 border border-[#E0E0E0]"
          >
            <div
              className={`font-[Montserrat,sans-serif] text-[28px] font-extrabold ${color}`}
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
          placeholder="Search name, email, polling unit..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 min-w-[200px] px-3.5 py-2.5 border-[1.5px] border-[#E0E0E0] rounded-lg text-[13px] outline-none focus:border-[#1B5E20] transition-colors duration-150"
        />
        {viewerRole === "state_admin" && (
          <select
            value={lgaFilter2}
            onChange={(e) => {
              setLgaFilter2(e.target.value);
              setWardFilter("");
            }}
            className="px-3.5 py-2.5 border-[1.5px] border-[#E0E0E0] rounded-lg text-[13px] bg-white outline-none cursor-pointer focus:border-[#1B5E20] transition-colors duration-150"
          >
            <option value="">All LGAs</option>
            {VALID_LGAS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        )}
        {wardOptions.length > 0 && (
          <select
            value={wardFilter}
            onChange={(e) => setWardFilter(e.target.value)}
            className="px-3.5 py-2.5 border-[1.5px] border-[#E0E0E0] rounded-lg text-[13px] bg-white outline-none cursor-pointer focus:border-[#1B5E20] transition-colors duration-150"
          >
            <option value="">All Wards</option>
            {wardOptions.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        )}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2.5 border-[1.5px] border-[#E0E0E0] rounded-lg text-[13px] bg-white outline-none cursor-pointer focus:border-[#1B5E20] transition-colors duration-150"
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        {(searchQuery ||
          (lgaFilter2 && viewerRole === "state_admin") ||
          wardFilter ||
          statusFilter) && (
          <button
            onClick={() => {
              setSearchQuery("");
              setLgaFilter2(viewerLGA || "");
              setWardFilter("");
              setStatusFilter("");
            }}
            className="px-3.5 py-2.5 border-[1.5px] border-[#E0E0E0] rounded-lg text-[13px] cursor-pointer bg-[#F5F5F5] text-[#757575]"
          >
            Clear
          </button>
        )}
        <div className="text-[13px] text-[#757575] ml-auto whitespace-nowrap">
          {filtered.length} of {admins.length} agents
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#E0E0E0] overflow-hidden">
        {isLoading ? (
          <SkeletonRows />
        ) : isError ? (
          <div className="p-10 text-center text-red-700 text-sm">
            Failed to load agents. Please refresh.
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            hasFilters={!!(searchQuery || wardFilter || statusFilter)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-[#F5F5F5] border-b-2 border-[#E0E0E0]">
                  {["Agent", "Location", "Status", "Last Login", "Actions"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-[11px] font-bold text-[#757575] tracking-[0.8px] uppercase"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((admin, i) => (
                  <PUAdminRow
                    key={admin.id}
                    admin={admin}
                    isEven={i % 2 === 0}
                    showLGA={viewerRole === "state_admin"}
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
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreatePUAdminModal
          viewerRole={viewerRole}
          lockedLGA={viewerLGA}
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

// ─────────────────────────────────────────
// PU ADMIN ROW
// ─────────────────────────────────────────

function PUAdminRow({ admin, isEven, showLGA, onToggle, onRegen }) {
  const [toggling, setToggling] = useState(false);
  async function handleToggle() {
    setToggling(true);
    await onToggle(!admin.is_active);
    setToggling(false);
  }
  return (
    <tr
      className={`${isEven ? "bg-white" : "bg-[#FAFAFA]"} border-b border-[#E0E0E0] hover:bg-green-50/30 transition-colors duration-100`}
    >
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${admin.is_active ? "bg-[#C8E6C9] text-[#1B5E20]" : "bg-[#EEEEEE] text-[#757575]"}`}
          >
            {admin.full_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-semibold text-[#212121]">
              {admin.full_name}
            </div>
            <div className="text-xs text-[#757575]">{admin.email}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5">
        <div className="flex flex-col gap-1">
          {showLGA && (
            <span className="bg-[#E8F5E9] text-[#1B5E20] px-2 py-0.5 rounded-full text-xs font-semibold inline-block w-fit">
              {admin.lga}
            </span>
          )}
          <span className="text-[13px] text-[#212121] font-medium">
            {admin.ward}
          </span>
          <span className="text-xs text-[#757575] flex items-center gap-1">
            <span>📍</span> {admin.polling_unit}
          </span>
        </div>
      </td>
      <td className="px-4 py-3.5">
        <div className="flex flex-col gap-1">
          <span
            className={`inline-block px-2.5 py-[3px] rounded-full text-[11px] font-bold ${admin.is_active ? "bg-[#E8F5E9] text-[#2E7D32]" : "bg-[#EEEEEE] text-[#757575]"}`}
          >
            {admin.is_active ? "● ACTIVE" : "● INACTIVE"}
          </span>
          {admin.must_change_password && admin.is_active && (
            <span className="bg-[#FFF3E0] text-[#E65100] px-2 py-0.5 rounded-full text-[10px] font-semibold inline-block w-fit">
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
      <td className="px-4 py-3.5">
        <div className="flex gap-2">
          <button
            onClick={onRegen}
            className="px-3 py-1.5 bg-transparent border-[1.5px] border-[#1B5E20] text-[#1B5E20] rounded-md text-xs font-semibold cursor-pointer hover:bg-green-50 transition-colors duration-150"
          >
            🔑 Regen
          </button>
          <button
            onClick={handleToggle}
            disabled={toggling}
            className={`px-3 py-1.5 bg-transparent border-[1.5px] rounded-md text-xs font-semibold transition-colors duration-150 ${toggling ? "cursor-not-allowed opacity-60" : "cursor-pointer"} ${admin.is_active ? "border-red-400 text-red-700 hover:bg-red-50" : "border-[#2E7D32] text-[#2E7D32] hover:bg-green-50"}`}
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

// ─────────────────────────────────────────
// CREATE PU ADMIN MODAL
// ─────────────────────────────────────────

function CreatePUAdminModal({ viewerRole, lockedLGA, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedLGA, setSelectedLGA] = useState(lockedLGA || "");
  const [wards, setWards] = useState([]);
  const [loadingWards, setLoadingWards] = useState(false);
  const [selectedWard, setSelectedWard] = useState("");
  const [pollingUnits, setPollingUnits] = useState([]);

  useEffect(() => {
    if (!selectedLGA) {
      setWards([]);
      setSelectedWard("");
      setPollingUnits([]);
      return;
    }
    setLoadingWards(true);
    fetchLGAWards(selectedLGA).then((data) => {
      setLoadingWards(false);
      if (Array.isArray(data)) {
        const wardList = data.map((w) =>
          typeof w === "string" ? { name: w, polling_units: [] } : w,
        );
        setWards(wardList);
      }
    });
  }, [selectedLGA]);

  useEffect(() => {
    const ward = wards.find((w) => w.name === selectedWard);
    setPollingUnits(ward?.polling_units || []);
  }, [selectedWard, wards]);

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
        title="Add Polling Unit Agent"
        subtitle="A secure password will be auto-generated."
        onClose={onClose}
        width="520px"
      >
        {error && <ErrorBanner message={error} />}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Full Name"
              name="full_name"
              placeholder="e.g. Adebayo Okafor"
              required
            />
            <FormField
              label="Phone Number"
              name="phone"
              type="tel"
              placeholder="+234 800 000 0000"
            />
          </div>
          <FormField
            label="Email Address"
            name="email"
            type="email"
            placeholder="agent@example.com"
            required
          />

          {/* LGA */}
          <div className="mb-4">
            <label className="block text-[13px] font-semibold text-[#212121] mb-2">
              LGA <span className="text-red-600">*</span>
            </label>
            {lockedLGA ? (
              <>
                <input type="hidden" name="lga" value={lockedLGA} />
                <div className="px-3.5 py-2.5 border-[1.5px] border-[#E0E0E0] rounded-lg text-sm bg-[#F5F5F5] text-[#757575] flex items-center gap-2">
                  <span>🔒</span> {lockedLGA}
                </div>
              </>
            ) : (
              <select
                name="lga"
                required
                value={selectedLGA}
                onChange={(e) => setSelectedLGA(e.target.value)}
                className="w-full px-3.5 py-2.5 border-[1.5px] border-[#E0E0E0] rounded-lg text-sm bg-white outline-none focus:border-[#1B5E20] transition-colors duration-150 cursor-pointer"
              >
                <option value="">Select LGA...</option>
                {VALID_LGAS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Ward */}
          <div className="mb-4">
            <label className="block text-[13px] font-semibold text-[#212121] mb-2">
              Ward <span className="text-red-600">*</span>
            </label>
            {loadingWards ? (
              <div className="h-10 bg-[#EEEEEE] rounded-lg animate-pulse" />
            ) : wards.length > 0 ? (
              <select
                name="ward"
                required
                value={selectedWard}
                onChange={(e) => setSelectedWard(e.target.value)}
                disabled={!selectedLGA}
                className="w-full px-3.5 py-2.5 border-[1.5px] border-[#E0E0E0] rounded-lg text-sm bg-white outline-none focus:border-[#1B5E20] transition-colors duration-150 cursor-pointer disabled:opacity-50"
              >
                <option value="">Select ward...</option>
                {wards.map((w) => (
                  <option key={w.name} value={w.name}>
                    {w.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                name="ward"
                required
                placeholder="Enter ward name"
                disabled={!selectedLGA}
                className="w-full px-3.5 py-2.5 border-[1.5px] border-[#E0E0E0] rounded-lg text-sm outline-none focus:border-[#1B5E20] transition-colors duration-150 disabled:opacity-50"
              />
            )}
          </div>

          {/* Polling Unit */}
          <div className="mb-5">
            <label className="block text-[13px] font-semibold text-[#212121] mb-2">
              Polling Unit <span className="text-red-600">*</span>
            </label>
            {pollingUnits.length > 0 ? (
              <select
                name="polling_unit"
                required
                disabled={!selectedWard}
                className="w-full px-3.5 py-2.5 border-[1.5px] border-[#E0E0E0] rounded-lg text-sm bg-white outline-none focus:border-[#1B5E20] transition-colors duration-150 cursor-pointer disabled:opacity-50"
              >
                <option value="">Select polling unit...</option>
                {pollingUnits.map((pu) => (
                  <option key={pu} value={pu}>
                    {pu}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                name="polling_unit"
                required
                placeholder="Enter polling unit name or code"
                disabled={!selectedWard && wards.length > 0}
                className="w-full px-3.5 py-2.5 border-[1.5px] border-[#E0E0E0] rounded-lg text-sm outline-none focus:border-[#1B5E20] transition-colors duration-150 disabled:opacity-50"
              />
            )}
          </div>

          <div className="bg-[#E8F5E9] border border-[#C8E6C9] rounded-lg px-3.5 py-3 mb-6 text-xs text-[#2E7D32] leading-relaxed">
            🔒 A 12-character cryptographically secure password will be
            generated. It will be shown <strong>once</strong> and cannot be
            retrieved again.
          </div>

          <div className="flex gap-3 justify-end">
            <SecondaryButton label="Cancel" onClick={onClose} />
            <PrimaryButton
              label={loading ? "Creating..." : "Create Agent"}
              type="submit"
              disabled={loading}
            />
          </div>
        </form>
      </ModalCard>
    </Overlay>
  );
}

// ─────────────────────────────────────────
// PASSWORD DISPLAY MODAL
// ─────────────────────────────────────────

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
        title={isRegen ? "Password Regenerated" : "Agent Created"}
        subtitle={`Share this password securely with ${adminName}.`}
        width="480px"
        hideClose
      >
        <div className="bg-[#FFF8E1] border border-[#FFE082] rounded-lg px-3.5 py-3 mb-6 flex gap-2.5 items-start">
          <span className="text-[18px]">⚠️</span>
          <div className="text-[13px] text-[#5D4037] leading-relaxed">
            <strong>This password will not be shown again.</strong>
            <br />
            Copy and share it via a secure channel. The agent must change it on
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
            className={`border border-white/30 rounded-lg px-4 py-2 text-white text-[13px] font-semibold cursor-pointer whitespace-nowrap transition-colors duration-200 ${copied ? "bg-[#4CAF50]" : "bg-white/15 hover:bg-white/25"}`}
          >
            {copied ? "✅ Copied!" : "📋 Copy"}
          </button>
        </div>
        <div className="text-[11px] text-[#757575] mb-7 text-center">
          12-character password · Alphanumeric + symbols
        </div>
        <PrimaryButton
          label="I've copied the password — Close"
          onClick={onClose}
          fullWidth
        />
      </ModalCard>
    </Overlay>
  );
}

// ─────────────────────────────────────────
// REGEN CONFIRM MODAL
// ─────────────────────────────────────────

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
            <li>Immediately revoke all their active sessions</li>
            <li>Force them to change password on next login</li>
          </ul>
        </div>
        <div className="text-sm text-[#212121] mb-6">
          Are you sure you want to continue?
        </div>
        <div className="flex gap-3 justify-end">
          <SecondaryButton label="Cancel" onClick={onClose} />
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-6 py-2.5 bg-[#C62828] text-white border-none rounded-lg text-sm font-semibold ${loading ? "cursor-not-allowed opacity-70" : "cursor-pointer hover:bg-red-800"} transition-colors duration-150`}
          >
            {loading ? "Regenerating..." : "Yes, Regenerate"}
          </button>
        </div>
      </ModalCard>
    </Overlay>
  );
}

// ─────────────────────────────────────────
// SHARED PRIMITIVES
// ─────────────────────────────────────────

function Overlay({ children, onClose }) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/55 backdrop-blur-[2px] flex items-center justify-center z-[100] p-6"
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
            className="bg-transparent border-none text-xl cursor-pointer text-[#757575] pl-4 leading-none hover:text-[#212121] transition-colors duration-150"
          >
            ×
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function FormField({ label, name, type = "text", placeholder, required }) {
  return (
    <div className="mb-4">
      <label className="block text-[13px] font-semibold text-[#212121] mb-2">
        {label} {required && <span className="text-red-600">*</span>}
      </label>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        required={required}
        className="w-full px-3.5 py-2.5 border-[1.5px] border-[#E0E0E0] rounded-lg text-sm outline-none focus:border-[#1B5E20] transition-colors duration-150 box-border"
      />
    </div>
  );
}

function PrimaryButton({
  label,
  onClick,
  type = "button",
  disabled,
  fullWidth,
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-6 py-[11px] text-white border-none rounded-lg text-sm font-semibold transition-colors duration-150 ${disabled ? "bg-[#A5D6A7] cursor-not-allowed" : "bg-[#1B5E20] hover:bg-[#2E7D32] cursor-pointer"} ${fullWidth ? "w-full" : ""}`}
    >
      {label}
    </button>
  );
}

function SecondaryButton({ label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-6 py-[11px] bg-white hover:bg-[#F5F5F5] text-[#212121] border-[1.5px] border-[#E0E0E0] rounded-lg text-sm font-medium cursor-pointer transition-colors duration-150"
    >
      {label}
    </button>
  );
}

function ErrorBanner({ message }) {
  return (
    <div className="bg-[#FFEBEE] border border-[#FFCDD2] rounded-lg px-3.5 py-3 mb-5 text-[13px] text-[#C62828]">
      ⚠️ {message}
    </div>
  );
}

function SkeletonRows() {
  return (
    <div className="p-6 space-y-2">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="h-[60px] bg-[#F5F5F5] rounded-lg animate-pulse"
        />
      ))}
    </div>
  );
}

function EmptyState({ hasFilters }) {
  return (
    <div className="px-6 py-[60px] text-center">
      <div className="text-[40px] mb-4">📍</div>
      <div className="text-base font-semibold text-[#212121] mb-2">
        {hasFilters
          ? "No agents match your filters"
          : "No Polling Unit Agents yet"}
      </div>
      <div className="text-[13px] text-[#757575]">
        {hasFilters
          ? "Try adjusting your search or filter criteria."
          : 'Click "Add PU Agent" to register the first agent.'}
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
    hour: "2-digit",
    minute: "2-digit",
  });
}
