"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  User,
  MapPin,
  Phone,
  X,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Camera,
  Loader2,
} from "lucide-react";
import { useCurrentAdmin } from "@/hooks/use-admins";
import {
  OYO_SOUTH_LGA_NAMES,
  useWardsForLGA,
  usePollingUnitsForWard,
  prefetchAllLGAWards,
  prefetchPollingUnits,
} from "@/hooks/use-pu";
import { createClient } from "@/supabase/client";

const GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

// ─── Primitives ───────────────────────────────────────────────────────────────

function Field({ label, required, error, children, hint }) {
  return (
    <div>
      <label className="block text-sm font-medium text-text-dark mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-text-gray mt-1">{hint}</p>}
      {error && (
        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
          <AlertCircle size={11} />
          {error}
        </p>
      )}
    </div>
  );
}

function Input({ error, ...props }) {
  return (
    <input
      {...props}
      className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-text-dark placeholder-text-light bg-white focus:outline-none transition-all ${
        error
          ? "border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-100"
          : "border-border-gray focus:border-accent-green focus:ring-2 focus:ring-accent-green/20"
      }`}
    />
  );
}

function SelectEl({ error, children, ...props }) {
  return (
    <select
      {...props}
      className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-text-dark bg-white focus:outline-none transition-all appearance-none ${
        error
          ? "border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-100"
          : "border-border-gray focus:border-accent-green focus:ring-2 focus:ring-accent-green/20"
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {children}
    </select>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

function InlineSpinner() {
  return (
    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
      <Loader2 size={14} className="animate-spin text-text-gray" />
    </div>
  );
}

// ─── Image Upload ─────────────────────────────────────────────────────────────

function ImageUpload({ lga, onUploaded, error }) {
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const supabase = createClient();

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image must be under 5MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setUploadError("Only image files are allowed");
      return;
    }
    setUploadError(null);
    setUploading(true);
    setPreview(URL.createObjectURL(file));
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const res = await fetch(
        `/api/admin/upload-url?lga=${encodeURIComponent(lga || "unknown")}&ext=${ext}`,
      );
      if (!res.ok) throw new Error("Failed to get upload URL");
      const { token, path, publicUrl } = await res.json();
      const { error: uploadErr } = await supabase.storage
        .from("members-images")
        .uploadToSignedUrl(path, token, file, { contentType: file.type });
      if (uploadErr) throw uploadErr;
      onUploaded(publicUrl);
    } catch (err) {
      console.error("Image upload error:", err);
      setUploadError("Upload failed. Please try again.");
      setPreview(null);
      onUploaded(null);
    } finally {
      setUploading(false);
    }
  }

  function handleClear(e) {
    e.stopPropagation();
    setPreview(null);
    setUploadError(null);
    onUploaded(null);
  }

  return (
    <div>
      <label className="block text-sm font-medium text-text-dark mb-1.5">
        Profile Photo{" "}
        <span className="text-text-light font-normal">(optional)</span>
      </label>
      <div
        className={`relative border-2 border-dashed rounded-xl flex flex-col items-center justify-center h-36 transition-colors ${
          error || uploadError
            ? "border-red-400 bg-red-50/30"
            : "border-border-gray hover:border-accent-green hover:bg-off-white"
        }`}
      >
        {preview ? (
          <>
            <img
              src={preview}
              alt="preview"
              className="h-full w-full object-cover rounded-xl"
            />
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-xl">
                <Loader2 size={24} className="text-white animate-spin" />
              </div>
            )}
            {!uploading && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-sm border border-border-gray hover:bg-red-50 transition-colors"
              >
                <X size={13} className="text-text-gray" />
              </button>
            )}
          </>
        ) : (
          <label className="flex flex-col items-center gap-2 cursor-pointer w-full h-full justify-center">
            <div className="w-10 h-10 rounded-full bg-light-green/50 flex items-center justify-center">
              <Camera size={18} className="text-primary-green" />
            </div>
            <span className="text-sm text-text-gray">
              Click to upload photo
            </span>
            <span className="text-xs text-text-light">JPEG, PNG — max 5MB</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFile}
              disabled={!lga}
              className="hidden"
            />
          </label>
        )}
      </div>
      {!lga && (
        <p className="text-xs text-text-light mt-1">
          Select an LGA first to enable photo upload
        </p>
      )}
      {(uploadError || error) && (
        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
          <AlertCircle size={11} />
          {uploadError || error}
        </p>
      )}
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, icon: Icon, children }) {
  return (
    <div className="bg-white rounded-2xl border border-border-gray overflow-hidden">
      <div className="px-5 py-4 border-b border-border-gray flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-light-green/50 flex items-center justify-center">
          <Icon size={14} className="text-primary-green" />
        </div>
        <h2 className="text-sm font-semibold text-text-dark font-primary">
          {title}
        </h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AddMemberPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: actor, isLoading: actorLoading } = useCurrentAdmin();

  const [form, setForm] = useState({
    full_name: "",
    date_of_birth: "",
    gender: "",
    address: "",
    phone: "",
    whatsapp: "",
    messenger: "",
    lga: "",
    ward: "",
    polling_unit: "",
  });
  const [profileImageUrl, setProfileImageUrl] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);

  // Pre-warm ward cache for all LGAs on mount (same as public form)
  useEffect(() => {
    prefetchAllLGAWards(queryClient);
  }, [queryClient]);

  // Lock LGA to admin's own LGA for non-state-admin roles
  useEffect(() => {
    if (actor?.lga && actor.role !== "state_admin") {
      setForm((f) => ({ ...f, lga: actor.lga }));
    }
  }, [actor]);

  // ── Cascading dropdown data (from DB) ──────────────────────────────────────

  const {
    data: wardOptions = [],
    isLoading: wardsLoading,
    isError: wardsError,
  } = useWardsForLGA(form.lga);

  const {
    data: pollingUnitsData = [],
    isLoading: puLoading,
    isError: puError,
  } = usePollingUnitsForWard(form.lga, form.ward);

  // ── Handlers ──────────────────────────────────────────────────────────────

  function set(field, value) {
    setForm((f) => {
      const next = { ...f, [field]: value };
      if (field === "lga") {
        next.ward = "";
        next.polling_unit = "";
      }
      if (field === "ward") {
        next.polling_unit = "";
      }
      return next;
    });
    if (errors[field]) setErrors((e) => ({ ...e, [field]: "" }));
  }

  // Prefetch all PUs for current LGA the moment the Ward dropdown is focused
  function handleWardFocus() {
    wardOptions.forEach((w) =>
      prefetchPollingUnits(queryClient, form.lga, w.ward_name),
    );
  }

  function validate() {
    const e = {};
    if (!form.full_name.trim()) e.full_name = "Full name is required";
    if (!form.date_of_birth) {
      e.date_of_birth = "Date of birth is required";
    } else {
      const age =
        (Date.now() - new Date(form.date_of_birth).getTime()) /
        (1000 * 60 * 60 * 24 * 365.25);
      if (age < 18) e.date_of_birth = "Member must be at least 18 years old";
    }
    if (!form.gender) e.gender = "Gender is required";
    if (!form.address.trim()) e.address = "Address is required";
    if (!form.phone.trim()) e.phone = "Phone number is required";
    if (!form.whatsapp.trim()) e.whatsapp = "WhatsApp number is required";
    if (!form.lga) e.lga = "LGA is required";
    if (!form.ward) e.ward = "Ward is required";
    if (!form.polling_unit) e.polling_unit = "Polling unit is required";
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/register-member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, profile_image_url: profileImageUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors({ _form: data.error || "Failed to register member." });
      } else {
        setSuccess(data.data);
      }
    } catch {
      setErrors({ _form: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  const maxDOB = new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  // ─── Loading ───────────────────────────────────────────────────────────────

  if (actorLoading) {
    return (
      <div className="min-h-screen bg-off-white flex items-center justify-center">
        <Loader2 size={28} className="text-accent-green animate-spin" />
      </div>
    );
  }

  // ─── Permission guard ──────────────────────────────────────────────────────

  const canRegister =
    actor &&
    ["state_admin", "super_user", "administrator", "registration"].includes(
      actor.role,
    );

  if (!canRegister) {
    return (
      <div className="min-h-screen bg-off-white flex items-center justify-center p-8">
        <div className="text-center">
          <AlertCircle size={40} className="mx-auto text-border-gray mb-4" />
          <p className="text-sm text-text-gray">
            You don't have permission to register members.
          </p>
        </div>
      </div>
    );
  }

  // ─── Success screen ────────────────────────────────────────────────────────

  if (success) {
    return (
      <div className="min-h-screen bg-off-white flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-border-gray p-8 w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-light-green flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={28} className="text-primary-green" />
          </div>
          <h2 className="text-xl font-extrabold font-primary text-text-dark mb-1">
            Member Registered
          </h2>
          <p className="text-text-gray text-sm mb-4">
            {success.full_name} has been successfully registered.
          </p>
          <div className="inline-block px-4 py-2 bg-light-green/50 rounded-lg mb-6">
            <span className="text-xs font-medium text-text-gray">
              Membership No.
            </span>
            <div className="text-lg font-extrabold font-primary text-primary-green">
              {success.membership_number}
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setSuccess(null);
                setForm({
                  full_name: "",
                  date_of_birth: "",
                  gender: "",
                  address: "",
                  phone: "",
                  whatsapp: "",
                  messenger: "",
                  lga: actor?.role !== "state_admin" ? actor?.lga || "" : "",
                  ward: "",
                  polling_unit: "",
                });
                setProfileImageUrl(null);
              }}
              className="flex-1 px-4 py-2.5 rounded-xl border border-border-gray text-sm font-medium text-text-gray hover:bg-off-white transition-colors"
            >
              Register Another
            </button>
            <button
              onClick={() => router.push("/dashboard/members")}
              className="flex-1 px-4 py-2.5 rounded-xl bg-primary-green text-white text-sm font-medium hover:bg-secondary-green transition-colors"
            >
              View Members
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Form ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-off-white">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-text-gray hover:text-text-dark transition-colors mb-4"
          >
            <ArrowLeft size={15} /> Back
          </button>
          <h1 className="text-2xl font-extrabold font-primary text-text-dark">
            Register New Member
          </h1>
          <p className="text-sm text-text-gray mt-1">
            All fields marked <span className="text-red-500">*</span> are
            required.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ── Personal Information ── */}
          <Section title="Personal Information" icon={User}>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Field label="Full Name" required error={errors.full_name}>
                  <Input
                    type="text"
                    value={form.full_name}
                    onChange={(e) => set("full_name", e.target.value)}
                    placeholder="Enter full legal name"
                    error={errors.full_name}
                  />
                </Field>
              </div>

              <Field
                label="Date of Birth"
                required
                error={errors.date_of_birth}
                hint="Must be 18 years or older"
              >
                <Input
                  type="date"
                  value={form.date_of_birth}
                  onChange={(e) => set("date_of_birth", e.target.value)}
                  max={maxDOB}
                  error={errors.date_of_birth}
                />
              </Field>

              <Field label="Gender" required error={errors.gender}>
                <SelectEl
                  value={form.gender}
                  onChange={(e) => set("gender", e.target.value)}
                  error={errors.gender}
                >
                  <option value="">Select gender</option>
                  {GENDERS.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </SelectEl>
              </Field>

              <div className="sm:col-span-2">
                <ImageUpload
                  lga={form.lga}
                  onUploaded={setProfileImageUrl}
                  error={errors.profile_image}
                />
              </div>
            </div>
          </Section>

          {/* ── Contact Information ── */}
          <Section title="Contact Information" icon={Phone}>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Field label="Home Address" required error={errors.address}>
                  <textarea
                    value={form.address}
                    onChange={(e) => set("address", e.target.value)}
                    placeholder="Enter full home address"
                    rows={3}
                    className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-text-dark placeholder-text-light bg-white focus:outline-none transition-all resize-none ${
                      errors.address
                        ? "border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                        : "border-border-gray focus:border-accent-green focus:ring-2 focus:ring-accent-green/20"
                    }`}
                  />
                  {errors.address && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle size={11} /> {errors.address}
                    </p>
                  )}
                </Field>
              </div>

              <Field label="Phone Number" required error={errors.phone}>
                <Input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  placeholder="+234 800 000 0000"
                  error={errors.phone}
                />
              </Field>

              <Field label="WhatsApp Number" required error={errors.whatsapp}>
                <Input
                  type="tel"
                  value={form.whatsapp}
                  onChange={(e) => set("whatsapp", e.target.value)}
                  placeholder="+234 800 000 0000"
                  error={errors.whatsapp}
                />
              </Field>

              <div className="sm:col-span-2">
                <Field
                  label="Facebook Messenger"
                  error={errors.messenger}
                  hint="Optional"
                >
                  <Input
                    type="text"
                    value={form.messenger}
                    onChange={(e) => set("messenger", e.target.value)}
                    placeholder="Facebook name or link"
                    error={errors.messenger}
                  />
                </Field>
              </div>
            </div>
          </Section>

          {/* ── Location ── */}
          <Section title="Location" icon={MapPin}>
            <div className="grid sm:grid-cols-2 gap-4">
              {/* LGA — locked for non-state-admin */}
              <div className="sm:col-span-2">
                <Field
                  label="Local Government Area"
                  required
                  error={errors.lga}
                >
                  {actor?.role !== "state_admin" && actor?.lga ? (
                    <div className="px-3.5 py-2.5 rounded-lg border border-border-gray bg-off-white text-sm text-text-gray flex items-center gap-2">
                      <MapPin size={14} />
                      {actor.lga}
                      <span className="ml-auto text-xs text-text-light">
                        Pre-assigned
                      </span>
                    </div>
                  ) : (
                    <SelectEl
                      value={form.lga}
                      onChange={(e) => set("lga", e.target.value)}
                      error={errors.lga}
                    >
                      <option value="">Select LGA</option>
                      {OYO_SOUTH_LGA_NAMES.map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </SelectEl>
                  )}
                  {errors.lga && (
                    <p className="text-xs text-red-600 mt-1">{errors.lga}</p>
                  )}
                </Field>
              </div>

              {/* Ward — from DB */}
              <Field label="Ward" required error={errors.ward}>
                <div className="relative">
                  <SelectEl
                    value={form.ward}
                    onChange={(e) => set("ward", e.target.value)}
                    onFocus={handleWardFocus}
                    disabled={!form.lga || wardsLoading}
                    error={errors.ward}
                  >
                    <option value="">
                      {wardsLoading
                        ? "Loading wards…"
                        : wardsError
                          ? "Failed to load"
                          : !form.lga
                            ? "Select LGA first"
                            : "Select ward"}
                    </option>
                    {wardOptions.map((w) => (
                      <option key={w.ward_number} value={w.ward_name}>
                        {w.ward_name}
                      </option>
                    ))}
                  </SelectEl>
                  {wardsLoading && <InlineSpinner />}
                </div>
                {wardsError && (
                  <p className="text-xs text-amber-600 mt-1">
                    Could not load wards. Check your connection.
                  </p>
                )}
              </Field>

              {/* Polling Unit — from DB */}
              <Field label="Polling Unit" required error={errors.polling_unit}>
                <div className="relative">
                  <SelectEl
                    value={form.polling_unit}
                    onChange={(e) => set("polling_unit", e.target.value)}
                    disabled={!form.ward || puLoading}
                    error={errors.polling_unit}
                  >
                    <option value="">
                      {puLoading
                        ? "Loading polling units…"
                        : puError
                          ? "Failed to load"
                          : !form.ward
                            ? "Select ward first"
                            : pollingUnitsData.length === 0
                              ? "No polling units found"
                              : "Select polling unit"}
                    </option>
                    {pollingUnitsData.map((pu) => (
                      <option key={pu.id} value={pu.pu_name}>
                        {pu.pu_code} — {pu.pu_name}
                      </option>
                    ))}
                  </SelectEl>
                  {puLoading && <InlineSpinner />}
                </div>
                {puError && (
                  <p className="text-xs text-amber-600 mt-1">
                    Could not load polling units. Check your connection.
                  </p>
                )}
              </Field>
            </div>
          </Section>

          {errors._form && (
            <div className="flex items-start gap-2 p-4 bg-red-50 rounded-xl border border-red-200">
              <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-red-700">{errors._form}</p>
            </div>
          )}

          <div className="flex gap-3 pb-8">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 rounded-xl border border-border-gray text-sm font-medium text-text-gray hover:bg-off-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 rounded-xl bg-primary-green text-white text-sm font-semibold hover:bg-secondary-green transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  Registering...
                </span>
              ) : (
                "Register Member"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
