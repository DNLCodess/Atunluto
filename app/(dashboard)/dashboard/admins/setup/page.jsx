"use client";

// app/dashboard/admins/setup/page.jsx
// ─────────────────────────────────────────────────────────────────────────────
// LGA Admin Setup Wizard — state_admin only.
//
// Flow:
//   1. Pick an LGA
//   2. For each of the 4 roles (super_user, administrator, registration, manager)
//      optionally fill in account details
//   3. Submit all at once — server creates each account and returns passwords
//   4. Credentials screen shows all generated passwords to copy before closing
//
// The super_user is required. The other three are optional but encouraged.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Shield,
  Crown,
  UserCheck,
  UserPlus,
  Monitor,
  ChevronRight,
  ChevronLeft,
  Building2,
  Check,
  Copy,
  AlertCircle,
  Plus,
  Minus,
  ArrowLeft,
  Eye,
  EyeOff,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
import { LGA_NAMES } from "@/lib/oyo-south-lgas";
import { createAdminAccount } from "@/app/actions/admins";
import { useCurrentAdmin } from "@/hooks/use-admins";

// ─── Role config ──────────────────────────────────────────────────────────────
const ROLES = [
  {
    key: "super_user",
    label: "LGA Super User",
    shortLabel: "Super User",
    icon: Shield,
    color: "text-primary-green",
    bg: "bg-light-green/40",
    border: "border-accent-green/40",
    badge: "bg-light-green text-primary-green",
    ring: "ring-accent-green/30",
    activeBg: "bg-primary-green",
    desc: "Oversees the entire LGA. Can create and manage all other roles within this LGA, edit and delete members.",
    required: true,
  },
  {
    key: "administrator",
    label: "Administrator",
    shortLabel: "Admin",
    icon: UserCheck,
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    badge: "bg-blue-100 text-blue-800",
    ring: "ring-blue-300/30",
    activeBg: "bg-blue-700",
    desc: "Can view and edit member records. Cannot delete members or manage other admins.",
    required: false,
  },
  {
    key: "registration",
    label: "Registration Staff",
    shortLabel: "Reg. Staff",
    icon: UserPlus,
    color: "text-violet-700",
    bg: "bg-violet-50",
    border: "border-violet-200",
    badge: "bg-violet-100 text-violet-800",
    ring: "ring-violet-300/30",
    activeBg: "bg-violet-700",
    desc: "Can register new members only. Read-only access to existing records. No admin management.",
    required: false,
  },
  {
    key: "manager",
    label: "Content Manager",
    shortLabel: "Manager",
    icon: Monitor,
    color: "text-text-gray",
    bg: "bg-off-white",
    border: "border-border-gray",
    badge: "bg-border-gray text-text-dark",
    ring: "ring-border-gray",
    activeBg: "bg-text-dark",
    desc: "Media gallery uploads only. No access to member data or admin management.",
    required: false,
  },
];

