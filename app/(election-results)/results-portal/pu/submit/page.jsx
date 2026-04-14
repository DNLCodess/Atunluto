"use client";

/**
 * app/results-portal/pu/submit/page.jsx
 * PU Admin result submission — pre-fills LGA, ward, polling unit from session.
 * Reuses the same 4-step flow as the LGA admin form but with locked location fields.
 */

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  useActiveElections,
  useElectionCandidates,
  useSubmitResult,
} from "@/hooks/use-election-results";

const PARTY_COLORS = {
  APC: { text: "text-blue-800", bg: "bg-blue-50" },
  PDP: { text: "text-red-800", bg: "bg-red-50" },
  LP: { text: "text-yellow-800", bg: "bg-yellow-50" },
  ADC: { text: "text-purple-800", bg: "bg-purple-50" },
  NNPP: { text: "text-green-800", bg: "bg-green-50" },
  SDP: { text: "text-orange-800", bg: "bg-orange-50" },
};

const STEPS = ["Election", "Votes", "Evidence", "Review"];

export default function PUSubmitPage() {
  const [lga, setLga] = useState("");
  const [ward, setWard] = useState("");
  const [pollingUnit, setPollingUnit] = useState("");

  useEffect(() => {
    const main = document.querySelector("main[data-erms-lga]");
    if (main) {
      setLga(main.dataset.ermsLga || "");
      setWard(main.dataset.ermsWard || "");
      setPollingUnit(main.dataset.ermsPollingUnit || "");
    }
  }, []);

  const [step, setStep] = useState(0);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState("");
  const [electionId, setElectionId] = useState("");
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
  const submitResult = useSubmitResult();

  const selectedElection = elections.find((e) => e.id === electionId);
  const totalVotes = Object.values(candidateVotes).reduce(
    (sum, v) => sum + (Number(v) || 0),
    0,
  );
  const overVote =
    Number(accreditedVoters) > 0 && totalVotes > Number(accreditedVoters);

  const step0Valid = !!electionId;
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
    } catch {
      // submitResult.error?.message has the user-friendly error from the server action
    }
  }

  function reset() {
    setStep(0);
    setSuccess(null);
    setError("");
    setElectionId("");
    setCandidateVotes({});
    setAccreditedVoters("");
    setRegisteredVoters("");
    setNotes("");
    setImageFile(null);
    setImagePreview(null);
  }

  if (success) {
    return (
      <div className="p-8 font-[Poppins,sans-serif]">
        <div className="max-w-[560px] mx-auto text-center mt-16">
          <div className="text-6xl mb-5">✅</div>
          <h2 className="font-[Montserrat,sans-serif] text-2xl font-extrabold text-[#1B5E20] mb-3">
            Results Submitted
          </h2>
          <p className="text-sm text-[#757575] mb-8">
            Results for <strong>{pollingUnit}</strong> in{" "}
            <strong>{ward}</strong>, {lga} have been recorded successfully.
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/results-portal/pu/results"
              className="px-6 py-3 bg-[#F5F5F5] text-[#212121] border border-[#E0E0E0] rounded-xl text-sm font-medium no-underline"
            >
              View My Submissions
            </Link>
            <button
              onClick={reset}
              className="px-6 py-3 bg-[#1B5E20] text-white border-none rounded-xl text-sm font-semibold cursor-pointer"
            >
              Submit Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 font-[Poppins,sans-serif] text-[#212121]">
      <div className="mb-8">
        <h1 className="font-[Montserrat,sans-serif] text-[26px] font-extrabold text-[#1B5E20] mb-1.5">
          Submit Results
        </h1>
        <p className="text-sm text-[#757575]">
          {lga} · {ward} ·{" "}
          <strong className="text-[#212121]">{pollingUnit}</strong>
        </p>
      </div>

      {/* Stepper */}
      <div className="flex mb-2">
        {STEPS.map((label, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <div key={label} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold transition-all duration-300 ${done ? "bg-[#4CAF50] text-white" : active ? "bg-[#1B5E20] text-white" : "bg-[#E0E0E0] text-[#757575]"}`}
                >
                  {done ? "✓" : i + 1}
                </div>
                <div
                  className={`text-[11px] mt-1 whitespace-nowrap ${active ? "font-bold text-[#1B5E20]" : "text-[#757575]"}`}
                >
                  {label}
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mb-[18px] transition-colors duration-300 ${i < step ? "bg-[#4CAF50]" : "bg-[#E0E0E0]"}`}
                />
              )}
            </div>
          );
        })}
      </div>

      {(error || submitResult.error?.message) && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mt-5 text-[13px] text-red-800 flex items-center gap-2">
          <span>⚠️</span> {error || submitResult.error?.message}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-[#E0E0E0] p-8 mt-6">
        {/* Location info banner — always shown */}
        <div className="inline-flex items-center gap-2 bg-green-50 border border-[#C8E6C9] rounded-lg px-3.5 py-2 mb-6">
          <span>🗳️</span>
          <span className="text-[13px] font-bold text-[#1B5E20]">
            {pollingUnit || "—"}
          </span>
          <span className="text-[#757575] text-[13px]">·</span>
          <span className="text-[13px] text-[#2E7D32]">{ward}</span>
          <span className="text-[#757575] text-[13px]">·</span>
          <span className="text-[13px] text-[#2E7D32]">{lga}</span>
        </div>

        {step === 0 && (
          <div>
            <div className="mb-6">
              <h2 className="font-[Montserrat,sans-serif] text-lg font-extrabold text-[#1B5E20] mb-1">
                Select Election
              </h2>
              <p className="text-[13px] text-[#757575]">
                Choose the active election you are submitting results for.
              </p>
            </div>
            <label className="block text-[13px] font-semibold text-[#212121] mb-2">
              Election <span className="text-red-600">*</span>
            </label>
            {loadingElections ? (
              <div className="h-11 bg-[#EEEEEE] rounded-xl animate-pulse" />
            ) : elections.length === 0 ? (
              <div className="px-4 py-3.5 bg-yellow-50 border border-yellow-200 rounded-xl text-[13px] text-yellow-900">
                ⚠️ No active elections at the moment. Contact the State Admin.
              </div>
            ) : (
              <select
                value={electionId}
                onChange={(e) => {
                  setElectionId(e.target.value);
                  setCandidateVotes({});
                }}
                className="w-full px-3.5 py-2.5 border-[1.5px] border-[#E0E0E0] rounded-xl text-sm bg-white outline-none focus:border-[#1B5E20] cursor-pointer"
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
        )}

        {step === 1 && (
          <div>
            <div className="mb-6">
              <h2 className="font-[Montserrat,sans-serif] text-lg font-extrabold text-[#1B5E20] mb-1">
                Enter Vote Counts
              </h2>
              <p className="text-[13px] text-[#757575]">
                Record exact votes from the official result sheet.
              </p>
            </div>
            {loadingCandidates ? (
              <div className="space-y-3 mb-7">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-16 bg-[#EEEEEE] rounded-xl animate-pulse"
                  />
                ))}
              </div>
            ) : candidates.length === 0 ? (
              <div className="px-4 py-5 bg-yellow-50 rounded-xl text-[13px] text-yellow-900 mb-7">
                ⚠️ No candidates found. Contact the State Admin.
              </div>
            ) : (
              <div className="mb-7">
                {candidates.map((candidate) => {
                  const colors = PARTY_COLORS[
                    candidate.party?.toUpperCase()
                  ] || { text: "text-gray-700", bg: "bg-gray-100" };
                  return (
                    <div
                      key={candidate.id}
                      className={`flex items-center gap-4 px-4 py-4 border-[1.5px] rounded-xl mb-2.5 transition-colors duration-150 ${candidateVotes[candidate.id] > 0 ? "border-[#C8E6C9] bg-green-50" : "border-[#E0E0E0] bg-white"}`}
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
                        <span
                          className={`${colors.bg} ${colors.text} px-1.5 py-0.5 rounded text-[11px] font-bold`}
                        >
                          {candidate.party}
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0">
                        <label className="text-xs text-[#757575] font-semibold">
                          Votes
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={candidateVotes[candidate.id] ?? ""}
                          onChange={(e) =>
                            setCandidateVotes((p) => ({
                              ...p,
                              [candidate.id]:
                                e.target.value === ""
                                  ? ""
                                  : Math.max(0, parseInt(e.target.value) || 0),
                            }))
                          }
                          placeholder="0"
                          className="w-[90px] px-3 py-2.5 border-[1.5px] border-[#E0E0E0] rounded-lg text-lg font-bold text-center font-[Montserrat,sans-serif] text-[#1B5E20] outline-none focus:border-[#1B5E20]"
                        />
                      </div>
                    </div>
                  );
                })}
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
                    ⚠️ Total votes exceed accredited voters. Please recheck.
                  </p>
                )}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 pt-5 border-t border-[#E0E0E0]">
              {[
                {
                  label: "Accredited Voters",
                  key: "acc",
                  val: accreditedVoters,
                  set: setAccreditedVoters,
                },
                {
                  label: "Registered Voters",
                  key: "reg",
                  val: registeredVoters,
                  set: setRegisteredVoters,
                },
              ].map(({ label, key, val, set }) => (
                <div key={key}>
                  <label className="block text-[13px] font-semibold text-[#212121] mb-2">
                    {label} <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={val}
                    onChange={(e) => set(e.target.value)}
                    placeholder="0"
                    className="w-full px-3.5 py-2.5 border-[1.5px] border-[#E0E0E0] rounded-xl text-lg font-bold text-center font-[Montserrat,sans-serif] text-[#1B5E20] outline-none focus:border-[#1B5E20]"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="mb-6">
              <h2 className="font-[Montserrat,sans-serif] text-lg font-extrabold text-[#1B5E20] mb-1">
                Upload Evidence
              </h2>
              <p className="text-[13px] text-[#757575]">
                Attach the official INEC result sheet image.
              </p>
            </div>
            <div className="mb-7">
              <label className="block text-[13px] font-semibold text-[#212121] mb-2">
                Result Sheet Image{" "}
                <span className="font-normal text-[#757575]">
                  (Recommended)
                </span>
              </label>
              {imagePreview ? (
                <div>
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Result sheet"
                      className="w-full max-h-80 object-contain rounded-xl border border-[#C8E6C9]"
                    />
                    <button
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                        setImagePath(null);
                        setImageUploadState("idle");
                      }}
                      className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white border-none rounded-full px-2.5 py-1 text-xs cursor-pointer"
                    >
                      ✕ Remove
                    </button>
                  </div>
                  <div
                    className={`mt-2 rounded-xl border px-3.5 py-2.5 text-[12px] flex items-center gap-2.5 ${imageUploadState === "done" ? "bg-green-50 border-[#C8E6C9] text-[#2E7D32]" : imageUploadState === "error" ? "bg-red-50 border-red-200 text-red-700" : "bg-[#F5F5F5] border-[#E0E0E0] text-[#757575]"}`}
                  >
                    <span>
                      {imageUploadState === "done"
                        ? "✅"
                        : imageUploadState === "error"
                          ? "❌"
                          : imageUploadState === "uploading"
                            ? "⏳"
                            : "📎"}
                    </span>
                    <div className="flex-1">
                      <div className="font-semibold truncate">
                        {imageFile?.name}
                      </div>
                      <div className="text-[11px] mt-0.5">
                        {imageUploadState === "uploading" &&
                          `Uploading... ${imageUploadProgress}%`}
                        {imageUploadState === "done" && "Upload complete"}
                        {imageUploadState === "error" && "Upload failed"}
                      </div>
                    </div>
                  </div>
                  {imageUploadState === "uploading" && (
                    <div className="mt-1.5 h-1.5 bg-[#E0E0E0] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#4CAF50] rounded-full transition-all duration-300"
                        style={{ width: `${imageUploadProgress}%` }}
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
                    JPEG or PNG · Max 10MB
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-[#212121] mb-2">
                Notes{" "}
                <span className="font-normal text-[#757575]">(Optional)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={2000}
                rows={4}
                placeholder="Add observations or context..."
                className="w-full px-3.5 py-3.5 border-[1.5px] border-[#E0E0E0] rounded-xl text-sm outline-none resize-y focus:border-[#1B5E20]"
              />
              <p className="text-[11px] text-[#757575] text-right mt-1">
                {notes.length} / 2,000
              </p>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <div className="mb-6">
              <h2 className="font-[Montserrat,sans-serif] text-lg font-extrabold text-[#1B5E20] mb-1">
                Review Submission
              </h2>
              <p className="text-[13px] text-[#757575]">
                Verify all details carefully. You cannot edit this after
                submission.
              </p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 mb-6 text-[13px] text-yellow-900">
              ⚠️ Once submitted, results{" "}
              <strong>cannot be edited or deleted</strong> by you.
            </div>
            {[
              {
                title: "Location",
                rows: [
                  ["Election", selectedElection?.title || "—"],
                  ["LGA", lga],
                  ["Ward", ward],
                  ["Polling Unit", pollingUnit],
                ],
              },
            ].map(({ title, rows }) => (
              <div key={title} className="mb-5">
                <div className="text-[11px] font-bold text-[#757575] tracking-widest uppercase mb-2.5">
                  {title}
                </div>
                <div className="bg-[#F5F5F5] rounded-xl px-4 py-3.5">
                  {rows.map(([label, value]) => (
                    <div
                      key={label}
                      className="flex justify-between items-center py-1.5 border-b border-[#E0E0E0] last:border-b-0 text-[13px]"
                    >
                      <span className="text-[#757575]">{label}</span>
                      <span className="text-[#212121] font-semibold">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div className="mb-5">
              <div className="text-[11px] font-bold text-[#757575] tracking-widest uppercase mb-2.5">
                Votes
              </div>
              <div className="bg-[#F5F5F5] rounded-xl px-4 py-3.5">
                {candidates.map((c) => {
                  const colors = PARTY_COLORS[c.party?.toUpperCase()] || {
                    text: "text-gray-700",
                    bg: "bg-gray-100",
                  };
                  return (
                    <div
                      key={c.id}
                      className="flex justify-between items-center py-1.5 border-b border-[#E0E0E0] last:border-b-0 text-[13px]"
                    >
                      <span className="flex items-center gap-1.5 text-[#757575]">
                        {c.full_name}{" "}
                        <span
                          className={`${colors.bg} ${colors.text} px-1.5 py-0.5 rounded text-[11px] font-bold`}
                        >
                          {c.party}
                        </span>
                      </span>
                      <span className="font-[Montserrat,sans-serif] text-base font-extrabold text-[#1B5E20]">
                        {(Number(candidateVotes[c.id]) || 0).toLocaleString()}
                      </span>
                    </div>
                  );
                })}
                <div className="flex justify-between py-1.5 text-[13px] font-semibold text-[#212121] mt-1 pt-2 border-t border-dashed border-[#E0E0E0]">
                  <span>Total Votes</span>
                  <span>{totalVotes.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1.5 text-[13px] text-[#757575]">
                  <span>Accredited Voters</span>
                  <span className="font-semibold text-[#212121]">
                    {Number(accreditedVoters).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 text-[13px] text-[#757575]">
                  <span>Registered Voters</span>
                  <span className="font-semibold text-[#212121]">
                    {Number(registeredVoters).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between mt-8 pt-6 border-t border-[#E0E0E0]">
          <button
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
            className={`px-6 py-3 rounded-xl text-sm font-medium border transition-all duration-150 ${step === 0 ? "bg-[#EEEEEE] text-[#BDBDBD] border-[#EEEEEE] cursor-not-allowed" : "bg-white text-[#212121] border-[#E0E0E0] hover:border-[#9E9E9E] cursor-pointer"}`}
          >
            ← Back
          </button>
          {step < 3 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!stepValid[step]}
              className={`px-7 py-3 rounded-xl text-sm font-semibold text-white border-none transition-all duration-150 ${stepValid[step] ? "bg-[#1B5E20] hover:bg-[#2E7D32] cursor-pointer shadow-lg shadow-[#1B5E20]/20" : "bg-[#A5D6A7] cursor-not-allowed"}`}
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitResult.isPending}
              className={`px-8 py-3 rounded-xl text-sm font-bold text-white border-none flex items-center gap-2 transition-all duration-150 ${submitResult.isPending ? "bg-[#A5D6A7] cursor-not-allowed" : "bg-[#1B5E20] hover:bg-[#2E7D32] cursor-pointer shadow-lg shadow-[#1B5E20]/20"}`}
            >
              {submitResult.isPending ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />{" "}
                  Submitting...
                </>
              ) : (
                "✅ Submit Results"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
