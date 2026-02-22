"use client";

import { useState } from "react";
import {
  useElections,
  useCreateElection,
  useUpdateElectionStatus,
  useToggleElectionPublic,
  useCandidates,
  useAddCandidate,
  useDeleteCandidate,
} from "@/hooks/use-elections";

const ELECTION_TYPES = [
  { value: "senatorial", label: "Senatorial" },
  { value: "house_of_reps", label: "House of Representatives" },
  { value: "governorship", label: "Governorship" },
  { value: "local_government", label: "Local Government" },
];

const STATUS_CONFIG = {
  upcoming: {
    label: "Upcoming",
    className: "bg-blue-50 text-blue-800",
    next: "active",
    nextLabel: "Mark Active",
    btnClass: "bg-blue-700 hover:bg-blue-800",
  },
  active: {
    label: "Active",
    className: "bg-green-50 text-green-800",
    next: "concluded",
    nextLabel: "Mark Concluded",
    btnClass: "bg-[#1B5E20] hover:bg-[#2E7D32]",
  },
  concluded: {
    label: "Concluded",
    className: "bg-gray-100 text-gray-600",
    next: null,
    nextLabel: null,
    btnClass: "",
  },
};

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

const PARTY_STYLES = {
  APC: "bg-blue-50 text-blue-800",
  PDP: "bg-red-50 text-red-800",
  LP: "bg-yellow-50 text-yellow-800",
  ADC: "bg-purple-50 text-purple-800",
  NNPP: "bg-green-50 text-green-800",
  SDP: "bg-orange-50 text-orange-800",
};

