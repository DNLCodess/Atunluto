"use client";

/**
 * app/results/lga/settings/page.jsx
 * LGA Admin — Change password + account info
 */

import { useState } from "react";
import { changeResultsPassword } from "@/app/actions/election-auth";

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
};

const REQUIREMENTS = [
  { key: "length", label: "At least 8 characters", test: (p) => p.length >= 8 },
  {
    key: "upper",
    label: "One uppercase letter (A–Z)",
    test: (p) => /[A-Z]/.test(p),
  },
  {
    key: "lower",
    label: "One lowercase letter (a–z)",
    test: (p) => /[a-z]/.test(p),
  },
  { key: "digit", label: "One number (0–9)", test: (p) => /[0-9]/.test(p) },
  {
    key: "symbol",
    label: "One special character (!@#$...)",
    test: (p) => /[^A-Za-z0-9]/.test(p),
  },
];

export default function SettingsPage() {
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const checks = REQUIREMENTS.map((r) => ({ ...r, passed: r.test(newPwd) }));
  const allPass = checks.every((r) => r.passed);
  const matches = newPwd && confirmPwd && newPwd === confirmPwd;
  const strength = checks.filter((r) => r.passed).length;

  const strengthLabel = ["", "Weak", "Weak", "Fair", "Strong", "Very Strong"][
    strength
  ];
  const strengthColor = [
    "",
    C.danger,
    C.danger,
    "#E65100",
    C.secondary,
    C.primary,
  ][strength];

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!currentPwd) return setError("Current password is required.");
    if (!allPass)
      return setError("New password does not meet all requirements.");
    if (!matches) return setError("Passwords do not match.");
    if (newPwd === currentPwd)
      return setError(
        "New password must be different from your current password.",
      );

    setLoading(true);

    const fd = new FormData();
    fd.append("current_password", currentPwd);
    fd.append("new_password", newPwd);
    fd.append("confirm_password", confirmPwd);

    const result = await changeResultsPassword(fd);
    setLoading(false);

    if (result?.error) {
      setError(result.error);
      return;
    }

    setSuccess(true);
    setCurrentPwd("");
    setNewPwd("");
    setConfirmPwd("");
    setTimeout(() => setSuccess(false), 5000);
  }

  return (
    <div
      style={{
        fontFamily: "Poppins, sans-serif",
        color: C.text,
        maxWidth: "560px",
      }}
    >
      <div style={{ marginBottom: "28px" }}>
        <h1
          style={{
            fontFamily: "Montserrat, sans-serif",
            fontSize: "26px",
            fontWeight: 800,
            color: C.primary,
            margin: "0 0 6px",
          }}
        >
          Settings
        </h1>
        <p style={{ color: C.gray, fontSize: "14px", margin: 0 }}>
          Manage your account security
        </p>
      </div>

      {/* Change password card */}
      <div
        style={{
          background: C.white,
          borderRadius: "14px",
          border: `1px solid ${C.border}`,
          padding: "32px",
        }}
      >
        <h2
          style={{
            fontFamily: "Montserrat, sans-serif",
            fontSize: "18px",
            fontWeight: 700,
            color: C.primary,
            margin: "0 0 24px",
          }}
        >
          🔑 Change Password
        </h2>

        {/* Success banner */}
        {success && (
          <div
            style={{
              background: "#E8F5E9",
              border: `1px solid ${C.light}`,
              borderRadius: "8px",
              padding: "12px 14px",
              marginBottom: "20px",
              fontSize: "13px",
              color: C.secondary,
              fontWeight: 600,
            }}
          >
            ✅ Password changed successfully.
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div
            style={{
              background: "#FFEBEE",
              border: `1px solid #FFCDD2`,
              borderRadius: "8px",
              padding: "12px 14px",
              marginBottom: "20px",
              fontSize: "13px",
              color: C.danger,
            }}
          >
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Current password */}
          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>
              Current Password <Required />
            </label>
            <PasswordInput
              value={currentPwd}
              onChange={setCurrentPwd}
              show={showCurrent}
              onToggle={() => setShowCurrent((s) => !s)}
              placeholder="Enter your current password"
            />
          </div>

          {/* New password */}
          <div style={{ marginBottom: "12px" }}>
            <label style={labelStyle}>
              New Password <Required />
            </label>
            <PasswordInput
              value={newPwd}
              onChange={setNewPwd}
              show={showNew}
              onToggle={() => setShowNew((s) => !s)}
              placeholder="Create a strong new password"
            />
          </div>

          {/* Strength bar */}
          {newPwd && (
            <div style={{ marginBottom: "16px" }}>
              <div
                style={{
                  height: "4px",
                  background: C.border,
                  borderRadius: "2px",
                  overflow: "hidden",
                  marginBottom: "6px",
                }}
              >
                <div
                  style={{
                    width: `${(strength / 5) * 100}%`,
                    height: "100%",
                    background: strengthColor,
                    transition: "all 0.3s",
                  }}
                />
              </div>
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: strengthColor,
                }}
              >
                {strengthLabel}
              </div>
            </div>
          )}

          {/* Requirements checklist */}
          {newPwd && (
            <div
              style={{
                background: C.bg,
                borderRadius: "8px",
                padding: "12px 14px",
                marginBottom: "20px",
              }}
            >
              {checks.map(({ key, label, passed }) => (
                <div
                  key={key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "3px 0",
                    fontSize: "12px",
                  }}
                >
                  <span
                    style={{
                      color: passed ? C.secondary : "#BDBDBD",
                      fontSize: "14px",
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {passed ? "✓" : "○"}
                  </span>
                  <span style={{ color: passed ? C.secondary : C.gray }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Confirm password */}
          <div style={{ marginBottom: "28px" }}>
            <label style={labelStyle}>
              Confirm New Password <Required />
            </label>
            <PasswordInput
              value={confirmPwd}
              onChange={setConfirmPwd}
              show={showConfirm}
              onToggle={() => setShowConfirm((s) => !s)}
              placeholder="Re-enter new password"
              hasError={confirmPwd && !matches}
              hasSuccess={matches}
            />
            {confirmPwd && !matches && (
              <div
                style={{ fontSize: "12px", color: C.danger, marginTop: "5px" }}
              >
                ⚠️ Passwords do not match
              </div>
            )}
            {matches && (
              <div
                style={{
                  fontSize: "12px",
                  color: C.secondary,
                  marginTop: "5px",
                }}
              >
                ✓ Passwords match
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !allPass || !matches || !currentPwd}
            style={{
              width: "100%",
              padding: "13px",
              background:
                loading || !allPass || !matches || !currentPwd
                  ? "#A5D6A7"
                  : C.primary,
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              fontSize: "15px",
              fontWeight: 700,
              cursor:
                loading || !allPass || !matches || !currentPwd
                  ? "not-allowed"
                  : "pointer",
              fontFamily: "Poppins, sans-serif",
            }}
          >
            {loading ? "⏳ Updating..." : "Update Password"}
          </button>
        </form>
      </div>

      {/* Security tips */}
      <div
        style={{
          background: "#E8F5E9",
          border: `1px solid ${C.light}`,
          borderRadius: "12px",
          padding: "18px 20px",
          marginTop: "20px",
        }}
      >
        <div
          style={{
            fontFamily: "Montserrat, sans-serif",
            fontSize: "13px",
            fontWeight: 700,
            color: C.primary,
            marginBottom: "10px",
          }}
        >
          🔒 Account Security Tips
        </div>
        <ul
          style={{
            margin: 0,
            padding: "0 0 0 18px",
            fontSize: "12px",
            color: C.secondary,
            lineHeight: 2,
          }}
        >
          <li>
            Never share your password with anyone, including the State Admin
          </li>
          <li>Log out from shared or public devices immediately after use</li>
          <li>Report any suspicious login activity immediately</li>
          <li>Your session expires after 8 hours of inactivity</li>
        </ul>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// PASSWORD INPUT with toggle
// ─────────────────────────────────────────

function PasswordInput({
  value,
  onChange,
  show,
  onToggle,
  placeholder,
  hasError,
  hasSuccess,
}) {
  const borderColor = hasError ? "#FFCDD2" : hasSuccess ? C.light : C.border;
  return (
    <div style={{ position: "relative" }}>
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: "11px 44px 11px 14px",
          border: `1.5px solid ${borderColor}`,
          borderRadius: "8px",
          fontSize: "14px",
          fontFamily: "Poppins, sans-serif",
          outline: "none",
          boxSizing: "border-box",
          background: hasError ? "#FFF5F5" : hasSuccess ? "#F5FBF5" : C.white,
        }}
        onFocus={(e) =>
          !hasError && !hasSuccess && (e.target.style.borderColor = C.primary)
        }
        onBlur={(e) =>
          !hasError && !hasSuccess && (e.target.style.borderColor = C.border)
        }
      />
      <button
        type="button"
        onClick={onToggle}
        style={{
          position: "absolute",
          right: "12px",
          top: "50%",
          transform: "translateY(-50%)",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: "16px",
          color: C.gray,
          padding: "2px",
        }}
        tabIndex={-1}
      >
        {show ? "🙈" : "👁️"}
      </button>
    </div>
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
