"use client";

/**
 * app/results-portal/lga/submit/page.jsx
 * LGA Admin — Result Submission Form (4-step)
 */

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import {
  useActiveElections,
  useElectionCandidates,
  useSubmitResult,
} from "@/hooks/use-election-results";
import {
  useWardsForLGA,
  usePollingUnitsForWard,
  prefetchPollingUnits,
} from "@/hooks/use-pu";

const STEPS = ["Location", "Votes", "Evidence", "Review"];

const PARTY_COLORS = {
  APC: { text: "text-blue-800", bg: "bg-blue-50" },
  PDP: { text: "text-red-800", bg: "bg-red-50" },
  LP: { text: "text-yellow-800", bg: "bg-yellow-50" },
  ADC: { text: "text-purple-800", bg: "bg-purple-50" },
  NNPP: { text: "text-green-800", bg: "bg-green-50" },
  SDP: { text: "text-orange-800", bg: "bg-orange-50" },
};

// ─────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────

export default function SubmitResultPage() {
  const queryClient = useQueryClient();
  const [lga, setLga] = useState("");

  useEffect(() => {
    const val =
      document.querySelector("main[data-erms-lga]")?.dataset?.ermsLga || "";
    setLga(val);
  }, []);

  const [step, setStep] = useState(0);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState("");
  const [electionId, setElectionId] = useState("");
  const [ward, setWard] = useState("");
  const [pollingUnit, setPollingUnit] = useState("");
  const [candidateVotes, setCandidateVotes] = useState({});
  const [accreditedVoters, setAccreditedVoters] = useState("");
  const [registeredVoters, setRegisteredVoters] = useState("");
  const [notes, setNotes] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageUploadState, setImageUploadState] = useState("idle");
  const [imageUploadProgress, setImageUploadProgress] = useState(0);
  const [imagePath, setImagePath] = useState(null);
  const imageXhrRef = useRef(null);

  const { data: elections = [], isLoading: loadingElections } =
    useActiveElections();
  const { data: candidates = [], isLoading: loadingCandidates } =
    useElectionCandidates(electionId);

  // ── Cascading location data from DB ──────────────────────────────────────
  const {
    data: wardOptions = [],
    isLoading: wardsLoading,
    isError: wardsError,
  } = useWardsForLGA(lga);

  const {
    data: puOptions = [],
    isLoading: puLoading,
    isError: puError,
  } = usePollingUnitsForWard(lga, ward);

  // Prefetch all PUs for this LGA when the ward dropdown is focused
  function handleWardFocus() {
    wardOptions.forEach((w) =>
      prefetchPollingUnits(queryClient, lga, w.ward_name),
    );
  }

  const submitResult = useSubmitResult();
  const selectedElection = elections.find((e) => e.id === electionId);

  const totalVotes = Object.values(candidateVotes).reduce(
    (sum, v) => sum + (Number(v) || 0),
    0,
  );
  const overVote =
    Number(accreditedVoters) > 0 && totalVotes > Number(accreditedVoters);

  const step0Valid = !!(electionId && ward && pollingUnit);
  const step1Valid =
    candidates.length > 0 &&
    candidates.every(
      (c) => candidateVotes[c.id] !== undefined && candidateVotes[c.id] >= 0,
    ) &&
    accreditedVoters !== "" &&
    registeredVoters !== "" &&
    !overVote;
  const stepValid = [step0Valid, step1Valid, true, true];

  function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) {
      setImageFile(null);
      setImagePreview(null);
      setImagePath(null);
      setImageUploadState("idle");
      setImageUploadProgress(0);
      return;
    }
    setImageFile(file);
    setImagePath(null);
    setImageUploadState("idle");
    setImageUploadProgress(0);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
    uploadImageFile(file);
  }

  async function uploadImageFile(file) {
    setImageUploadState("uploading");
    setImageUploadProgress(0);
    try {
      const { getResultImageUploadUrl } =
        await import("@/app/actions/result-submission");
      const urlResult = await getResultImageUploadUrl({
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      });
      if (urlResult.error) {
        setImageUploadState("error");
        setError(urlResult.error);
        return;
      }

      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        imageXhrRef.current = xhr;
        xhr.upload.addEventListener("progress", (ev) => {
          if (ev.lengthComputable)
            setImageUploadProgress(Math.round((ev.loaded / ev.total) * 100));
        });
        xhr.addEventListener("load", () =>
          xhr.status < 300 ? resolve() : reject(new Error("Upload failed")),
        );
        xhr.addEventListener("error", () => reject(new Error("Network error")));
        xhr.open("PUT", urlResult.uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.send(file);
      });

      setImagePath(urlResult.path);
      setImageUploadState("done");
      setImageUploadProgress(100);
    } catch (err) {
      setImageUploadState("error");
      setError(err.message || "Image upload failed.");
    }
  }

  function handleVoteChange(candidateId, value) {
    setCandidateVotes((prev) => ({
      ...prev,
      [candidateId]: value === "" ? "" : Math.max(0, parseInt(value) || 0),
    }));
  }

  async function handleSubmit() {
    setError("");
    if (imageFile && imageUploadState !== "done")
      return setError("Please wait for the image upload to finish.");
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
        imagePath,
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

  if (success) return <SuccessScreen result={success} onAnother={reset} />;

  return (
    <div className="p-8 font-[Poppins,sans-serif] text-[#212121]">
      <div className="w-full">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-[Montserrat,sans-serif] text-[26px] font-extrabold text-[#1B5E20] mb-1.5">
            Submit Results
          </h1>
          <p className="text-sm text-[#757575]">
            {lga ? (
              <>
                <strong className="text-[#1B5E20]">{lga}</strong> · Enter
                polling unit results accurately
              </>
            ) : (
              "Loading your LGA..."
            )}
          </p>
        </div>

        <StepIndicator steps={STEPS} current={step} />

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mt-5 text-[13px] text-red-800 flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-[#E0E0E0] p-8 mt-6">
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
              lga={lga}
              ward={ward}
              wardOptions={wardOptions}
              wardsLoading={wardsLoading}
              wardsError={wardsError}
              onWardChange={(w) => {
                setWard(w);
                setPollingUnit("");
              }}
              onWardFocus={handleWardFocus}
              pollingUnit={pollingUnit}
              puOptions={puOptions}
              puLoading={puLoading}
              puError={puError}
              onPollingUnitChange={setPollingUnit}
            />
          )}

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

          {step === 2 && (
            <StepEvidence
              imageFile={imageFile}
              imagePreview={imagePreview}
              onImageChange={handleImageChange}
              notes={notes}
              onNotesChange={setNotes}
              uploadState={imageUploadState}
              uploadProgress={imageUploadProgress}
            />
          )}

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
          <div className="flex justify-between mt-8 pt-6 border-t border-[#E0E0E0]">
            <button
              onClick={() => setStep((s) => s - 1)}
              disabled={step === 0}
              className={`px-6 py-3 rounded-xl text-sm font-medium border transition-all duration-150
                ${
                  step === 0
                    ? "bg-[#EEEEEE] text-[#BDBDBD] border-[#EEEEEE] cursor-not-allowed"
                    : "bg-white text-[#212121] border-[#E0E0E0] hover:border-[#9E9E9E] cursor-pointer"
                }`}
            >
              ← Back
            </button>

            {step < 3 ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                disabled={!stepValid[step]}
                className={`px-7 py-3 rounded-xl text-sm font-semibold text-white border-none transition-all duration-150
                  ${
                    stepValid[step]
                      ? "bg-[#1B5E20] hover:bg-[#2E7D32] cursor-pointer shadow-lg shadow-[#1B5E20]/20"
                      : "bg-[#A5D6A7] cursor-not-allowed"
                  }`}
              >
                Next →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitResult.isPending}
                className={`px-8 py-3 rounded-xl text-sm font-bold text-white border-none flex items-center gap-2 transition-all duration-150
                  ${
                    submitResult.isPending
                      ? "bg-[#A5D6A7] cursor-not-allowed"
                      : "bg-[#1B5E20] hover:bg-[#2E7D32] cursor-pointer shadow-lg shadow-[#1B5E20]/20"
                  }`}
              >
                {submitResult.isPending ? (
                  <>
                    <Spinner /> Submitting...
                  </>
                ) : (
                  "✅ Submit Results"
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// STEP 0 — Location
// ─────────────────────────────────────────

function StepLocation({
  elections,
  loadingElections,
  electionId,
  onElectionChange,
  lga,
  ward,
  wardOptions,
  wardsLoading,
  wardsError,
  onWardChange,
  onWardFocus,
  pollingUnit,
  puOptions,
  puLoading,
  puError,
  onPollingUnitChange,
}) {
  return (
    <div>
      <StepTitle
        title="Select Location"
        subtitle="Choose the election and polling unit you are submitting results for."
      />

      <div className="inline-flex items-center gap-2 bg-green-50 border border-[#C8E6C9] rounded-lg px-3.5 py-2 mb-6">
        <span>📍</span>
        <span className="text-[13px] font-bold text-[#1B5E20]">
          Your LGA: {lga}
        </span>
      </div>

      {/* Election */}
      <div className="mb-5">
        <Label>
          Election <Required />
        </Label>
        {loadingElections ? (
          <Skeleton />
        ) : elections.length === 0 ? (
          <div className="px-4 py-3.5 bg-yellow-50 border border-yellow-200 rounded-xl text-[13px] text-yellow-900">
            ⚠️ No active elections at the moment. Contact the State Admin.
          </div>
        ) : (
          <Select
            value={electionId}
            onChange={(e) => onElectionChange(e.target.value)}
          >
            <option value="">Select election...</option>
            {elections.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title}
              </option>
            ))}
          </Select>
        )}
      </div>

      {/* Ward — from DB */}
      <div className="mb-5">
        <Label>
          Ward <Required />
        </Label>
        <div className="relative">
          {wardsLoading ? (
            <Skeleton />
          ) : (
            <Select
              value={ward}
              onChange={(e) => onWardChange(e.target.value)}
              onFocus={onWardFocus}
              disabled={!electionId || wardsLoading}
            >
              <option value="">
                {!electionId
                  ? "Select election first"
                  : wardsError
                    ? "Failed to load wards"
                    : "Select ward..."}
              </option>
              {wardOptions.map((w) => (
                <option key={w.ward_number} value={w.ward_name}>
                  {w.ward_name}
                </option>
              ))}
            </Select>
          )}
        </div>
        {wardsError && (
          <p className="text-xs text-amber-600 mt-1">
            Could not load wards. Check your connection.
          </p>
        )}
      </div>

      {/* Polling Unit — from DB, cascades from ward */}
      <div>
        <Label>
          Polling Unit <Required />
        </Label>
        <div className="relative">
          {puLoading ? (
            <Skeleton />
          ) : (
            <Select
              value={pollingUnit}
              onChange={(e) => onPollingUnitChange(e.target.value)}
              disabled={!ward || puLoading}
            >
              <option value="">
                {!ward
                  ? "Select ward first"
                  : puError
                    ? "Failed to load polling units"
                    : puOptions.length === 0
                      ? "No polling units found"
                      : "Select polling unit..."}
              </option>
              {puOptions.map((pu) => (
                <option key={pu.id} value={pu.pu_name}>
                  {pu.pu_code} — {pu.pu_name}
                </option>
              ))}
            </Select>
          )}
        </div>
        {puError && (
          <p className="text-xs text-amber-600 mt-1">
            Could not load polling units. Check your connection.
          </p>
        )}
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
        <div className="space-y-3 mb-7">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} h="h-16" />
          ))}
        </div>
      ) : candidates.length === 0 ? (
        <div className="px-4 py-5 bg-yellow-50 rounded-xl text-[13px] text-yellow-900 mb-7">
          ⚠️ No candidates found for this election. Contact the State Admin.
        </div>
      ) : (
        <div className="mb-7">
          {candidates.map((candidate) => (
            <div
              key={candidate.id}
              className={`flex items-center gap-4 px-4 py-4 border-[1.5px] rounded-xl mb-2.5 transition-colors duration-150
                ${candidateVotes[candidate.id] > 0 ? "border-[#C8E6C9] bg-green-50" : "border-[#E0E0E0] bg-white"}`}
            >
              <div className="w-10 h-10 rounded-full bg-green-50 border border-[#C8E6C9] flex items-center justify-center font-bold text-[#1B5E20] text-sm shrink-0 overflow-hidden">
                {candidate.photo_url ? (
                  <img
                    src={candidate.photo_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  candidate.full_name.charAt(0)
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-[#212121]">
                  {candidate.full_name}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <PartyBadge party={candidate.party} />
                  {candidate.position && (
                    <span className="text-xs text-[#757575]">
                      {candidate.position}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2.5 shrink-0">
                <label className="text-xs text-[#757575] font-semibold">
                  Votes
                </label>
                <input
                  type="number"
                  min="0"
                  value={candidateVotes[candidate.id] ?? ""}
                  onChange={(e) => onVoteChange(candidate.id, e.target.value)}
                  placeholder="0"
                  className="w-[90px] px-3 py-2.5 border-[1.5px] border-[#E0E0E0] rounded-lg text-lg font-bold text-center font-[Montserrat,sans-serif] text-[#1B5E20] outline-none focus:border-[#1B5E20] transition-colors duration-150"
                />
              </div>
            </div>
          ))}

          <div
            className={`flex justify-between items-center px-4 py-3 rounded-xl border mt-2 ${overVote ? "bg-red-50 border-red-200" : "bg-green-50 border-[#C8E6C9]"}`}
          >
            <span
              className={`text-[13px] font-semibold ${overVote ? "text-red-800" : "text-[#1B5E20]"}`}
            >
              Total Votes Cast
            </span>
            <span
              className={`font-[Montserrat,sans-serif] text-xl font-extrabold ${overVote ? "text-red-800" : "text-[#1B5E20]"}`}
            >
              {totalVotes.toLocaleString()}
            </span>
          </div>
          {overVote && (
            <p className="text-xs text-red-700 font-semibold mt-1.5">
              ⚠️ Total votes ({totalVotes}) exceeds accredited voters (
              {accreditedVoters}). Please recheck.
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 pt-5 border-t border-[#E0E0E0]">
        <div>
          <Label>
            Accredited Voters <Required />
          </Label>
          <input
            type="number"
            min="0"
            value={accreditedVoters}
            onChange={(e) => onAccreditedChange(e.target.value)}
            placeholder="0"
            className="w-full px-3.5 py-2.5 border-[1.5px] border-[#E0E0E0] rounded-xl text-lg font-bold text-center font-[Montserrat,sans-serif] text-[#1B5E20] outline-none focus:border-[#1B5E20] transition-colors duration-150"
          />
          <p className="text-[11px] text-[#757575] mt-1">
            From the result sheet header
          </p>
        </div>
        <div>
          <Label>
            Registered Voters <Required />
          </Label>
          <input
            type="number"
            min="0"
            value={registeredVoters}
            onChange={(e) => onRegisteredChange(e.target.value)}
            placeholder="0"
            className="w-full px-3.5 py-2.5 border-[1.5px] border-[#E0E0E0] rounded-xl text-lg font-bold text-center font-[Montserrat,sans-serif] text-[#1B5E20] outline-none focus:border-[#1B5E20] transition-colors duration-150"
          />
          <p className="text-[11px] text-[#757575] mt-1">
            Total registered in this unit
          </p>
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
  uploadState,
  uploadProgress,
}) {
  return (
    <div>
      <StepTitle
        title="Upload Evidence"
        subtitle="Attach the official INEC result sheet and any relevant notes."
      />

      <div className="mb-7">
        <Label>
          Result Sheet Image{" "}
          <span className="font-normal text-[#757575]">(Recommended)</span>
        </Label>

        {imagePreview ? (
          <div className="mb-3">
            <div className="relative">
              <img
                src={imagePreview}
                alt="Result sheet preview"
                className="w-full max-h-80 object-contain rounded-xl border border-[#C8E6C9]"
              />
              <button
                onClick={() => onImageChange({ target: { files: [] } })}
                className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white border-none rounded-full px-2.5 py-1 text-xs cursor-pointer transition-colors duration-150"
              >
                ✕ Remove
              </button>
            </div>
            <div
              className={`mt-2 rounded-xl border px-3.5 py-2.5 text-[12px] flex items-center gap-2.5
              ${
                uploadState === "done"
                  ? "bg-green-50 border-[#C8E6C9] text-[#2E7D32]"
                  : uploadState === "error"
                    ? "bg-red-50 border-red-200 text-red-700"
                    : "bg-[#F5F5F5] border-[#E0E0E0] text-[#757575]"
              }`}
            >
              <span>
                {uploadState === "done"
                  ? "✅"
                  : uploadState === "error"
                    ? "❌"
                    : uploadState === "uploading"
                      ? "⏳"
                      : "📎"}
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{imageFile?.name}</div>
                <div className="text-[11px] mt-0.5">
                  {uploadState === "uploading" &&
                    `Uploading... ${uploadProgress}%`}
                  {uploadState === "done" &&
                    `${(imageFile.size / 1024 / 1024).toFixed(1)} MB · Upload complete`}
                  {uploadState === "error" &&
                    "Upload failed — remove and try again"}
                  {uploadState === "idle" &&
                    `${(imageFile.size / 1024 / 1024).toFixed(1)} MB`}
                </div>
              </div>
            </div>
            {uploadState === "uploading" && (
              <div className="mt-1.5 h-1.5 bg-[#E0E0E0] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#4CAF50] rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center px-6 py-10 border-2 border-dashed border-[#E0E0E0] rounded-xl cursor-pointer bg-[#F5F5F5] hover:border-[#4CAF50] hover:bg-green-50 transition-all duration-150">
            <span className="text-4xl mb-2.5">📷</span>
            <span className="text-sm font-semibold text-[#1B5E20] mb-1">
              Click to upload result sheet
            </span>
            <span className="text-xs text-[#757575]">
              JPEG or PNG · Max 10MB · Auto-uploads on selection
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png"
              onChange={onImageChange}
              className="hidden"
            />
          </label>
        )}
      </div>

      <div>
        <Label>
          Notes{" "}
          <span className="font-normal text-[#757575]">
            (Optional — max 2,000 characters)
          </span>
        </Label>
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          maxLength={2000}
          rows={5}
          placeholder="Add any relevant observations, discrepancies, or context about this polling unit..."
          className="w-full px-3.5 py-3.5 border-[1.5px] border-[#E0E0E0] rounded-xl text-sm outline-none resize-y leading-relaxed focus:border-[#1B5E20] transition-colors duration-150"
        />
        <p className="text-[11px] text-[#757575] text-right mt-1">
          {notes.length} / 2,000
        </p>
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

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 mb-6 text-[13px] text-yellow-900 leading-relaxed">
        ⚠️ Once submitted, results <strong>cannot be edited or deleted</strong>{" "}
        by you. Raise a security report if a correction is needed.
      </div>

      <ReviewSection title="Location">
        <ReviewRow label="Election" value={election?.title || "—"} />
        <ReviewRow label="LGA" value={lga} />
        <ReviewRow label="Ward" value={ward} />
        <ReviewRow label="Polling Unit" value={pollingUnit} />
      </ReviewSection>

      <ReviewSection title="Votes">
        {candidates.map((c) => (
          <ReviewRow
            key={c.id}
            label={
              <span className="flex items-center gap-1.5">
                {c.full_name} <PartyBadge party={c.party} />
              </span>
            }
            value={
              <span className="font-[Montserrat,sans-serif] text-base font-extrabold text-[#1B5E20]">
                {(Number(candidateVotes[c.id]) || 0).toLocaleString()}
              </span>
            }
          />
        ))}
        <div className="mt-3 pt-3 border-t border-dashed border-[#E0E0E0]">
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

      <ReviewSection title="Evidence">
        <ReviewRow
          label="Result Sheet Image"
          value={
            imageFile ? (
              <span className="text-[#2E7D32] font-semibold">
                ✅ {imageFile.name}
              </span>
            ) : (
              <span className="text-[#757575] italic">No image uploaded</span>
            )
          }
        />
        <ReviewRow
          label="Notes"
          value={
            notes ? (
              <span className="text-[#212121]">
                {notes.substring(0, 80)}
                {notes.length > 80 ? "..." : ""}
              </span>
            ) : (
              <span className="text-[#757575] italic">None</span>
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
    <div className="p-8 font-[Poppins,sans-serif]">
      <div className="max-w-[560px] mx-auto text-center mt-16">
        <div className="text-6xl mb-5">✅</div>
        <h2 className="font-[Montserrat,sans-serif] text-2xl font-extrabold text-[#1B5E20] mb-3">
          Results Submitted
        </h2>
        <p className="text-sm text-[#757575] leading-relaxed mb-1.5">
          Results for{" "}
          <strong className="text-[#212121]">{result.pollingUnit}</strong> in{" "}
          <strong className="text-[#212121]">{result.ward}</strong>,{" "}
          {result.lga} have been recorded successfully.
        </p>
        <p className="text-[13px] text-[#757575] mb-8">
          The State Admin will review and verify your submission.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/results-portal/lga/results"
            className="px-6 py-3 bg-[#F5F5F5] text-[#212121] border border-[#E0E0E0] rounded-xl text-sm font-medium no-underline hover:border-[#9E9E9E] transition-colors duration-150"
          >
            View My Submissions
          </Link>
          <button
            onClick={onAnother}
            className="px-6 py-3 bg-[#1B5E20] hover:bg-[#2E7D32] text-white border-none rounded-xl text-sm font-semibold cursor-pointer transition-colors duration-150"
          >
            Submit Another
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// SHARED UI PRIMITIVES
// ─────────────────────────────────────────

function StepIndicator({ steps, current }) {
  return (
    <div className="flex mb-2">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={label} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold transition-all duration-300
                ${done ? "bg-[#4CAF50] text-white" : active ? "bg-[#1B5E20] text-white" : "bg-[#E0E0E0] text-[#757575]"}`}
              >
                {done ? "✓" : i + 1}
              </div>
              <div
                className={`text-[11px] mt-1 whitespace-nowrap ${active ? "font-bold text-[#1B5E20]" : "text-[#757575]"}`}
              >
                {label}
              </div>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`h-0.5 flex-1 mb-[18px] transition-colors duration-300 ${i < current ? "bg-[#4CAF50]" : "bg-[#E0E0E0]"}`}
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
    <div className="mb-6">
      <h2 className="font-[Montserrat,sans-serif] text-lg font-extrabold text-[#1B5E20] mb-1">
        {title}
      </h2>
      <p className="text-[13px] text-[#757575]">{subtitle}</p>
    </div>
  );
}

function ReviewSection({ title, children }) {
  return (
    <div className="mb-5">
      <div className="text-[11px] font-bold text-[#757575] tracking-widest uppercase mb-2.5">
        {title}
      </div>
      <div className="bg-[#F5F5F5] rounded-xl px-4 py-3.5">{children}</div>
    </div>
  );
}

function ReviewRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-[#E0E0E0] last:border-b-0 text-[13px]">
      <span className="text-[#757575] font-medium">{label}</span>
      <span className="text-[#212121] font-semibold text-right max-w-[60%]">
        {value}
      </span>
    </div>
  );
}

function PartyBadge({ party }) {
  const cfg = PARTY_COLORS[party?.toUpperCase()] || {
    text: "text-gray-700",
    bg: "bg-gray-100",
  };
  return (
    <span
      className={`${cfg.bg} ${cfg.text} px-1.5 py-0.5 rounded text-[11px] font-bold`}
    >
      {party}
    </span>
  );
}

function Label({ children }) {
  return (
    <label className="block text-[13px] font-semibold text-[#212121] mb-2">
      {children}
    </label>
  );
}

function Required() {
  return <span className="text-red-600">*</span>;
}

function Select({ value, onChange, onFocus, disabled, children }) {
  return (
    <select
      value={value}
      onChange={onChange}
      onFocus={onFocus}
      disabled={disabled}
      className={`w-full px-3.5 py-2.5 border-[1.5px] border-[#E0E0E0] rounded-xl text-sm bg-white outline-none focus:border-[#1B5E20] transition-colors duration-150
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      {children}
    </select>
  );
}

function Skeleton({ h = "h-11" }) {
  return <div className={`${h} bg-[#EEEEEE] rounded-xl animate-pulse`} />;
}

function Spinner() {
  return (
    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
  );
}
