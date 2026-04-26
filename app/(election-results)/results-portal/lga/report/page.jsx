"use client";

import { useState, useRef } from "react";
import {
  fileSecurityReport,
  getEvidenceUploadUrl,
} from "@/app/actions/security";

const REPORT_TYPES = [
  {
    value: "tampering",
    label: "Tampering",
    desc: "Suspected modification of submitted results",
  },
  {
    value: "unauthorized_access",
    label: "Unauthorised Access",
    desc: "Someone accessed the system without authorisation",
  },
  {
    value: "suspicious_activity",
    label: "Suspicious Activity",
    desc: "Unusual behaviour that could compromise integrity",
  },
  { value: "other", label: "Other", desc: "Any other security concern" },
];

const URGENCY_LEVELS = [
  {
    value: "low",
    label: "Low",
    desc: "No immediate threat — for record keeping",
    border: "border-green-600",
    bg: "bg-green-50",
    text: "text-green-800",
  },
  {
    value: "medium",
    label: "Medium",
    desc: "Needs attention soon",
    border: "border-yellow-500",
    bg: "bg-yellow-50",
    text: "text-yellow-800",
  },
  {
    value: "high",
    label: "High",
    desc: "Requires prompt attention within hours",
    border: "border-orange-500",
    bg: "bg-orange-50",
    text: "text-orange-800",
  },
  {
    value: "critical",
    label: "Critical",
    desc: "Immediate threat to election result integrity",
    border: "border-red-600",
    bg: "bg-red-50",
    text: "text-red-800",
  },
];

// Upload states
const UPLOAD_IDLE = "idle";
const UPLOAD_COMPRESSING = "compressing";
const UPLOAD_UPLOADING = "uploading";
const UPLOAD_DONE = "done";
const UPLOAD_ERROR = "error";

