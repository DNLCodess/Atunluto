"use client";
/**
 * PU Admin security report page — mirrors LGA Admin report page.
 */
import { useEffect, useState } from "react";
import { fileSecurityReport } from "@/app/actions/security";

const REPORT_TYPES = [
  { value: "tampering", label: "Tampering" },
  { value: "unauthorized_access", label: "Unauthorised Access" },
  { value: "suspicious_activity", label: "Suspicious Activity" },
  { value: "other", label: "Other" },
];
const URGENCY_LEVELS = [
  { value: "low", label: "Low", cls: "border-[#E0E0E0] text-[#757575]" },
  {
    value: "medium",
    label: "Medium",
    cls: "border-yellow-400 text-yellow-700",
  },
  { value: "high", label: "High", cls: "border-orange-400 text-orange-700" },
  { value: "critical", label: "Critical", cls: "border-red-500 text-red-700" },
];

export default function PUReportPage() {
  const [adminId, setAdminId] = useState("");
  useEffect(() => {
    setAdminId(
      document.querySelector("main[data-erms-id]")?.dataset?.ermsId || "",
    );
  }, []);

  const [reportType, setReportType] = useState("");
  const [urgency, setUrgency] = useState("medium");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (description.trim().length < 50) {
      setError("Description must be at least 50 characters.");
      return;
    }
    setLoading(true);
    setError("");
    const result = await fileSecurityReport({
      report_type: reportType,
      urgency,
      description,
    });
    setLoading(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setSuccess(true);
  }

  if (success)
    return (
      <div className="p-8 font-[Poppins,sans-serif]">
        <div className="max-w-[480px] mx-auto text-center mt-16">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="font-[Montserrat,sans-serif] text-xl font-extrabold text-[#1B5E20] mb-3">
            Report Filed
          </h2>
          <p className="text-[13px] text-[#757575] mb-8">
            Your security report has been submitted to the State Admin for
            review.
          </p>
          <button
            onClick={() => {
              setSuccess(false);
              setReportType("");
              setUrgency("medium");
              setDescription("");
            }}
            className="px-6 py-3 bg-[#1B5E20] text-white rounded-xl text-sm font-semibold border-none cursor-pointer"
          >
            File Another Report
          </button>
        </div>
      </div>
    );

  return (
    <div className="p-8 font-[Poppins,sans-serif] text-[#212121]">
      <div className="mb-8">
        <h1 className="font-[Montserrat,sans-serif] text-[26px] font-extrabold text-[#1B5E20] mb-1.5">
          Report Issue
        </h1>
        <p className="text-[#757575] text-sm">
          Flag suspicious activity or irregularities to the State Admin
        </p>
      </div>
      <div className="w-full">
        <div className="bg-[#FFEBEE] border border-[#FFCDD2] rounded-xl px-4 py-3 mb-6 text-[13px] text-[#C62828]">
          🚨 Use this form to report tampering, unauthorised access, or other
          election irregularities.
        </div>
        {error && (
          <div className="bg-[#FFEBEE] border border-[#FFCDD2] rounded-lg px-3.5 py-3 mb-5 text-[13px] text-[#C62828]">
            ⚠️ {error}
          </div>
        )}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-[#E0E0E0] p-8"
        >
          <div className="mb-5">
            <label className="block text-[13px] font-semibold text-[#212121] mb-2">
              Report Type <span className="text-red-600">*</span>
            </label>
            <select
              name="report_type"
              required
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3.5 py-[11px] border-[1.5px] border-[#E0E0E0] rounded-lg text-sm bg-white outline-none cursor-pointer focus:border-[#1B5E20]"
            >
              <option value="">Select type...</option>
              {REPORT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-5">
            <label className="block text-[13px] font-semibold text-[#212121] mb-2">
              Urgency Level <span className="text-red-600">*</span>
            </label>
            <input type="hidden" name="urgency" value={urgency} />
            <div className="flex gap-3 flex-wrap">
              {URGENCY_LEVELS.map((u) => (
                <button
                  key={u.value}
                  type="button"
                  onClick={() => setUrgency(u.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold border-2 cursor-pointer transition-all duration-150 ${urgency === u.value ? `${u.cls} bg-white shadow-sm` : "border-[#E0E0E0] text-[#757575] bg-[#F5F5F5]"}`}
                >
                  {u.label}
                </button>
              ))}
            </div>
          </div>
          <div className="mb-6">
            <label className="block text-[13px] font-semibold text-[#212121] mb-2">
              Description <span className="text-red-600">*</span>{" "}
              <span className="font-normal text-[#757575]">
                (min 50 characters)
              </span>
            </label>
            <textarea
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              minLength={50}
              rows={6}
              placeholder="Describe what happened in detail..."
              className="w-full px-3.5 py-3.5 border-[1.5px] border-[#E0E0E0] rounded-xl text-sm outline-none resize-y focus:border-[#1B5E20]"
            />
            <p
              className={`text-[11px] mt-1 text-right ${description.length >= 50 ? "text-[#2E7D32]" : "text-[#757575]"}`}
            >
              {description.length} characters{" "}
              {description.length < 50
                ? `(${50 - description.length} more needed)`
                : "✓"}
            </p>
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 text-white border-none rounded-xl text-sm font-semibold ${loading ? "bg-[#A5D6A7] cursor-not-allowed" : "bg-[#C62828] hover:bg-[#B71C1C] cursor-pointer"}`}
          >
            {loading ? "Submitting Report..." : "🚨 Submit Security Report"}
          </button>
        </form>
      </div>
    </div>
  );
}