// ─── Empty form template ──────────────────────────────────────────────────────
const emptyAccount = () => ({
  full_name: "",
  email: "",
  phone: "",
  enabled: false,
});
const emptyForm = () => ({
  super_user: { ...emptyAccount(), enabled: true }, // always required
  administrator: { ...emptyAccount() },
  registration: { ...emptyAccount() },
  manager: { ...emptyAccount() },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="p-1.5 rounded-md hover:bg-border-gray transition-colors shrink-0"
    >
      {copied ? (
        <Check size={13} className="text-accent-green" />
      ) : (
        <Copy size={13} className="text-text-gray" />
      )}
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LGASetupPage() {
  const { data: actor, isLoading: actorLoading } = useCurrentAdmin();
  const router = useRouter();

  const [step, setStep] = useState("lga"); // "lga" | "accounts" | "review" | "done"
  const [selectedLGA, setSelectedLGA] = useState("");
  const [lgaSearch, setLgaSearch] = useState("");
  const [form, setForm] = useState(emptyForm());
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState([]); // [{role, full_name, email, password, error}]
  const [submitError, setSubmitError] = useState("");
  const [validationErrors, setValidationErrors] = useState({});

  const filteredLGAs = useMemo(
    () =>
      LGA_NAMES.filter((l) =>
        l.toLowerCase().includes(lgaSearch.toLowerCase()),
      ),
    [lgaSearch],
  );

  // Guard
  if (!actorLoading && actor?.role !== "state_admin") {
    return (
      <div className="min-h-screen bg-off-white flex items-center justify-center p-8">
        <div className="text-center">
          <Crown size={40} className="mx-auto text-border-gray mb-4" />
          <p className="text-sm text-text-gray">
            Only the State Admin can use this page.
          </p>
          <Link
            href="/dashboard/admins"
            className="mt-4 inline-block text-sm text-primary-green hover:underline"
          >
            Back to Admin Management
          </Link>
        </div>
      </div>
    );
  }

  if (actorLoading) {
    return (
      <div className="min-h-screen bg-off-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Form field updater ─────────────────────────────────────────────────────
  function setField(role, field, value) {
    setForm((prev) => ({
      ...prev,
      [role]: { ...prev[role], [field]: value },
    }));
  }

  function toggleRole(role) {
    if (role === "super_user") return; // always on
    setForm((prev) => ({
      ...prev,
      [role]: { ...prev[role], enabled: !prev[role].enabled },
    }));
  }

  // ── Validation ─────────────────────────────────────────────────────────────
  function validate() {
    const errs = {};
    ROLES.forEach(({ key, required }) => {
      const acc = form[key];
      if (!acc.enabled && !required) return;
      if (!acc.full_name.trim()) errs[`${key}.full_name`] = "Required";
      if (!acc.email.trim()) {
        errs[`${key}.email`] = "Required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(acc.email)) {
        errs[`${key}.email`] = "Invalid email";
      }
    });
    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError("");

    const toCreate = ROLES.filter(
      ({ key, required }) => form[key].enabled || required,
    );
    const outcomes = [];

    for (const { key } of toCreate) {
      const acc = form[key];
      const fd = new FormData();
      fd.append("email", acc.email.trim().toLowerCase());
      fd.append("full_name", acc.full_name.trim());
      fd.append("phone", acc.phone.trim());
      fd.append("role", key);
      fd.append("lga", selectedLGA);

      const res = await createAdminAccount(fd);

      outcomes.push({
        role: key,
        full_name: acc.full_name.trim(),
        email: acc.email.trim().toLowerCase(),
        password: res.tempPassword ?? null,
        error: res.error ?? null,
      });
    }

    setResults(outcomes);
    setSubmitting(false);

    const anySuccess = outcomes.some((o) => !o.error);
    if (anySuccess) {
      setStep("done");
    } else {
      setSubmitError("All account creations failed. Check errors below.");
    }
  }

  // ── Enabled roles count ────────────────────────────────────────────────────
  const enabledCount = ROLES.filter(
    ({ key, required }) => form[key].enabled || required,
  ).length;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-off-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Back link */}
        <Link
          href="/dashboard/admins"
          className="inline-flex items-center gap-1.5 text-sm text-text-gray hover:text-text-dark transition-colors mb-6"
        >
          <ArrowLeft size={15} /> Admin Management
        </Link>

        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary-green flex items-center justify-center">
              <Building2 size={19} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold font-primary text-text-dark leading-tight">
                LGA Admin Setup
              </h1>
              <p className="text-sm text-text-gray">
                Create all admin accounts for a Local Government Area in one
                step
              </p>
            </div>
          </div>
        </div>

        {/* Steps indicator */}
        <StepIndicator step={step} />

        <AnimatePresence mode="wait">
          {/* ── Step 1: Pick LGA ── */}
          {step === "lga" && (
            <StepSlide key="lga">
              <SectionCard
                title="Select Local Government Area"
                subtitle="Choose the LGA you want to set up admin accounts for"
              >
                <input
                  type="text"
                  value={lgaSearch}
                  onChange={(e) => setLgaSearch(e.target.value)}
                  placeholder="Search LGA…"
                  className="w-full px-4 py-2.5 rounded-xl border border-border-gray text-sm text-text-dark placeholder-text-light focus:outline-none focus:border-accent-green focus:ring-2 focus:ring-accent-green/20 transition-all mb-4"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
                  {filteredLGAs.map((lga) => (
                    <button
                      key={lga}
                      onClick={() => setSelectedLGA(lga)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left text-sm font-medium transition-all ${
                        selectedLGA === lga
                          ? "border-primary-green bg-light-green/30 text-primary-green"
                          : "border-border-gray bg-white text-text-dark hover:border-accent-green/50 hover:bg-off-white"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                          selectedLGA === lga
                            ? "border-primary-green bg-primary-green"
                            : "border-border-gray"
                        }`}
                      >
                        {selectedLGA === lga && (
                          <Check size={11} className="text-white" />
                        )}
                      </div>
                      {lga}
                    </button>
                  ))}
                  {filteredLGAs.length === 0 && (
                    <p className="col-span-2 text-center py-8 text-sm text-text-gray">
                      No LGA matches your search.
                    </p>
                  )}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => selectedLGA && setStep("accounts")}
                    disabled={!selectedLGA}
                    className="flex items-center gap-2 px-6 py-3 bg-primary-green text-white rounded-xl text-sm font-semibold hover:bg-secondary-green transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                  >
                    Continue — {selectedLGA || "Pick an LGA"}{" "}
                    <ChevronRight size={15} />
                  </button>
                </div>
              </SectionCard>
            </StepSlide>
          )}

          {/* ── Step 2: Account details ── */}
          {step === "accounts" && (
            <StepSlide key="accounts">
              <div className="space-y-4">
                {/* LGA badge */}
                <div className="flex items-center gap-2 px-4 py-3 bg-white rounded-xl border border-border-gray">
                  <Building2 size={15} className="text-primary-green" />
                  <span className="text-sm font-semibold text-text-dark">
                    {selectedLGA}
                  </span>
                  <button
                    onClick={() => setStep("lga")}
                    className="ml-auto text-xs text-text-gray hover:text-primary-green transition-colors"
                  >
                    Change LGA
                  </button>
                </div>

                {/* Info note */}
                <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <AlertCircle
                    size={15}
                    className="text-amber-600 mt-0.5 shrink-0"
                  />
                  <p className="text-xs text-amber-700">
                    The <strong>LGA Super User</strong> account is required. All
                    other roles are optional — toggle them on to create accounts
                    now, or skip to add them later. Passwords are auto-generated
                    and shown once after submission.
                  </p>
                </div>

                {/* Role cards */}
                {ROLES.map((roleDef) => (
                  <RoleAccountCard
                    key={roleDef.key}
                    roleDef={roleDef}
                    values={form[roleDef.key]}
                    errors={validationErrors}
                    onToggle={() => toggleRole(roleDef.key)}
                    onChange={(field, value) =>
                      setField(roleDef.key, field, value)
                    }
                  />
                ))}

                {submitError && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                    <AlertCircle
                      size={14}
                      className="text-red-500 mt-0.5 shrink-0"
                    />
                    <p className="text-sm text-red-700">{submitError}</p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => setStep("lga")}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-border-gray text-sm font-medium text-text-gray hover:bg-white transition-colors"
                  >
                    <ChevronLeft size={14} /> Back
                  </button>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-text-gray">
                      {enabledCount} account{enabledCount !== 1 ? "s" : ""} to
                      create
                    </span>
                    <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="flex items-center gap-2 px-6 py-3 bg-primary-green text-white rounded-xl text-sm font-semibold hover:bg-secondary-green transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
                    >
                      {submitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{" "}
                          Creating…
                        </>
                      ) : (
                        <>
                          Create {enabledCount} Account
                          {enabledCount !== 1 ? "s" : ""} <Sparkles size={14} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </StepSlide>
          )}

          {/* ── Step 3: Done — credentials screen ── */}
          {step === "done" && (
            <StepSlide key="done">
              <SectionCard
                title={`${selectedLGA} — Accounts Created`}
                subtitle="Save these passwords now. They will not be shown again."
              >
                {/* Summary */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex-1 p-4 bg-light-green/30 rounded-xl border border-accent-green/30 text-center">
                    <div className="text-2xl font-extrabold font-primary text-primary-green">
                      {results.filter((r) => !r.error).length}
                    </div>
                    <div className="text-xs text-primary-green font-medium mt-0.5">
                      Created
                    </div>
                  </div>
                  {results.some((r) => r.error) && (
                    <div className="flex-1 p-4 bg-red-50 rounded-xl border border-red-200 text-center">
                      <div className="text-2xl font-extrabold font-primary text-red-600">
                        {results.filter((r) => r.error).length}
                      </div>
                      <div className="text-xs text-red-600 font-medium mt-0.5">
                        Failed
                      </div>
                    </div>
                  )}
                </div>

                {/* Credential cards */}
                <div className="space-y-3">
                  {results.map((result) => {
                    const roleDef = ROLES.find((r) => r.key === result.role);
                    const Icon = roleDef?.icon || Users;
                    return (
                      <div
                        key={result.role}
                        className={`rounded-xl border overflow-hidden ${result.error ? "border-red-200 bg-red-50" : "border-border-gray bg-white"}`}
                      >
                        {/* Role header */}
                        <div
                          className={`flex items-center gap-3 px-4 py-3 border-b ${result.error ? "border-red-200 bg-red-100/50" : "border-border-gray bg-off-white/60"}`}
                        >
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center ${result.error ? "bg-red-100" : roleDef?.bg} ${result.error ? "border-red-200" : roleDef?.border} border`}
                          >
                            <Icon
                              size={14}
                              className={
                                result.error ? "text-red-500" : roleDef?.color
                              }
                            />
                          </div>
                          <div className="flex-1">
                            <span className="text-sm font-semibold text-text-dark">
                              {roleDef?.label}
                            </span>
                            <span className="text-xs text-text-gray ml-2">
                              {result.full_name}
                            </span>
                          </div>
                          {result.error ? (
                            <span className="text-xs text-red-600 font-medium">
                              Failed
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-accent-green font-medium">
                              <Check size={12} /> Created
                            </span>
                          )}
                        </div>

                        {result.error ? (
                          <div className="px-4 py-3">
                            <p className="text-xs text-red-700">
                              {result.error}
                            </p>
                          </div>
                        ) : (
                          <div className="px-4 py-3 space-y-2">
                            <CredentialRow label="Email" value={result.email} />
                            <CredentialRow
                              label="Password"
                              value={result.password}
                              mono
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Warning */}
                <div className="mt-5 flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <AlertCircle
                    size={14}
                    className="text-amber-600 mt-0.5 shrink-0"
                  />
                  <p className="text-xs text-amber-700">
                    Each admin must change their password on first login. Share
                    credentials securely — these passwords are shown only once.
                  </p>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => {
                      setForm(emptyForm());
                      setResults([]);
                      setSelectedLGA("");
                      setLgaSearch("");
                      setStep("lga");
                    }}
                    className="flex-1 px-4 py-3 rounded-xl border border-border-gray text-sm font-medium text-text-gray hover:bg-white transition-colors"
                  >
                    Set Up Another LGA
                  </button>
                  <Link
                    href="/dashboard/admins"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary-green text-white text-sm font-semibold hover:bg-secondary-green transition-colors"
                  >
                    <Users size={15} /> View All Admins
                  </Link>
                </div>
              </SectionCard>
            </StepSlide>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Role Account Card ─────────────────────────────────────────────────────────
function RoleAccountCard({ roleDef, values, errors, onToggle, onChange }) {
  const {
    key,
    label,
    icon: Icon,
    color,
    bg,
    border,
    badge,
    required,
    desc,
  } = roleDef;
  const isEnabled = values.enabled || required;

  return (
    <div
      className={`rounded-2xl border transition-all overflow-hidden ${
        isEnabled ? "border-accent-green/40 shadow-sm" : "border-border-gray"
      }`}
    >
      {/* Card header */}
      <div
        className={`flex items-center gap-3 px-5 py-4 transition-colors cursor-pointer ${
          isEnabled ? "bg-white" : "bg-off-white/60"
        }`}
        onClick={!required ? onToggle : undefined}
      >
        <div
          className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 transition-all ${
            isEnabled
              ? `${bg} ${border}`
              : "bg-border-gray/30 border-border-gray"
          }`}
        >
          <Icon size={17} className={isEnabled ? color : "text-text-light"} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-sm font-semibold transition-colors ${isEnabled ? "text-text-dark" : "text-text-gray"}`}
            >
              {label}
            </span>
            {required && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
                Required
              </span>
            )}
            {!required && isEnabled && (
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge}`}
              >
                Enabled
              </span>
            )}
          </div>
          <p className="text-xs text-text-gray mt-0.5 line-clamp-1">{desc}</p>
        </div>

        {!required && (
          <div
            className={`w-10 h-6 rounded-full relative transition-all shrink-0 ${
              isEnabled ? "bg-primary-green" : "bg-border-gray"
            }`}
          >
            <div
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
                isEnabled ? "left-[18px]" : "left-0.5"
              }`}
            />
          </div>
        )}
      </div>

      {/* Fields */}
      <AnimatePresence>
        {isEnabled && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-3 border-t border-border-gray/60 grid sm:grid-cols-2 gap-4 bg-white">
              <FormField
                label="Full Name"
                required
                error={errors[`${key}.full_name`]}
              >
                <input
                  type="text"
                  value={values.full_name}
                  onChange={(e) => onChange("full_name", e.target.value)}
                  placeholder="e.g. Adewale Johnson"
                  className={inputCls(errors[`${key}.full_name`])}
                />
              </FormField>
              <FormField
                label="Email Address"
                required
                error={errors[`${key}.email`]}
              >
                <input
                  type="email"
                  value={values.email}
                  onChange={(e) => onChange("email", e.target.value)}
                  placeholder="admin@example.com"
                  autoComplete="off"
                  className={inputCls(errors[`${key}.email`])}
                />
              </FormField>
              <FormField label="Phone Number" className="sm:col-span-2">
                <input
                  type="tel"
                  value={values.phone}
                  onChange={(e) => onChange("phone", e.target.value)}
                  placeholder="+234 800 000 0000"
                  className={inputCls()}
                />
              </FormField>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Credential display row ───────────────────────────────────────────────────
function CredentialRow({ label, value, mono }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-text-gray w-16 shrink-0">{label}</span>
      <div className="flex-1 flex items-center gap-1 px-3 py-1.5 bg-off-white rounded-lg border border-border-gray min-w-0">
        <span
          className={`flex-1 text-xs text-text-dark truncate ${mono ? "font-mono tracking-wide" : ""}`}
        >
          {value}
        </span>
        <CopyButton text={value} />
      </div>
    </div>
  );
}

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepIndicator({ step }) {
  const steps = [
    { key: "lga", label: "Select LGA" },
    { key: "accounts", label: "Account Details" },
    { key: "done", label: "Credentials" },
  ];
  const idx = steps.findIndex((s) => s.key === step);

  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((s, i) => (
        <div key={s.key} className="flex items-center flex-1 last:flex-none">
          <div className="flex items-center gap-2 shrink-0">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i < idx
                  ? "bg-accent-green text-white"
                  : i === idx
                    ? "bg-primary-green text-white"
                    : "bg-border-gray text-text-gray"
              }`}
            >
              {i < idx ? <Check size={12} /> : i + 1}
            </div>
            <span
              className={`text-xs font-medium hidden sm:block ${i === idx ? "text-text-dark" : "text-text-gray"}`}
            >
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`flex-1 h-px mx-3 transition-all ${i < idx ? "bg-accent-green" : "bg-border-gray"}`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Shared small components ──────────────────────────────────────────────────
function StepSlide({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.22 }}
    >
      {children}
    </motion.div>
  );
}

function SectionCard({ title, subtitle, children }) {
  return (
    <div className="bg-white rounded-2xl border border-border-gray shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-border-gray">
        <h2 className="text-base font-semibold font-primary text-text-dark">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-text-gray mt-0.5">{subtitle}</p>
        )}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function FormField({ label, required, error, children, className = "" }) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-text-dark mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

function inputCls(error) {
  return `w-full px-3 py-2.5 rounded-lg border text-sm text-text-dark placeholder-text-light focus:outline-none transition-all ${
    error
      ? "border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-100"
      : "border-border-gray focus:border-accent-green focus:ring-2 focus:ring-accent-green/20"
  }`;
}