function partyClass(party) {
  return PARTY_STYLES[party?.toUpperCase()] || "bg-gray-100 text-gray-600";
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatType(type) {
  return (
    {
      senatorial: "Senatorial",
      house_of_reps: "House of Reps",
      governorship: "Governorship",
      local_government: "Local Government",
    }[type] || type
  );
}

// ─────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────

export default function ElectionsPage() {
  const { data: elections = [], isLoading } = useElections();
  const [selectedId, setSelectedId] = useState(null);
  const [showRegister, setShowRegister] = useState(false);
  const [showAddCandidate, setShowAddCandidate] = useState(false);
  const [statusError, setStatusError] = useState("");

  const updateStatus = useUpdateElectionStatus();
  const togglePublic = useToggleElectionPublic();
  const selected = elections.find((e) => e.id === selectedId) || null;

  async function handleStatusChange(election) {
    const cfg = STATUS_CONFIG[election.status];
    if (!cfg.next) return;
    setStatusError("");
    const result = await updateStatus.mutateAsync({
      electionId: election.id,
      status: cfg.next,
    });
    if (result?.error) setStatusError(result.error);
  }

  return (
    <div className="p-8 font-[Poppins,sans-serif] text-[#212121]">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="font-[Montserrat,sans-serif] text-[26px] font-extrabold text-[#1B5E20] mb-1.5">
            Elections
          </h1>
          <p className="text-sm text-text-gray">
            Register election contexts and add the candidates whose results are
            being tracked
          </p>
        </div>
        <button
          onClick={() => setShowRegister(true)}
          className="flex items-center gap-2 bg-[#1B5E20] hover:bg-[#2E7D32] text-white px-5 py-3 rounded-xl text-sm font-semibold transition-colors duration-150 cursor-pointer border-none"
        >
          <span className="text-lg leading-none">+</span> Register Election
        </button>
      </div>

      {statusError && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-5 text-[13px] text-red-800 flex items-center gap-2">
          ⚠️ {statusError}
        </div>
      )}

      {/* Two-panel layout */}
      <div className="grid grid-cols-[340px_1fr] gap-5 items-start">
        {/* Election list */}
        <div className="bg-white rounded-xl border border-[#E0E0E0] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E0E0E0] text-[11px] font-bold text-text-gray tracking-widest uppercase">
            {elections.length} Election{elections.length !== 1 ? "s" : ""}{" "}
            Registered
          </div>

          {isLoading ? (
            <SkeletonList />
          ) : elections.length === 0 ? (
            <div className="py-10 px-5 text-center text-text-gray text-[13px]">
              <div className="text-3xl mb-2.5">🗳️</div>
              No elections registered yet.
              <br />
              Click "Register Election" to begin.
            </div>
          ) : (
            elections.map((election) => {
              const cfg = STATUS_CONFIG[election.status];
              const isSelected = election.id === selectedId;
              return (
                <div
                  key={election.id}
                  onClick={() => setSelectedId(isSelected ? null : election.id)}
                  className={`px-5 py-4 border-b border-[#E0E0E0] cursor-pointer transition-all duration-150 border-l-[3px]
                    ${isSelected ? "bg-green-50 border-l-[#1B5E20]" : "bg-white border-l-transparent hover:bg-gray-50"}`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-[#212121] mb-1 truncate">
                        {election.title}
                      </div>
                      <div className="text-xs text-text-gray">
                        {formatType(election.election_type)} ·{" "}
                        {formatDate(election.election_date)}
                      </div>
                    </div>
                    <span
                      className={`${cfg.className} px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap shrink-0`}
                    >
                      {cfg.label}
                    </span>
                  </div>
                  {election.is_public && (
                    <div className="mt-1.5 text-[11px] text-[#2E7D32] font-semibold">
                      🌐 Publicly visible
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Detail panel */}
        {selected ? (
          <ElectionDetail
            election={selected}
            onStatusChange={() => handleStatusChange(selected)}
            onTogglePublic={(v) =>
              togglePublic.mutate({ electionId: selected.id, isPublic: v })
            }
            onAddCandidate={() => setShowAddCandidate(true)}
            showAddCandidate={showAddCandidate}
            onCloseAddCandidate={() => setShowAddCandidate(false)}
          />
        ) : (
          <div className="bg-white rounded-xl border border-dashed border-[#E0E0E0] p-16 text-center text-text-gray">
            <div className="text-4xl mb-3">👈</div>
            <div className="text-sm font-semibold">
              Select an election to view details
            </div>
            <div className="text-[13px] mt-1">
              You can manage candidates and change status from here
            </div>
          </div>
        )}
      </div>

      {showRegister && (
        <RegisterElectionModal
          onClose={() => setShowRegister(false)}
          onSuccess={(election) => {
            setShowRegister(false);
            setSelectedId(election.id);
          }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// ELECTION DETAIL PANEL
// ─────────────────────────────────────────

function ElectionDetail({
  election,
  onStatusChange,
  onTogglePublic,
  onAddCandidate,
  showAddCandidate,
  onCloseAddCandidate,
}) {
  const { data: candidates = [], isLoading } = useCandidates(election.id);
  const deleteCandidate = useDeleteCandidate();
  const cfg = STATUS_CONFIG[election.status];
  const [deleteError, setDeleteError] = useState("");

  async function handleDelete(candidate) {
    setDeleteError("");
    try {
      await deleteCandidate.mutateAsync({
        candidateId: candidate.id,
        electionId: election.id,
      });
    } catch (err) {
      setDeleteError(err.message);
    }
  }

  return (
    <div className="space-y-5">
      {/* Election info card */}
      <div className="bg-white rounded-xl border border-[#E0E0E0] p-7">
        <div className="flex justify-between items-start mb-5">
          <div>
            <h2 className="font-[Montserrat,sans-serif] text-xl font-extrabold text-[#1B5E20] mb-1.5">
              {election.title}
            </h2>
            <p className="text-[13px] text-text-gray">
              {formatType(election.election_type)} ·{" "}
              {formatDate(election.election_date)}
            </p>
          </div>
          <span
            className={`${cfg.className} px-3 py-1.5 rounded-full text-xs font-bold`}
          >
            ● {cfg.label.toUpperCase()}
          </span>
        </div>

        {/* Meta grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <MetaItem
            label="Election Date"
            value={formatDate(election.election_date)}
          />
          <MetaItem label="Type" value={formatType(election.election_type)} />
          <MetaItem
            label="Registered"
            value={formatDate(election.created_at)}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 flex-wrap items-center pt-5 border-t border-[#E0E0E0]">
          {cfg.next && (
            <button
              onClick={onStatusChange}
              className={`${cfg.btnClass} text-white px-5 py-2.5 rounded-lg text-[13px] font-semibold border-none cursor-pointer transition-colors duration-150`}
            >
              {cfg.next === "active" ? "▶ Mark Active" : "✅ Mark Concluded"}
            </button>
          )}

          {election.status === "concluded" && (
            <button
              onClick={() => onTogglePublic(!election.is_public)}
              className={`px-5 py-2.5 rounded-lg text-[13px] font-semibold border cursor-pointer transition-colors duration-150
                ${
                  election.is_public
                    ? "bg-gray-100 text-[#212121] border-[#E0E0E0] hover:bg-gray-200"
                    : "bg-[#1B5E20] text-white border-[#1B5E20] hover:bg-[#2E7D32]"
                }`}
            >
              {election.is_public ? "🔒 Make Private" : "🌐 Make Public"}
            </button>
          )}

          {election.status === "concluded" && (
            <span className="text-xs text-text-gray italic">
              Concluded — no new results or candidates can be added
            </span>
          )}
        </div>
      </div>

      {/* Candidate management */}
      <div className="bg-white rounded-xl border border-[#E0E0E0] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E0E0E0] flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="font-[Montserrat,sans-serif] text-[15px] font-bold text-[#1B5E20]">
              Candidates
            </span>
            <span className="bg-[#C8E6C9] text-[#1B5E20] px-2.5 py-0.5 rounded-full text-xs font-semibold">
              {candidates.length}
            </span>
          </div>
          {election.status !== "concluded" && (
            <button
              onClick={onAddCandidate}
              className="bg-[#1B5E20] hover:bg-[#2E7D32] text-white px-4 py-2 rounded-lg text-[13px] font-semibold border-none cursor-pointer transition-colors duration-150"
            >
              + Add Candidate
            </button>
          )}
        </div>

        {deleteError && (
          <div className="px-6 py-3 bg-red-50 border-b border-red-200 text-[13px] text-red-800">
            ⚠️ {deleteError}
          </div>
        )}

        {isLoading ? (
          <SkeletonList rows={3} />
        ) : candidates.length === 0 ? (
          <div className="py-10 text-center text-text-gray text-[13px]">
            <div className="text-3xl mb-2.5">👤</div>
            No candidates added yet.
            {election.status !== "concluded" && (
              <>
                {" "}
                Click <strong>"Add Candidate"</strong> to register participants.
              </>
            )}
          </div>
        ) : (
          <div className="py-2">
            {candidates.map((candidate) => (
              <CandidateRow
                key={candidate.id}
                candidate={candidate}
                canDelete={election.status !== "concluded"}
                onDelete={() => handleDelete(candidate)}
              />
            ))}
          </div>
        )}
      </div>

      {showAddCandidate && (
        <AddCandidateModal election={election} onClose={onCloseAddCandidate} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// CANDIDATE ROW
// ─────────────────────────────────────────

function CandidateRow({ candidate, canDelete, onDelete }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleConfirmDelete() {
    setDeleting(true);
    await onDelete();
    setDeleting(false);
    setConfirming(false);
  }

  const initials = candidate.full_name.charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-4 px-6 py-3.5 border-b border-[#E0E0E0] last:border-b-0">
      {/* Avatar */}
      <div
        className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold shrink-0 overflow-hidden ${partyClass(candidate.party)}`}
      >
        {candidate.photo_url ? (
          <img
            src={candidate.photo_url}
            alt={candidate.full_name}
            className="w-full h-full object-cover"
          />
        ) : (
          initials
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-[#212121]">
          {candidate.full_name}
        </div>
        <div className="flex gap-2 flex-wrap mt-0.5 items-center">
          <span
            className={`${partyClass(candidate.party)} px-2 py-0.5 rounded text-[11px] font-bold`}
          >
            {candidate.party}
          </span>
          {candidate.position && (
            <span className="text-xs text-text-gray">{candidate.position}</span>
          )}
          {candidate.lga && (
            <span className="text-xs text-text-gray">· {candidate.lga}</span>
          )}
        </div>
      </div>

      {/* Delete */}
      {canDelete &&
        (confirming ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-red-700">Remove?</span>
            <button
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="px-3 py-1 bg-red-700 hover:bg-red-800 text-white rounded text-xs font-semibold border-none cursor-pointer transition-colors duration-150 disabled:opacity-60"
            >
              {deleting ? "..." : "Yes"}
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-[#212121] rounded text-xs font-semibold border-none cursor-pointer transition-colors duration-150"
            >
              No
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="px-3 py-1.5 bg-transparent border border-[#E0E0E0] hover:border-red-300 hover:text-red-700 rounded text-xs text-text-gray cursor-pointer transition-all duration-150"
          >
            Remove
          </button>
        ))}
    </div>
  );
}

// ─────────────────────────────────────────
// REGISTER ELECTION MODAL
// ─────────────────────────────────────────

function RegisterElectionModal({ onClose, onSuccess }) {
  const createElection = useCreateElection();
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    try {
      const result = await createElection.mutateAsync({
        title: fd.get("title"),
        election_type: fd.get("election_type"),
        election_date: fd.get("election_date"),
        status: fd.get("status"),
      });
      onSuccess(result.election);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <Overlay onClose={onClose}>
      <ModalCard
        title="Register Election"
        subtitle="Record the election details so results can be submitted against it."
        onClose={onClose}
        width="max-w-lg"
      >
        {error && <ErrorBanner message={error} />}

        <div className="bg-green-50 border border-[#C8E6C9] rounded-lg px-3.5 py-3 mb-6 text-xs text-[#2E7D32] leading-relaxed">
          ℹ️ This registers the election in the system so LGA Admins can submit
          results. It does not create or schedule the election itself.
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <FormField
            label="Election Title"
            name="title"
            placeholder="e.g. 2027 Oyo South Senatorial Election"
            required
          />

          <div>
            <label className="block text-[13px] font-semibold text-[#212121] mb-2">
              Election Type <span className="text-red-600">*</span>
            </label>
            <select
              name="election_type"
              required
              className="w-full px-3.5 py-2.5 border-[1.5px] border-[#E0E0E0] rounded-lg text-sm bg-white outline-none focus:border-[#1B5E20] transition-colors duration-150 cursor-pointer"
            >
              <option value="">Select type...</option>
              {ELECTION_TYPES.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <FormField
            label="Election Date"
            name="election_date"
            type="date"
            required
          />

          <div>
            <label className="block text-[13px] font-semibold text-[#212121] mb-2">
              Initial Status <span className="text-red-600">*</span>
            </label>
            <select
              name="status"
              defaultValue="upcoming"
              className="w-full px-3.5 py-2.5 border-[1.5px] border-[#E0E0E0] rounded-lg text-sm bg-white outline-none focus:border-[#1B5E20] transition-colors duration-150 cursor-pointer"
            >
              <option value="upcoming">
                Upcoming — results collection not yet open
              </option>
              <option value="active">
                Active — LGA Admins can submit results now
              </option>
            </select>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <SecondaryButton label="Cancel" onClick={onClose} />
            <PrimaryButton
              label={
                createElection.isPending
                  ? "Registering..."
                  : "Register Election"
              }
              type="submit"
              disabled={createElection.isPending}
            />
          </div>
        </form>
      </ModalCard>
    </Overlay>
  );
}

// ─────────────────────────────────────────
// ADD CANDIDATE MODAL
// ─────────────────────────────────────────

function AddCandidateModal({ election, onClose }) {
  const addCandidate = useAddCandidate();
  const [error, setError] = useState("");
  const [photoPreview, setPhotoPreview] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    const photoFile = fd.get("photo");
    try {
      await addCandidate.mutateAsync({
        electionId: election.id,
        full_name: fd.get("full_name"),
        party: fd.get("party"),
        position: fd.get("position"),
        lga: fd.get("lga") || null,
        photoFile: photoFile?.size > 0 ? photoFile : null,
      });
      onClose();
    } catch (err) {
      setError(err.message);
    }
  }

  function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return setPhotoPreview(null);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);
  }

  return (
    <Overlay onClose={onClose}>
      <ModalCard
        title="Add Candidate"
        subtitle={`Adding to: ${election.title}`}
        onClose={onClose}
        width="max-w-xl"
      >
        {error && <ErrorBanner message={error} />}

        <form
          onSubmit={handleSubmit}
          encType="multipart/form-data"
          className="space-y-5"
        >
          <FormField
            label="Full Name"
            name="full_name"
            placeholder="e.g. Adewale Olusanya"
            required
          />
          <FormField
            label="Party Abbreviation"
            name="party"
            placeholder="e.g. APC, PDP, LP"
            required
          />
          <FormField
            label="Position / Seat Contested"
            name="position"
            placeholder="e.g. Senator, Oyo South"
            required
          />

          <div>
            <label className="block text-[13px] font-semibold text-[#212121] mb-2">
              LGA (if applicable)
            </label>
            <select
              name="lga"
              className="w-full px-3.5 py-2.5 border-[1.5px] border-[#E0E0E0] rounded-lg text-sm bg-white outline-none focus:border-[#1B5E20] transition-colors duration-150 cursor-pointer"
            >
              <option value="">Not applicable</option>
              {VALID_LGAS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          {/* Photo upload */}
          <div>
            <label className="block text-[13px] font-semibold text-[#212121] mb-2">
              Candidate Photo (optional)
            </label>
            <div className="flex items-center gap-4">
              {photoPreview && (
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#C8E6C9] shrink-0">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <input
                type="file"
                name="photo"
                accept="image/jpeg,image/png"
                onChange={handlePhotoChange}
                className="text-[13px] flex-1"
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <SecondaryButton label="Cancel" onClick={onClose} />
            <PrimaryButton
              label={addCandidate.isPending ? "Adding..." : "Add Candidate"}
              type="submit"
              disabled={addCandidate.isPending}
            />
          </div>
        </form>
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
      className="fixed inset-0 bg-black/55 backdrop-blur-sm flex items-center justify-center z-50 p-6"
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

function ModalCard({ title, subtitle, children, onClose, width = "max-w-lg" }) {
  return (
    <div className={`bg-white rounded-2xl p-9 w-full ${width} shadow-2xl`}>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="font-[Montserrat,sans-serif] text-xl font-extrabold text-[#1B5E20] mb-1">
            {title}
          </h2>
          {subtitle && <p className="text-[13px] text-text-gray">{subtitle}</p>}
        </div>
        <button
          onClick={onClose}
          className="text-xl text-text-gray hover:text-[#212121] bg-transparent border-none cursor-pointer pl-4 transition-colors duration-150"
        >
          ×
        </button>
      </div>
      {children}
    </div>
  );
}

function MetaItem({ label, value }) {
  return (
    <div className="bg-[#F5F5F5] rounded-lg px-3.5 py-3">
      <div className="text-[11px] text-text-gray font-semibold mb-1 uppercase tracking-wide">
        {label}
      </div>
      <div className="text-sm font-semibold text-[#212121]">{value}</div>
    </div>
  );
}

function FormField({ label, name, type = "text", placeholder, required }) {
  return (
    <div>
      <label className="block text-[13px] font-semibold text-[#212121] mb-2">
        {label} {required && <span className="text-red-600">*</span>}
      </label>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        required={required}
        className="w-full px-3.5 py-2.5 border-[1.5px] border-[#E0E0E0] rounded-lg text-sm outline-none transition-colors duration-150 focus:border-[#1B5E20] focus:ring-2 focus:ring-[#1B5E20]/10"
      />
    </div>
  );
}

function ErrorBanner({ message }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg px-3.5 py-3 mb-5 text-[13px] text-red-800 flex items-center gap-2">
      ⚠️ {message}
    </div>
  );
}

function PrimaryButton({ label, onClick, type = "button", disabled }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="px-6 py-2.5 bg-[#1B5E20] hover:bg-[#2E7D32] disabled:bg-[#A5D6A7] text-white rounded-lg text-sm font-semibold border-none cursor-pointer disabled:cursor-not-allowed transition-colors duration-150"
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
      className="px-6 py-2.5 bg-white hover:bg-gray-50 text-[#212121] border border-[#E0E0E0] rounded-lg text-sm font-medium cursor-pointer transition-colors duration-150"
    >
      {label}
    </button>
  );
}

function SkeletonList({ rows = 4 }) {
  return (
    <div className="p-4 space-y-2">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
      ))}
    </div>
  );
}