export default function ReportPage() {
  const [step, setStep] = useState("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reportType, setReportType] = useState("");
  const [urgency, setUrgency] = useState("");
  const [description, setDescription] = useState("");
  const [successId, setSuccessId] = useState("");

  // Evidence upload state
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [evidenceName, setEvidenceName] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState(null); // permanent Cloudinary URL after upload
  const [uploadState, setUploadState] = useState(UPLOAD_IDLE);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const xhrRef = useRef(null);

  const MIN_DESC = 50;
  const descRemaining = MIN_DESC - description.length;
  const descValid = description.trim().length >= MIN_DESC;
  const uploadBusy =
    uploadState === UPLOAD_COMPRESSING || uploadState === UPLOAD_UPLOADING;

  // ── Compress image client-side before upload ──────────────
  async function compressImage(file) {
    // Only compress images, not PDFs
    if (!file.type.startsWith("image/")) return file;

    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const MAX = 1600;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          const ratio = Math.min(MAX / width, MAX / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) =>
            resolve(new File([blob], file.name, { type: "image/jpeg" })),
          "image/jpeg",
          0.82,
        );
      };
      img.src = url;
    });
  }

  // ── Direct-to-Supabase upload with XHR for progress ───────
  async function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setEvidenceFile(file);
    setEvidenceName(file.name);
    setEvidenceUrl(null);
    setUploadError("");
    setUploadProgress(0);
    setUploadState(UPLOAD_COMPRESSING);

    try {
      // 1. Compress if image
      const compressed = await compressImage(file);

      // 2. Get Cloudinary signing params from server
      const signResult = await getEvidenceUploadUrl({
        fileName: compressed.name,
        fileType: compressed.type,
        fileSize: compressed.size,
      });

      if (signResult.error) {
        setUploadState(UPLOAD_ERROR);
        setUploadError(signResult.error);
        return;
      }

      // 3. Upload directly to Cloudinary via XHR (for progress events)
      setUploadState(UPLOAD_UPLOADING);

      const uploadUrl = `https://api.cloudinary.com/v1_1/${signResult.cloudName}/${signResult.uploadType || "auto"}/upload`;
      const fd = new FormData();
      fd.append("file", compressed);
      fd.append("api_key", signResult.apiKey);
      fd.append("timestamp", String(signResult.timestamp));
      fd.append("signature", signResult.signature);
      fd.append("folder", signResult.folder);

      const responseText = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhrRef.current = xhr;

        xhr.upload.addEventListener("progress", (ev) => {
          if (ev.lengthComputable) {
            setUploadProgress(Math.round((ev.loaded / ev.total) * 100));
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(xhr.responseText);
          } else {
            reject(new Error(`Upload failed: ${xhr.statusText}`));
          }
        });

        xhr.addEventListener("error", () =>
          reject(new Error("Network error during upload.")),
        );
        xhr.addEventListener("abort", () =>
          reject(new Error("Upload cancelled.")),
        );

        xhr.open("POST", uploadUrl);
        xhr.send(fd);
      });

      const uploadData = JSON.parse(responseText);
      setUploadProgress(100);
      setUploadState(UPLOAD_DONE);
      setEvidenceUrl(uploadData.secure_url);
    } catch (err) {
      setUploadState(UPLOAD_ERROR);
      setUploadError(err.message || "Upload failed. Please try again.");
    }
  }

  function removeFile() {
    if (xhrRef.current && uploadState === UPLOAD_UPLOADING) {
      xhrRef.current.abort();
    }
    setEvidenceFile(null);
    setEvidenceName("");
    setEvidenceUrl(null);
    setUploadState(UPLOAD_IDLE);
    setUploadProgress(0);
    setUploadError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!reportType) return setError("Please select a report type.");
    if (!urgency) return setError("Please select an urgency level.");
    if (!descValid)
      return setError(`Description must be at least ${MIN_DESC} characters.`);
    if (uploadBusy)
      return setError("Please wait for the file upload to complete.");

    setLoading(true);
    const result = await fileSecurityReport({
      report_type: reportType,
      urgency,
      description,
      evidenceUrl: evidenceUrl || null,
    });
    setLoading(false);

    if (result?.error) {
      setError(result.error);
      return;
    }
    setSuccessId(result.reportId);
    setStep("success");
  }

  function reset() {
    setStep("form");
    setError("");
    setReportType("");
    setUrgency("");
    setDescription("");
    removeFile();
    setSuccessId("");
  }

  // ── SUCCESS ────────────────────────────────────────────────
  if (step === "success") {
    return (
      <div className="p-8 font-[Poppins,sans-serif]">
        <div className="max-w-[520px] mx-auto text-center mt-16">
          <div className="w-16 h-16 rounded-full bg-green-50 border-2 border-[#C8E6C9] flex items-center justify-center text-2xl mx-auto mb-5">
            ✅
          </div>
          <h2 className="font-[Montserrat,sans-serif] text-2xl font-extrabold text-[#1B5E20] mb-3">
            Report Submitted
          </h2>
          <p className="text-sm text-[#757575] leading-relaxed mb-3">
            Your security report has been filed and is now visible to the State
            Admin. You will not receive a direct reply — monitor the status on
            your dashboard.
          </p>
          <div className="inline-block font-mono text-xs text-[#757575] bg-[#F5F5F5] px-3.5 py-2 rounded-lg mb-7 border border-[#E0E0E0]">
            Report ID: {successId}
          </div>
          <div className="flex justify-center">
            <button
              onClick={reset}
              className="px-6 py-3 bg-[#1B5E20] hover:bg-[#2E7D32] text-white rounded-xl text-sm font-bold cursor-pointer border-none transition-colors duration-150 shadow-lg shadow-[#1B5E20]/20"
            >
              File Another Report
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── FORM ───────────────────────────────────────────────────
  return (
    <div className="p-8 font-[Poppins,sans-serif] text-[#212121]">
      <div className="w-full">
        {/* Header */}
        <div className="mb-7">
          <h1 className="font-[Montserrat,sans-serif] text-[26px] font-extrabold text-[#1B5E20] mb-1.5">
            File Security Report
          </h1>
          <p className="text-sm text-[#757575]">
            Report tampering, suspicious activity, or integrity concerns to the
            State Admin
          </p>
        </div>

        {/* Responsibility notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3.5 mb-7 text-[13px] text-yellow-900 leading-relaxed">
          ⚠️ <strong>Use this form responsibly.</strong> All reports are logged
          in the audit trail with your identity attached. Only file when you
          have genuine integrity concerns.
        </div>

        {/* Form error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5 text-[13px] text-red-800 flex items-center gap-2">
            <span className="shrink-0">⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-7">
          {/* Report Type */}
          <div>
            <label className="block text-[13px] font-semibold text-[#212121] mb-3">
              Report Type <span className="text-red-600">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {REPORT_TYPES.map(({ value, label, desc }) => {
                const selected = reportType === value;
                return (
                  <div
                    key={value}
                    onClick={() => setReportType(value)}
                    role="radio"
                    aria-checked={selected}
                    tabIndex={0}
                    onKeyDown={(e) => e.key === " " && setReportType(value)}
                    className={`px-4 py-3.5 rounded-xl cursor-pointer border-2 transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[#1B5E20]/30
                      ${selected ? "border-[#1B5E20] bg-green-50" : "border-[#E0E0E0] bg-white hover:border-[#C8E6C9]"}`}
                  >
                    <div
                      className={`font-bold text-[13px] mb-0.5 flex items-center gap-1.5 ${selected ? "text-[#1B5E20]" : "text-[#212121]"}`}
                    >
                      {selected && (
                        <span className="text-[#4CAF50] text-xs">✓</span>
                      )}
                      {label}
                    </div>
                    <div className="text-[11px] text-[#757575]">{desc}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Urgency */}
          <div>
            <label className="block text-[13px] font-semibold text-[#212121] mb-3">
              Urgency Level <span className="text-red-600">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {URGENCY_LEVELS.map(
                ({ value, label, desc, border, bg, text }) => {
                  const selected = urgency === value;
                  return (
                    <div
                      key={value}
                      onClick={() => setUrgency(value)}
                      role="radio"
                      aria-checked={selected}
                      tabIndex={0}
                      onKeyDown={(e) => e.key === " " && setUrgency(value)}
                      className={`px-3 py-3 rounded-xl cursor-pointer border-2 text-center transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[#1B5E20]/30
                      ${selected ? `${border} ${bg}` : "border-[#E0E0E0] bg-white hover:border-[#C8E6C9]"}`}
                    >
                      <div
                        className={`font-extrabold text-[13px] mb-1 ${selected ? text : "text-[#212121]"}`}
                      >
                        {label}
                      </div>
                      <div className="text-[10px] text-[#757575] leading-snug">
                        {desc}
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[13px] font-semibold text-[#212121] mb-2">
              Description <span className="text-red-600">*</span>
              <span className="font-normal text-[#757575]">
                {" "}
                (minimum 50 characters)
              </span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              rows={6}
              placeholder="Describe the security concern in detail — what happened, when you noticed it, which polling unit is affected, and any other relevant context..."
              className={`w-full px-3.5 py-3.5 border-[1.5px] rounded-xl text-sm outline-none resize-y leading-relaxed transition-colors duration-150 focus:border-[#1B5E20] focus:ring-4 focus:ring-[#1B5E20]/8
                ${!descValid && description.length > 0 ? "border-red-300 bg-red-50/30" : "border-[#E0E0E0] bg-white"}`}
            />
            <div className="flex justify-between mt-1.5 text-xs">
              <span
                className={
                  descValid
                    ? "text-[#2E7D32]"
                    : description.length > 0
                      ? "text-red-700"
                      : "text-[#9E9E9E]"
                }
              >
                {descValid
                  ? "✓ Minimum length met"
                  : descRemaining > 0
                    ? `${descRemaining} more character${descRemaining !== 1 ? "s" : ""} needed`
                    : ""}
              </span>
              <span className="text-[#9E9E9E]">
                {description.length} / 2,000
              </span>
            </div>
          </div>

          {/* Evidence Upload */}
          <div>
            <label className="block text-[13px] font-semibold text-[#212121] mb-2">
              Evidence{" "}
              <span className="font-normal text-[#757575]">(Optional)</span>
            </label>

            {!evidenceFile ? (
              /* Drop zone */
              <label className="flex flex-col items-center justify-center gap-2 px-6 py-8 border-2 border-dashed border-[#E0E0E0] rounded-xl cursor-pointer bg-[#F9F9F9] hover:border-[#4CAF50] hover:bg-green-50/40 transition-all duration-200 group">
                <span className="text-3xl group-hover:scale-110 transition-transform duration-200">
                  📎
                </span>
                <div className="text-center">
                  <div className="text-[13px] font-semibold text-[#212121]">
                    Click to attach evidence
                  </div>
                  <div className="text-[11px] text-[#9E9E9E] mt-0.5">
                    JPEG, PNG, PDF — Max 10MB · Auto-compressed
                  </div>
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            ) : (
              /* File card with upload progress */
              <div
                className={`rounded-xl border-[1.5px] overflow-hidden transition-all duration-200
                ${
                  uploadState === UPLOAD_DONE
                    ? "border-[#C8E6C9] bg-green-50"
                    : uploadState === UPLOAD_ERROR
                      ? "border-red-200 bg-red-50"
                      : "border-[#E0E0E0] bg-white"
                }`}
              >
                {/* File info row */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <span className="text-xl shrink-0">
                    {uploadState === UPLOAD_DONE
                      ? "✅"
                      : uploadState === UPLOAD_ERROR
                        ? "❌"
                        : uploadBusy
                          ? "⏳"
                          : "📎"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-[#212121] truncate">
                      {evidenceName}
                    </div>
                    <div className="text-[11px] text-[#757575] mt-0.5">
                      {uploadState === UPLOAD_COMPRESSING &&
                        "Compressing image..."}
                      {uploadState === UPLOAD_UPLOADING &&
                        `Uploading... ${uploadProgress}%`}
                      {uploadState === UPLOAD_DONE &&
                        `${(evidenceFile.size / 1024).toFixed(0)} KB · Upload complete`}
                      {uploadState === UPLOAD_ERROR && uploadError}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeFile}
                    className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg bg-transparent hover:bg-red-50 text-[#9E9E9E] hover:text-red-600 border-none cursor-pointer transition-colors duration-150 text-lg leading-none"
                    aria-label="Remove file"
                  >
                    ×
                  </button>
                </div>

                {/* Progress bar — visible during upload */}
                {(uploadState === UPLOAD_COMPRESSING ||
                  uploadState === UPLOAD_UPLOADING) && (
                  <div className="px-4 pb-3">
                    <div className="h-1.5 bg-[#E0E0E0] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#4CAF50] rounded-full transition-all duration-300 ease-out"
                        style={{
                          width:
                            uploadState === UPLOAD_COMPRESSING
                              ? "15%"
                              : `${uploadProgress}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Retry on error */}
                {uploadState === UPLOAD_ERROR && (
                  <div className="px-4 pb-3">
                    <label className="text-[12px] text-red-700 font-semibold cursor-pointer hover:underline">
                      Try again
                      <input
                        type="file"
                        accept="image/jpeg,image/png,application/pdf"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Submit */}
          <div>
            <button
              type="submit"
              disabled={loading || uploadBusy}
              className={`px-8 py-3.5 rounded-xl text-[15px] font-bold text-white border-none transition-all duration-150 flex items-center gap-2
                ${
                  loading || uploadBusy
                    ? "bg-[#A5D6A7] cursor-not-allowed"
                    : "bg-[#1B5E20] hover:bg-[#2E7D32] active:scale-[0.99] cursor-pointer shadow-lg shadow-[#1B5E20]/20"
                }`}
            >
              {loading ? (
                <>
                  <Spinner /> Submitting...
                </>
              ) : uploadBusy ? (
                <>
                  <Spinner /> Uploading file...
                </>
              ) : (
                "🚨 Submit Security Report"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin shrink-0" />
  );
}
