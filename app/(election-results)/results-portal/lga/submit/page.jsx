"use client";

/**
 * app/results/lga/submit/page.jsx
 * LGA Admin — Result Submission Form
 *
 * Steps:
 *   1. Select election + location (ward, polling unit)
 *   2. Enter votes per candidate + voter counts
 *   3. Upload result sheet image + add notes
 *   4. Review & confirm
 *   5. Success screen
 */

import { useState, useMemo } from "react";
import {
  useActiveElections,
  useElectionCandidates,
  useLGAWards,
  useSubmitResult,
} from "@/hooks/use-election-results";

const C = {
  primary: "#1B5E20",
  secondary: "#2E7D32",
  accent: "#4CAF50",
  light: "#C8E6C9",
  text: "#212121",
  gray: "#757575",
  border: "#E0E0E0",
  bg: "#F5F5F5",
  white: "#FFFFFF",
  danger: "#C62828",
  dangerBg: "#FFEBEE",
};

const STEPS = ["Location", "Votes", "Evidence", "Review"];

// ─────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────

export default function SubmitResultPage({ searchParams }) {
  // lga comes from session (injected via header in layout)
  // For client component, we read it from a data attribute set by layout
  const lga =
    typeof document !== "undefined"
      ? document.documentElement.dataset.ermsLga || ""
      : "";

  const [step, setStep] = useState(0); // 0-3, then success
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState("");

  // Form state
  const [electionId, setElectionId] = useState("");
  const [ward, setWard] = useState("");
  const [pollingUnit, setPollingUnit] = useState("");
  const [candidateVotes, setCandidateVotes] = useState({}); // { candidateId: votes }
  const [accreditedVoters, setAccreditedVoters] = useState("");
  const [registeredVoters, setRegisteredVoters] = useState("");
  const [notes, setNotes] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Data fetching
  const { data: elections = [], isLoading: loadingElections } =
    useActiveElections();
  const { data: candidates = [], isLoading: loadingCandidates } =
    useElectionCandidates(electionId);
  const { data: wardsData = [], isLoading: loadingWards } = useLGAWards(lga);

  const submitResult = useSubmitResult();

  // Derived
  const selectedElection = elections.find((e) => e.id === electionId);
  const wardOptions = wardsData.map((w) =>
    typeof w === "string" ? { name: w, polling_units: [] } : w,
  );
  const selectedWard = wardOptions.find((w) => w.name === ward);
  const pollingUnits = selectedWard?.polling_units || [];

  const totalVotes = Object.values(candidateVotes).reduce(
    (sum, v) => sum + (Number(v) || 0),
    0,
  );
  const overVote =
    Number(accreditedVoters) > 0 && totalVotes > Number(accreditedVoters);

  // Step validation
  const step0Valid = electionId && ward && pollingUnit;
  const step1Valid =
    candidates.length > 0 &&
    candidates.every(
      (c) => candidateVotes[c.id] !== undefined && candidateVotes[c.id] >= 0,
    ) &&
    accreditedVoters !== "" &&
    registeredVoters !== "" &&
    !overVote;
  const step2Valid = true; // image + notes are optional
  const stepValid = [step0Valid, step1Valid, step2Valid, true];

  function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) {
      setImageFile(null);
      setImagePreview(null);
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  }

  function handleVoteChange(candidateId, value) {
    setCandidateVotes((prev) => ({
      ...prev,
      [candidateId]: value === "" ? "" : Math.max(0, parseInt(value) || 0),
    }));
  }

  async function handleSubmit() {
    setError("");
    try {
      const result = await submitResult.mutateAsync({
        electionId,
        ward,
        pollingUnit,
        candidateVotes: candidates.map((c) => ({
          candidateId: c.id,
          votes: Number(candidateVotes[c.id] || 0),
        })),
        accreditedVoters: Number(accreditedVoters),
        registeredVoters: Number(registeredVoters),
        notes,
        imageFile,
      });
      setSuccess(result);
    } catch (err) {
      setError(err.message);
    }
  }

  function reset() {
    setStep(0);
    setSuccess(null);
    setError("");
    setElectionId("");
    setWard("");
    setPollingUnit("");
    setCandidateVotes({});
    setAccreditedVoters("");
    setRegisteredVoters("");
    setNotes("");
    setImageFile(null);
    setImagePreview(null);
  }

  // ── Success screen ───────────────────────
  if (success) {
    return <SuccessScreen result={success} onAnother={reset} />;
  }

  return (
    <div
      style={{
        fontFamily: "Poppins, sans-serif",
        color: C.text,
        maxWidth: "720px",
      }}
    >
      {/* Page header */}
      <div style={{ marginBottom: "32px" }}>
        <h1
          style={{
            fontFamily: "Montserrat, sans-serif",
            fontSize: "26px",
            fontWeight: 800,
            color: C.primary,
            margin: "0 0 6px",
          }}
        >
          Submit Results
        </h1>
        <p style={{ color: C.gray, fontSize: "14px", margin: 0 }}>
          {lga ? (
            <>
              <strong style={{ color: C.primary }}>{lga}</strong> · Enter
              polling unit results accurately
            </>
          ) : (
            "Loading your LGA..."
          )}
        </p>
      </div>

      {/* Stepper */}
      <StepIndicator steps={STEPS} current={step} />

      {/* Error banner */}
      {error && (
        <div
          style={{
            background: C.dangerBg,
            border: `1px solid #FFCDD2`,
            borderRadius: "10px",
            padding: "14px 16px",
            marginBottom: "20px",
            fontSize: "13px",
            color: C.danger,
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* Form card */}
      <div
        style={{
          background: C.white,
          borderRadius: "14px",
          border: `1px solid ${C.border}`,
          padding: "32px",
          marginTop: "24px",
        }}
      >
        {/* ── STEP 0: Location ───────────── */}
        {step === 0 && (
          <StepLocation
            elections={elections}
            loadingElections={loadingElections}
            electionId={electionId}
            onElectionChange={(id) => {
              setElectionId(id);
              setWard("");
              setPollingUnit("");
              setCandidateVotes({});
            }}
            wardOptions={wardOptions}
            loadingWards={loadingWards}
            lga={lga}
            ward={ward}
            onWardChange={(w) => {
              setWard(w);
              setPollingUnit("");
            }}
            pollingUnits={pollingUnits}
            pollingUnit={pollingUnit}
            onPollingUnitChange={setPollingUnit}
          />
        )}

        {/* ── STEP 1: Votes ──────────────── */}
        {step === 1 && (
          <StepVotes
            candidates={candidates}
            loadingCandidates={loadingCandidates}
            candidateVotes={candidateVotes}
            onVoteChange={handleVoteChange}
            accreditedVoters={accreditedVoters}
            onAccreditedChange={setAccreditedVoters}
            registeredVoters={registeredVoters}
            onRegisteredChange={setRegisteredVoters}
            totalVotes={totalVotes}
            overVote={overVote}
          />
        )}

        {/* ── STEP 2: Evidence ───────────── */}
        {step === 2 && (
          <StepEvidence
            imageFile={imageFile}
            imagePreview={imagePreview}
            onImageChange={handleImageChange}
            notes={notes}
            onNotesChange={setNotes}
          />
        )}

        {/* ── STEP 3: Review ─────────────── */}
        {step === 3 && (
          <StepReview
            election={selectedElection}
            lga={lga}
            ward={ward}
            pollingUnit={pollingUnit}
            candidates={candidates}
            candidateVotes={candidateVotes}
            accreditedVoters={accreditedVoters}
            registeredVoters={registeredVoters}
            totalVotes={totalVotes}
            imageFile={imageFile}
            notes={notes}
          />
        )}

        {/* Navigation */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "32px",
            paddingTop: "24px",
            borderTop: `1px solid ${C.border}`,
          }}
        >
          <button
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
            style={{
              padding: "12px 24px",
              background: step === 0 ? "#EEE" : C.white,
              color: step === 0 ? "#BDBDBD" : C.text,
              border: `1.5px solid ${step === 0 ? "#EEE" : C.border}`,
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 500,
              cursor: step === 0 ? "not-allowed" : "pointer",
              fontFamily: "Poppins, sans-serif",
            }}
          >
            ← Back
          </button>

          {step < 3 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!stepValid[step]}
              style={{
                padding: "12px 28px",
                background: stepValid[step] ? C.primary : "#A5D6A7",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: stepValid[step] ? "pointer" : "not-allowed",
                fontFamily: "Poppins, sans-serif",
              }}
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitResult.isPending}
              style={{
                padding: "12px 32px",
                background: submitResult.isPending ? "#A5D6A7" : C.primary,
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 700,
                cursor: submitResult.isPending ? "not-allowed" : "pointer",
                fontFamily: "Poppins, sans-serif",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              {submitResult.isPending
                ? "⏳ Submitting..."
                : "✅ Submit Results"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// STEP 0 — Location Selection
// ─────────────────────────────────────────

function StepLocation({
  elections,
  loadingElections,
  electionId,
  onElectionChange,
  wardOptions,
  loadingWards,
  lga,
  ward,
  onWardChange,
  pollingUnits,
  pollingUnit,
  onPollingUnitChange,
}) {
  return (
    <div>
      <StepTitle
        title="Select Location"
        subtitle="Choose the election and polling unit you are submitting results for."
      />

      {/* LGA badge */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          background: "#E8F5E9",
          border: `1px solid ${C.light}`,
          borderRadius: "8px",
          padding: "8px 14px",
          marginBottom: "24px",
        }}
      >
        <span style={{ fontSize: "16px" }}>📍</span>
        <span style={{ fontSize: "13px", fontWeight: 700, color: C.primary }}>
          Your LGA: {lga}
        </span>
      </div>

      {/* Election */}
      <div style={{ marginBottom: "20px" }}>
        <label style={labelStyle}>
          Election <Required />
        </label>
        {loadingElections ? (
          <Skeleton h={44} />
        ) : elections.length === 0 ? (
          <div
            style={{
              padding: "14px",
              background: "#FFF8E1",
              border: "1px solid #FFE082",
              borderRadius: "8px",
              fontSize: "13px",
              color: "#5D4037",
            }}
          >
            ⚠️ No active elections at the moment. Contact the State Admin.
          </div>
        ) : (
          <select
            value={electionId}
            onChange={(e) => onElectionChange(e.target.value)}
            required
            style={selectStyle}
          >
            <option value="">Select election...</option>
            {elections.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Ward */}
      <div style={{ marginBottom: "20px" }}>
        <label style={labelStyle}>
          Ward <Required />
        </label>
        {loadingWards ? (
          <Skeleton h={44} />
        ) : wardOptions.length === 0 && electionId ? (
          <input
            type="text"
            value={ward}
            onChange={(e) => onWardChange(e.target.value)}
            placeholder="Enter ward name manually"
            style={inputStyle}
          />
        ) : (
          <select
            value={ward}
            onChange={(e) => onWardChange(e.target.value)}
            disabled={!electionId}
            style={{ ...selectStyle, opacity: !electionId ? 0.5 : 1 }}
          >
            <option value="">Select ward...</option>
            {wardOptions.map((w) => (
              <option key={w.name || w} value={w.name || w}>
                {w.name || w}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Polling Unit */}
      <div style={{ marginBottom: "4px" }}>
        <label style={labelStyle}>
          Polling Unit <Required />
        </label>
        {pollingUnits.length > 0 ? (
          <select
            value={pollingUnit}
            onChange={(e) => onPollingUnitChange(e.target.value)}
            disabled={!ward}
            style={{ ...selectStyle, opacity: !ward ? 0.5 : 1 }}
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
            value={pollingUnit}
            onChange={(e) => onPollingUnitChange(e.target.value)}
            placeholder="Enter polling unit name or code"
            disabled={!ward}
            style={{ ...inputStyle, opacity: !ward ? 0.5 : 1 }}
          />
        )}
        <div style={{ fontSize: "11px", color: C.gray, marginTop: "6px" }}>
          Enter the exact name or code as shown on the official result sheet.
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// STEP 1 — Votes
// ─────────────────────────────────────────

function StepVotes({
  candidates,
  loadingCandidates,
  candidateVotes,
  onVoteChange,
  accreditedVoters,
  onAccreditedChange,
  registeredVoters,
  onRegisteredChange,
  totalVotes,
  overVote,
}) {
  return (
    <div>
      <StepTitle
        title="Enter Vote Counts"
        subtitle="Record the exact votes as shown on the official result sheet."
      />

      {loadingCandidates ? (
        <div style={{ marginBottom: "24px" }}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} h={64} mb={12} />
          ))}
        </div>
      ) : candidates.length === 0 ? (
        <div
          style={{
            padding: "20px",
            background: "#FFF8E1",
            borderRadius: "8px",
            fontSize: "13px",
            color: "#5D4037",
            marginBottom: "24px",
          }}
        >
          ⚠️ No candidates found for this election. Contact the State Admin.
        </div>
      ) : (
        <div style={{ marginBottom: "28px" }}>
          {/* Candidate vote inputs */}
          {candidates.map((candidate) => (
            <div
              key={candidate.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                padding: "16px",
                border: `1.5px solid ${C.border}`,
                borderRadius: "10px",
                marginBottom: "10px",
                background:
                  candidateVotes[candidate.id] > 0 ? "#F1F8E9" : C.white,
                transition: "background 0.2s",
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: "#E8F5E9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  color: C.primary,
                  fontSize: "14px",
                  flexShrink: 0,
                  overflow: "hidden",
                }}
              >
                {candidate.photo_url ? (
                  <img
                    src={candidate.photo_url}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  candidate.full_name.charAt(0)
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{ fontSize: "14px", fontWeight: 600, color: C.text }}
                >
                  {candidate.full_name}
                </div>
                <div style={{ fontSize: "12px" }}>
                  <PartyBadge party={candidate.party} />
                  {candidate.position && (
                    <span style={{ color: C.gray, marginLeft: "6px" }}>
                      {candidate.position}
                    </span>
                  )}
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  flexShrink: 0,
                }}
              >
                <label
                  style={{ fontSize: "12px", color: C.gray, fontWeight: 600 }}
                >
                  Votes
                </label>
                <input
                  type="number"
                  min="0"
                  value={candidateVotes[candidate.id] ?? ""}
                  onChange={(e) => onVoteChange(candidate.id, e.target.value)}
                  placeholder="0"
                  style={{
                    width: "90px",
                    padding: "10px 12px",
                    border: `1.5px solid ${C.border}`,
                    borderRadius: "8px",
                    fontSize: "18px",
                    fontWeight: 700,
                    textAlign: "center",
                    fontFamily: "Montserrat, sans-serif",
                    outline: "none",
                    color: C.primary,
                  }}
                  onFocus={(e) => (e.target.style.borderColor = C.primary)}
                  onBlur={(e) => (e.target.style.borderColor = C.border)}
                />
              </div>
            </div>
          ))}

          {/* Running total */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 16px",
              background: overVote ? C.dangerBg : "#F1F8E9",
              border: `1px solid ${overVote ? "#FFCDD2" : C.light}`,
              borderRadius: "8px",
              marginTop: "8px",
            }}
          >
            <span
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: overVote ? C.danger : C.primary,
              }}
            >
              Total Votes Cast
            </span>
            <span
              style={{
                fontSize: "20px",
                fontWeight: 800,
                color: overVote ? C.danger : C.primary,
                fontFamily: "Montserrat, sans-serif",
              }}
            >
              {totalVotes.toLocaleString()}
            </span>
          </div>
          {overVote && (
            <div
              style={{
                fontSize: "12px",
                color: C.danger,
                marginTop: "6px",
                fontWeight: 600,
              }}
            >
              ⚠️ Total votes ({totalVotes}) exceeds accredited voters (
              {accreditedVoters}). Please recheck.
            </div>
          )}
        </div>
      )}

      {/* Voter counts */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "16px",
          paddingTop: "20px",
          borderTop: `1px solid ${C.border}`,
        }}
      >
        <div>
          <label style={labelStyle}>
            Accredited Voters <Required />
          </label>
          <input
            type="number"
            min="0"
            value={accreditedVoters}
            onChange={(e) => onAccreditedChange(e.target.value)}
            placeholder="0"
            style={{
              ...inputStyle,
              textAlign: "center",
              fontSize: "18px",
              fontWeight: 700,
            }}
            onFocus={(e) => (e.target.style.borderColor = C.primary)}
            onBlur={(e) => (e.target.style.borderColor = C.border)}
          />
          <div style={{ fontSize: "11px", color: C.gray, marginTop: "4px" }}>
            From the result sheet header
          </div>
        </div>
        <div>
          <label style={labelStyle}>
            Registered Voters <Required />
          </label>
          <input
            type="number"
            min="0"
            value={registeredVoters}
            onChange={(e) => onRegisteredChange(e.target.value)}
            placeholder="0"
            style={{
              ...inputStyle,
              textAlign: "center",
              fontSize: "18px",
              fontWeight: 700,
            }}
            onFocus={(e) => (e.target.style.borderColor = C.primary)}
            onBlur={(e) => (e.target.style.borderColor = C.border)}
          />
          <div style={{ fontSize: "11px", color: C.gray, marginTop: "4px" }}>
            Total registered in this unit
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// STEP 2 — Evidence
// ─────────────────────────────────────────

function StepEvidence({
  imageFile,
  imagePreview,
  onImageChange,
  notes,
  onNotesChange,
}) {
  return (
    <div>
      <StepTitle
        title="Upload Evidence"
        subtitle="Attach the official INEC result sheet and any relevant notes."
      />

      {/* Image upload */}
      <div style={{ marginBottom: "28px" }}>
        <label style={labelStyle}>
          Result Sheet Image{" "}
          <span style={{ color: C.gray, fontWeight: 400 }}>(Recommended)</span>
        </label>

        {imagePreview ? (
          <div style={{ position: "relative", marginBottom: "12px" }}>
            <img
              src={imagePreview}
              alt="Result sheet preview"
              style={{
                width: "100%",
                maxHeight: "320px",
                objectFit: "contain",
                borderRadius: "10px",
                border: `1.5px solid ${C.light}`,
              }}
            />
            <button
              onClick={() => {
                onImageChange({ target: { files: [] } });
              }}
              style={{
                position: "absolute",
                top: "8px",
                right: "8px",
                background: "rgba(0,0,0,0.6)",
                color: "#fff",
                border: "none",
                borderRadius: "20px",
                padding: "4px 10px",
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              ✕ Remove
            </button>
            <div style={{ fontSize: "12px", color: C.gray, marginTop: "6px" }}>
              📎 {imageFile.name} ({(imageFile.size / 1024 / 1024).toFixed(1)}{" "}
              MB)
            </div>
          </div>
        ) : (
          <label
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "40px 24px",
              border: `2px dashed ${C.border}`,
              borderRadius: "10px",
              cursor: "pointer",
              background: C.bg,
              transition: "border-color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = C.accent)}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = C.border)}
          >
            <span style={{ fontSize: "36px", marginBottom: "10px" }}>📷</span>
            <span
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: C.primary,
                marginBottom: "4px",
              }}
            >
              Click to upload result sheet
            </span>
            <span style={{ fontSize: "12px", color: C.gray }}>
              JPEG or PNG · Max 10MB
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png"
              onChange={onImageChange}
              style={{ display: "none" }}
            />
          </label>
        )}
      </div>

      {/* Notes */}
      <div>
        <label style={labelStyle}>
          Notes{" "}
          <span style={{ color: C.gray, fontWeight: 400 }}>
            (Optional — max 2,000 characters)
          </span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          maxLength={2000}
          rows={5}
          placeholder="Add any relevant observations, discrepancies, or context about this polling unit..."
          style={{
            width: "100%",
            padding: "12px 14px",
            border: `1.5px solid ${C.border}`,
            borderRadius: "8px",
            fontSize: "14px",
            fontFamily: "Poppins, sans-serif",
            outline: "none",
            resize: "vertical",
            boxSizing: "border-box",
            lineHeight: 1.6,
          }}
          onFocus={(e) => (e.target.style.borderColor = C.primary)}
          onBlur={(e) => (e.target.style.borderColor = C.border)}
        />
        <div
          style={{
            fontSize: "11px",
            color: C.gray,
            textAlign: "right",
            marginTop: "4px",
          }}
        >
          {notes.length} / 2,000
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// STEP 3 — Review
// ─────────────────────────────────────────

function StepReview({
  election,
  lga,
  ward,
  pollingUnit,
  candidates,
  candidateVotes,
  accreditedVoters,
  registeredVoters,
  totalVotes,
  imageFile,
  notes,
}) {
  return (
    <div>
      <StepTitle
        title="Review Submission"
        subtitle="Please verify all details carefully before submitting. You cannot edit this after submission."
      />

      {/* Warning */}
      <div
        style={{
          background: "#FFF8E1",
          border: "1px solid #FFE082",
          borderRadius: "8px",
          padding: "12px 14px",
          marginBottom: "24px",
          fontSize: "13px",
          color: "#5D4037",
          lineHeight: 1.7,
        }}
      >
        ⚠️ Once submitted, results <strong>cannot be edited or deleted</strong>{" "}
        by you. Raise a security report if a correction is needed.
      </div>

      {/* Location summary */}
      <ReviewSection title="Location">
        <ReviewRow label="Election" value={election?.title || "—"} />
        <ReviewRow label="LGA" value={lga} />
        <ReviewRow label="Ward" value={ward} />
        <ReviewRow label="Polling Unit" value={pollingUnit} />
      </ReviewSection>

      {/* Votes summary */}
      <ReviewSection title="Votes">
        {candidates.map((c) => (
          <ReviewRow
            key={c.id}
            label={
              <>
                {c.full_name} <PartyBadge party={c.party} />
              </>
            }
            value={
              <strong
                style={{
                  fontFamily: "Montserrat, sans-serif",
                  fontSize: "16px",
                  color: C.primary,
                }}
              >
                {(Number(candidateVotes[c.id]) || 0).toLocaleString()}
              </strong>
            }
          />
        ))}
        <div
          style={{
            marginTop: "12px",
            paddingTop: "12px",
            borderTop: `1px dashed ${C.border}`,
          }}
        >
          <ReviewRow label="Total Votes" value={totalVotes.toLocaleString()} />
          <ReviewRow
            label="Accredited Voters"
            value={Number(accreditedVoters).toLocaleString()}
          />
          <ReviewRow
            label="Registered Voters"
            value={Number(registeredVoters).toLocaleString()}
          />
        </div>
      </ReviewSection>

      {/* Evidence */}
      <ReviewSection title="Evidence">
        <ReviewRow
          label="Result Sheet Image"
          value={
            imageFile ? (
              <span style={{ color: C.secondary, fontWeight: 600 }}>
                ✅ {imageFile.name}
              </span>
            ) : (
              <span style={{ color: C.gray, fontStyle: "italic" }}>
                No image uploaded
              </span>
            )
          }
        />
        <ReviewRow
          label="Notes"
          value={
            notes ? (
              <span style={{ color: C.text }}>
                {notes.substring(0, 80)}
                {notes.length > 80 ? "..." : ""}
              </span>
            ) : (
              <span style={{ color: C.gray, fontStyle: "italic" }}>None</span>
            )
          }
        />
      </ReviewSection>
    </div>
  );
}

// ─────────────────────────────────────────
// SUCCESS SCREEN
// ─────────────────────────────────────────

function SuccessScreen({ result, onAnother }) {
  return (
    <div
      style={{
        fontFamily: "Poppins, sans-serif",
        maxWidth: "560px",
        textAlign: "center",
        margin: "60px auto",
      }}
    >
      <div style={{ fontSize: "64px", marginBottom: "20px" }}>✅</div>
      <h2
        style={{
          fontFamily: "Montserrat, sans-serif",
          fontSize: "24px",
          fontWeight: 800,
          color: C.primary,
          marginBottom: "12px",
        }}
      >
        Results Submitted
      </h2>
      <p
        style={{
          color: C.gray,
          fontSize: "14px",
          lineHeight: 1.7,
          marginBottom: "8px",
        }}
      >
        Results for{" "}
        <strong style={{ color: C.text }}>{result.pollingUnit}</strong> in{" "}
        <strong style={{ color: C.text }}>{result.ward}</strong>, {result.lga}{" "}
        have been recorded successfully.
      </p>
      <p style={{ color: C.gray, fontSize: "13px", marginBottom: "32px" }}>
        The State Admin will review and verify your submission. You cannot edit
        it — file a security report if a correction is needed.
      </p>
      <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
        <a
          href="/results/lga/results"
          style={{
            padding: "12px 24px",
            background: C.bg,
            color: C.text,
            border: `1.5px solid ${C.border}`,
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          View My Submissions
        </a>
        <button
          onClick={onAnother}
          style={{
            padding: "12px 24px",
            background: C.primary,
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "Poppins, sans-serif",
          }}
        >
          Submit Another
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// SHARED UI
// ─────────────────────────────────────────

function StepIndicator({ steps, current }) {
  return (
    <div style={{ display: "flex", gap: "0", marginBottom: "8px" }}>
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div
            key={label}
            style={{ display: "flex", alignItems: "center", flex: 1 }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                flex: 1,
              }}
            >
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: done ? C.accent : active ? C.primary : C.border,
                  color: done || active ? "#fff" : C.gray,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "13px",
                  fontWeight: 700,
                  transition: "all 0.3s",
                }}
              >
                {done ? "✓" : i + 1}
              </div>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: active ? 700 : 400,
                  color: active ? C.primary : C.gray,
                  marginTop: "4px",
                  whiteSpace: "nowrap",
                }}
              >
                {label}
              </div>
            </div>
            {i < steps.length - 1 && (
              <div
                style={{
                  height: "2px",
                  flex: 1,
                  background: i < current ? C.accent : C.border,
                  marginBottom: "18px",
                  transition: "background 0.3s",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function StepTitle({ title, subtitle }) {
  return (
    <div style={{ marginBottom: "24px" }}>
      <h2
        style={{
          fontFamily: "Montserrat, sans-serif",
          fontSize: "18px",
          fontWeight: 800,
          color: C.primary,
          margin: "0 0 4px",
        }}
      >
        {title}
      </h2>
      <p style={{ fontSize: "13px", color: C.gray, margin: 0 }}>{subtitle}</p>
    </div>
  );
}

function ReviewSection({ title, children }) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <div
        style={{
          fontSize: "11px",
          fontWeight: 700,
          color: C.gray,
          letterSpacing: "0.8px",
          textTransform: "uppercase",
          marginBottom: "10px",
        }}
      >
        {title}
      </div>
      <div
        style={{ background: C.bg, borderRadius: "10px", padding: "14px 16px" }}
      >
        {children}
      </div>
    </div>
  );
}

function ReviewRow({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "6px 0",
        borderBottom: `1px solid ${C.border}`,
        fontSize: "13px",
      }}
    >
      <span style={{ color: C.gray, fontWeight: 500 }}>{label}</span>
      <span
        style={{
          color: C.text,
          fontWeight: 600,
          textAlign: "right",
          maxWidth: "60%",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function PartyBadge({ party }) {
  const colors = {
    APC: "#1565C0",
    PDP: "#C62828",
    LP: "#F57F17",
    ADC: "#6A1B9A",
    NNPP: "#2E7D32",
    SDP: "#BF360C",
  };
  const bg = {
    APC: "#E3F2FD",
    PDP: "#FFEBEE",
    LP: "#FFF8E1",
    ADC: "#F3E5F5",
    NNPP: "#E8F5E9",
    SDP: "#FBE9E7",
  };
  const col = colors[party?.toUpperCase()] || "#616161";
  const bgCol = bg[party?.toUpperCase()] || "#EEEEEE";
  return (
    <span
      style={{
        background: bgCol,
        color: col,
        padding: "1px 7px",
        borderRadius: "4px",
        fontSize: "11px",
        fontWeight: 700,
      }}
    >
      {party}
    </span>
  );
}

function Skeleton({ h = 44, mb = 0 }) {
  return (
    <div
      style={{
        height: `${h}px`,
        background: "#EEEEEE",
        borderRadius: "8px",
        marginBottom: `${mb}px`,
      }}
    />
  );
}

function Required() {
  return <span style={{ color: C.danger }}>*</span>;
}

const labelStyle = {
  display: "block",
  fontSize: "13px",
  fontWeight: 600,
  color: C.text,
  marginBottom: "8px",
};
const inputStyle = {
  width: "100%",
  padding: "11px 14px",
  border: `1.5px solid ${C.border}`,
  borderRadius: "8px",
  fontSize: "14px",
  fontFamily: "Poppins, sans-serif",
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.2s",
};
const selectStyle = {
  width: "100%",
  padding: "11px 14px",
  border: `1.5px solid ${C.border}`,
  borderRadius: "8px",
  fontSize: "14px",
  fontFamily: "Poppins, sans-serif",
  outline: "none",
  boxSizing: "border-box",
  background: "#fff",
  cursor: "pointer",
};
