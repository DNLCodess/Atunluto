"use client";
/**
 * PU Admin settings — change password.
 */
import { useState } from "react";
import { changeResultsPassword } from "@/app/actions/election-auth";

export default function PUSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    const result = await changeResultsPassword(new FormData(e.currentTarget));
    setLoading(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setSuccess(true);
    e.target.reset();
  }

  return (
    <div className="p-8 font-[Poppins,sans-serif] text-[#212121]">
      <div className="mb-8">
        <h1 className="font-[Montserrat,sans-serif] text-[26px] font-extrabold text-[#1B5E20] mb-1.5">
          Settings
        </h1>
        <p className="text-[#757575] text-sm">Manage your account security</p>
      </div>
      <div className="w-full">
        <div className="bg-white rounded-2xl border border-[#E0E0E0] p-8">
          <h2 className="font-[Montserrat,sans-serif] text-base font-extrabold text-[#212121] mb-5">
            Change Password
          </h2>
          {success && (
            <div className="bg-[#E8F5E9] border border-[#C8E6C9] rounded-lg px-3.5 py-3 mb-5 text-[13px] text-[#2E7D32]">
              ✅ Password updated successfully.
            </div>
          )}
          {error && (
            <div className="bg-[#FFEBEE] border border-[#FFCDD2] rounded-lg px-3.5 py-3 mb-5 text-[13px] text-[#C62828]">
              ⚠️ {error}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            {[
              { label: "Current Password", name: "current_password" },
              { label: "New Password", name: "new_password" },
              { label: "Confirm New Password", name: "confirm_password" },
            ].map((f) => (
              <div key={f.name} className="mb-5">
                <label className="block text-[13px] font-semibold text-[#212121] mb-2">
                  {f.label} <span className="text-red-600">*</span>
                </label>
                <input
                  type="password"
                  name={f.name}
                  required
                  className="w-full px-3.5 py-[11px] border-[1.5px] border-[#E0E0E0] rounded-lg text-sm outline-none focus:border-[#1B5E20] transition-colors duration-200"
                />
              </div>
            ))}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 text-white border-none rounded-xl text-sm font-semibold ${loading ? "bg-[#A5D6A7] cursor-not-allowed" : "bg-[#1B5E20] cursor-pointer"}`}
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
