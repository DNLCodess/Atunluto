"use client";

/**
 * app/results/change-password/page.jsx
 * Mandatory password change screen shown on first login.
 * must_change_password = true blocks access to all other pages.
 */

import { useState } from "react";
import { changeResultsPassword } from "@/app/actions/election-auth";

const REQUIREMENTS = [
  { test: (p) => p.length >= 8, label: "At least 8 characters" },
  { test: (p) => /[A-Z]/.test(p), label: "One uppercase letter" },
  { test: (p) => /[a-z]/.test(p), label: "One lowercase letter" },
  { test: (p) => /[0-9]/.test(p), label: "One number" },
  {
    test: (p) => /[!@#$%^&*+\-=?_]/.test(p),
    label: "One symbol (!@#$%^&*+-=?_)",
  },
];

export default function ChangePasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const meetsAll = REQUIREMENTS.every((r) => r.test(newPassword));
  const matches = newPassword === confirmPassword && confirmPassword.length > 0;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!meetsAll) return setError("Password does not meet all requirements.");
    if (!matches) return setError("Passwords do not match.");

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.set("new_password", newPassword);
    formData.set("confirm_password", confirmPassword);

    const result = await changeResultsPassword(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #1B5E20 0%, #2E7D32 50%, #1B5E20 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Poppins, sans-serif",
        padding: "24px",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          padding: "48px 40px",
          width: "100%",
          maxWidth: "460px",
          boxShadow: "0 24px 64px rgba(0,0,0,0.3)",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div
            style={{
              width: "52px",
              height: "52px",
              background: "#FFF8E1",
              border: "2px solid #F9A825",
              borderRadius: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              fontSize: "22px",
            }}
          >
            🔑
          </div>
          <h1
            style={{
              fontSize: "22px",
              fontWeight: 700,
              color: "#1B5E20",
              margin: "0 0 8px",
              fontFamily: "Montserrat, sans-serif",
            }}
          >
            Set Your Password
          </h1>
          <p
            style={{
              fontSize: "13px",
              color: "#757575",
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            Your account requires a new password before you can continue. Choose
            a strong password you haven&apos;t used before.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              background: "#FFEBEE",
              border: "1px solid #FFCDD2",
              borderRadius: "8px",
              padding: "12px 16px",
              marginBottom: "20px",
              fontSize: "13px",
              color: "#C62828",
            }}
          >
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* New Password */}
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 600,
                color: "#212121",
                marginBottom: "8px",
              }}
            >
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              placeholder="Enter new password"
              style={{
                width: "100%",
                padding: "12px 14px",
                border: "1.5px solid #E0E0E0",
                borderRadius: "8px",
                fontSize: "14px",
                fontFamily: "Poppins, sans-serif",
                outline: "none",
                boxSizing: "border-box",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#1B5E20")}
              onBlur={(e) => (e.target.style.borderColor = "#E0E0E0")}
            />
          </div>

          {/* Requirements checklist */}
          {newPassword.length > 0 && (
            <div
              style={{
                background: "#F5F5F5",
                borderRadius: "8px",
                padding: "12px 16px",
                marginBottom: "20px",
              }}
            >
              {REQUIREMENTS.map((req) => {
                const met = req.test(newPassword);
                return (
                  <div
                    key={req.label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "12px",
                      color: met ? "#2E7D32" : "#757575",
                      marginBottom: "4px",
                      fontWeight: met ? 600 : 400,
                    }}
                  >
                    <span>{met ? "✅" : "○"}</span>
                    {req.label}
                  </div>
                );
              })}
            </div>
          )}

          {/* Confirm Password */}
          <div style={{ marginBottom: "28px" }}>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 600,
                color: "#212121",
                marginBottom: "8px",
              }}
            >
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Repeat new password"
              style={{
                width: "100%",
                padding: "12px 14px",
                border: `1.5px solid ${confirmPassword.length > 0 ? (matches ? "#4CAF50" : "#EF5350") : "#E0E0E0"}`,
                borderRadius: "8px",
                fontSize: "14px",
                fontFamily: "Poppins, sans-serif",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            {confirmPassword.length > 0 && !matches && (
              <div
                style={{ fontSize: "12px", color: "#C62828", marginTop: "4px" }}
              >
                Passwords do not match.
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !meetsAll || !matches}
            style={{
              width: "100%",
              padding: "14px",
              background:
                !meetsAll || !matches || loading ? "#A5D6A7" : "#1B5E20",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontSize: "15px",
              fontWeight: 600,
              fontFamily: "Poppins, sans-serif",
              cursor:
                !meetsAll || !matches || loading ? "not-allowed" : "pointer",
              transition: "background 0.2s",
            }}
          >
            {loading ? "Saving..." : "Set Password & Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
