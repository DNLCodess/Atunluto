"use client";

// components/common/reg-form.jsx
// Public-facing registration form.
// ALL geographic data (LGA names, wards, polling units) is sourced from
// the oyo_south_polling_units / oyo_south_wards tables via React Query hooks.
// No hardcoded ward/LGA data is imported from static files.

import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  OYO_SOUTH_LGA_NAMES,
  useWardsForLGA,
  puKeys,
  usePollingUnitsForWard,
  prefetchPollingUnits,
} from "@/hooks/use-pu";
import MembershipCardDownload from "@/components/common/membership-card-download";

// ─── Shared spinner ───────────────────────────────────────────────────────────

function Spinner({ className = "h-4 w-4 text-text-gray" }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

// ─── Field Wrapper ────────────────────────────────────────────────────────────

function FieldWrapper({ label, required, hint, error, children }) {
  return (
    <div data-error={!!error}>
      <label className="block font-secondary text-sm font-semibold mb-2 text-text-dark">
        {label} {required && <span className="text-red-500">*</span>}
        {hint && <span className="font-normal text-text-gray"> ({hint})</span>}
      </label>
      {children}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-1.5 text-xs text-red-600"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Form ────────────────────────────────────────────────────────────────

export default function MemberRegistrationForm({
  onSuccess,
  onError,
  showHeader = true,
  submitButtonText = "Complete Registration",
  className = "",
}) {
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    fullName: "",
    address: "",
    phone: "",
    whatsapp: "",
    messenger: "",
    lga: "",
    ward: "",
    pollingUnit: "",
    dateOfBirth: "",
    gender: "",
  });

  const [profileImage, setProfileImage] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [successData, setSuccessData] = useState(null);

  const fileInputRef = useRef(null);

  // ── Cascading dropdown data (from DB) ─────────────────────────────────────

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
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  function handleLGAChange(lga) {
    setForm((prev) => ({ ...prev, lga, ward: "", pollingUnit: "" }));
    setErrors((prev) => ({ ...prev, lga: "", ward: "", pollingUnit: "" }));

    // Prefetch PUs for every ward in this LGA immediately on LGA selection.
    // Wards are already cached by LGAPrefetcher — this runs synchronously.
    const wards = queryClient.getQueryData(puKeys.wards(lga)) ?? [];
    wards.forEach(({ ward_name }) =>
      prefetchPollingUnits(queryClient, lga, ward_name),
    );
  }
  function handleWardChange(ward) {
    setForm((prev) => ({ ...prev, ward, pollingUnit: "" }));
    setErrors((prev) => ({ ...prev, ward: "", pollingUnit: "" }));
  }

  /**
   * When the user focuses the Ward dropdown, prefetch PUs for every ward in
   * this LGA in parallel. By the time they pick a ward and tab to the PU
   * dropdown, the data is already cached.
   */

  async function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        profileImage: "Only JPEG, PNG, or WebP images are allowed",
      }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        profileImage: "Image must be under 5 MB",
      }));
      return;
    }
    setProfileImage(file);
    setErrors((prev) => ({ ...prev, profileImage: "" }));
    setImagePreview(URL.createObjectURL(file));
    setUploadedImageUrl(null);
    setImageUploading(true);
    try {
      const lga = encodeURIComponent(form.lga || "public");
      const sigRes = await fetch(`/api/public-cloudinary-sign?lga=${lga}`);
      if (!sigRes.ok) throw new Error("Failed to get upload signature");
      const { signature, timestamp, folder, cloudName, apiKey } =
        await sigRes.json();

      const fd = new FormData();
      fd.append("file", file);
      fd.append("api_key", apiKey);
      fd.append("timestamp", String(timestamp));
      fd.append("signature", signature);
      fd.append("folder", folder);

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: "POST", body: fd },
      );
      if (!uploadRes.ok) throw new Error("Image upload failed");
      const uploadData = await uploadRes.json();
      setUploadedImageUrl(uploadData.secure_url);
    } catch {
      setErrors((prev) => ({
        ...prev,
        profileImage: "Upload failed. Please try again.",
      }));
      setImagePreview(null);
      setProfileImage(null);
      setUploadedImageUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setImageUploading(false);
    }
  }

  function calculateAge(dob) {
    const today = new Date();
    const birth = new Date(dob);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }

  function validate() {
    const e = {};
    if (!form.fullName.trim()) e.fullName = "Full name is required";
    if (!form.address.trim()) e.address = "Address is required";
    if (!form.phone.trim()) e.phone = "Phone number is required";
    if (!form.whatsapp.trim()) e.whatsapp = "WhatsApp number is required";
    if (!form.lga) e.lga = "Please select your LGA";
    if (!form.ward) e.ward = "Please select your ward";
    if (!form.pollingUnit) e.pollingUnit = "Please select your polling unit";
    if (!form.gender) e.gender = "Please select your gender";
    if (!form.dateOfBirth) {
      e.dateOfBirth = "Date of birth is required";
    } else if (calculateAge(form.dateOfBirth) < 18) {
      e.dateOfBirth = "You must be at least 18 years old to register";
    }
    if (!profileImage) {
      e.profileImage = "Profile photo is required";
    } else if (imageUploading) {
      e.profileImage = "Please wait for the photo to finish uploading";
    } else if (!uploadedImageUrl) {
      e.profileImage = "Photo upload failed. Please re-select your photo.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) {
      const first = document.querySelector("[data-error='true']");
      first?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setIsSubmitting(true);
    setSubmitStatus(null);
    try {
      const res = await fetch("/api/register-member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: form.fullName,
          address: form.address,
          phone: form.phone,
          whatsapp: form.whatsapp,
          messenger: form.messenger || "",
          lga: form.lga,
          ward: form.ward,
          polling_unit: form.pollingUnit,
          date_of_birth: form.dateOfBirth,
          gender: form.gender,
          profile_image_url: uploadedImageUrl,
        }),
      });
      const contentType = res.headers.get("content-type");
      if (!contentType?.includes("application/json")) {
        throw new Error("Server returned an invalid response.");
      }
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to register member");
      setSubmitStatus("success");
      setSuccessData(result.data ?? null);
      if (onSuccess) onSuccess(result.data);
    } catch (err) {
      console.error("Registration error:", err);
      setSubmitStatus("error");
      setErrors((prev) => ({
        ...prev,
        submit: err.message || "An error occurred",
      }));
      if (onError) onError(err);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleReset() {
    setForm({
      fullName: "",
      address: "",
      phone: "",
      whatsapp: "",
      messenger: "",
      lga: "",
      ward: "",
      pollingUnit: "",
      dateOfBirth: "",
      gender: "",
    });
    setProfileImage(null);
    setImagePreview(null);
    setUploadedImageUrl(null);
    setSubmitStatus(null);
    setSuccessData(null);
    setErrors({});
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const maxDOB = new Date(new Date().setFullYear(new Date().getFullYear() - 18))
    .toISOString()
    .split("T")[0];

  function inputCls(field) {
    return `w-full px-4 py-3 rounded-xl border-2 font-secondary text-sm text-text-dark bg-white placeholder-text-light transition-all focus:outline-none focus:border-primary-green ${
      errors[field] ? "border-red-400" : "border-border-gray"
    }`;
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className={className}>
      {showHeader && (
        <div className="mb-8">
          <h2 className="font-primary text-2xl font-bold text-text-dark mb-2">
            Membership Registration
          </h2>
          <p className="font-secondary text-sm text-text-gray">
            Complete the form below to register a new member. Fields marked{" "}
            <span className="text-red-500">*</span> are required. Members must
            be at least 18 years old.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* ── Profile Photo ── */}
        <div data-error={!!errors.profileImage}>
          <label className="block font-secondary text-sm font-semibold mb-2 text-text-dark">
            Profile Photo <span className="text-red-500">*</span>
          </label>
          <div className="flex items-start gap-5">
            <div
              className={`w-28 h-28 rounded-xl border-2 overflow-hidden flex items-center justify-center bg-off-white shrink-0 ${
                errors.profileImage ? "border-red-400" : "border-border-gray"
              }`}
            >
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center p-3">
                  <svg
                    className="w-10 h-10 mx-auto mb-1 text-text-light"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <p className="text-xs text-text-light">No photo</p>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                className="hidden"
                id="profileImage"
              />
              <label
                htmlFor="profileImage"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent-green hover:bg-primary-green text-white font-secondary font-medium text-sm cursor-pointer transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                {imagePreview ? "Change Photo" : "Choose Photo"}
              </label>
              {imageUploading && (
                <p className="mt-2 text-xs text-text-gray flex items-center gap-1.5">
                  <Spinner className="h-3.5 w-3.5 text-accent-green" />
                  Uploading photo…
                </p>
              )}
              {!imageUploading && uploadedImageUrl && (
                <p className="mt-2 text-xs text-accent-green flex items-center gap-1.5">
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Photo uploaded successfully
                </p>
              )}
              {!imageUploading && !uploadedImageUrl && (
                <p className="mt-2 text-xs text-text-gray">
                  JPEG, PNG or WebP · Max 5 MB
                </p>
              )}
              {errors.profileImage && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.profileImage}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Full Name ── */}
        <FieldWrapper label="Full Name" required error={errors.fullName}>
          <input
            type="text"
            value={form.fullName}
            onChange={(e) => set("fullName", e.target.value)}
            placeholder="e.g., Oluwasegun Theophilus Oladimeji"
            className={inputCls("fullName")}
          />
        </FieldWrapper>

        {/* ── DOB + Gender ── */}
        <div className="grid md:grid-cols-2 gap-5">
          <FieldWrapper
            label="Date of Birth"
            required
            error={errors.dateOfBirth}
          >
            <input
              type="date"
              value={form.dateOfBirth}
              max={maxDOB}
              onChange={(e) => set("dateOfBirth", e.target.value)}
              className={inputCls("dateOfBirth")}
            />
          </FieldWrapper>
          <FieldWrapper label="Gender" required error={errors.gender}>
            <select
              value={form.gender}
              onChange={(e) => set("gender", e.target.value)}
              className={`${inputCls("gender")} ${!form.gender ? "text-text-light" : ""}`}
            >
              <option value="">— Select gender —</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </FieldWrapper>
        </div>

        {/* ── Address ── */}
        <FieldWrapper
          label="Residential Address"
          required
          error={errors.address}
        >
          <textarea
            value={form.address}
            onChange={(e) => set("address", e.target.value)}
            rows={3}
            placeholder="Enter complete residential address"
            className={`${inputCls("address")} resize-none`}
          />
        </FieldWrapper>

        {/* ── Phone + WhatsApp ── */}
        <div className="grid md:grid-cols-2 gap-5">
          <FieldWrapper label="Phone Number" required error={errors.phone}>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="080XXXXXXXX"
              className={inputCls("phone")}
            />
          </FieldWrapper>
          <FieldWrapper
            label="WhatsApp Number"
            required
            error={errors.whatsapp}
          >
            <input
              type="tel"
              value={form.whatsapp}
              onChange={(e) => set("whatsapp", e.target.value)}
              placeholder="080XXXXXXXX"
              className={inputCls("whatsapp")}
            />
          </FieldWrapper>
        </div>

        {/* ── Messenger (optional) ── */}
        <FieldWrapper label="Facebook Messenger ID" hint="Optional">
          <input
            type="text"
            value={form.messenger}
            onChange={(e) => set("messenger", e.target.value)}
            placeholder="Messenger username"
            className={inputCls("messenger")}
          />
        </FieldWrapper>

        {/* ── LGA ── */}
        <div className="grid md:grid-cols-2 gap-5">
          <FieldWrapper
            label="Local Government Area"
            required
            error={errors.lga}
          >
            <select
              value={form.lga}
              onChange={(e) => handleLGAChange(e.target.value)}
              className={`${inputCls("lga")} ${!form.lga ? "text-text-light" : ""}`}
            >
              <option value="">— Select LGA —</option>
              {OYO_SOUTH_LGA_NAMES.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </FieldWrapper>

          {/* ── Ward — fetched from oyo_south_wards table ── */}
          <FieldWrapper label="Ward" required error={errors.ward}>
            <div className="relative">
              <select
                value={form.ward}
                onChange={(e) => handleWardChange(e.target.value)}
                disabled={!form.lga || wardsLoading}
                className={`${inputCls("ward")} ${!form.ward ? "text-text-light" : ""} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <option value="">
                  {wardsLoading
                    ? "Loading wards…"
                    : wardsError
                      ? "Failed to load — please retry"
                      : !form.lga
                        ? "— Select LGA first —"
                        : "— Select ward —"}
                </option>
                {wardOptions.map((w) => (
                  <option key={w.ward_number} value={w.ward_name}>
                    {w.ward_name}
                  </option>
                ))}
              </select>
              {wardsLoading && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Spinner />
                </div>
              )}
            </div>
            {wardsError && (
              <p className="mt-1.5 text-xs text-amber-600">
                Could not load wards. Check your connection and try again.
              </p>
            )}
          </FieldWrapper>
        </div>

        {/* ── Polling Unit — fetched from oyo_south_polling_units table ── */}
        <FieldWrapper label="Polling Unit" required error={errors.pollingUnit}>
          <div className="relative">
            <select
              value={form.pollingUnit}
              onChange={(e) => set("pollingUnit", e.target.value)}
              disabled={!form.ward || puLoading}
              className={`${inputCls("pollingUnit")} ${!form.pollingUnit ? "text-text-light" : ""} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <option value="">
                {puLoading
                  ? "Loading polling units…"
                  : puError
                    ? "Failed to load — please retry"
                    : !form.ward
                      ? "— Select ward first —"
                      : pollingUnitsData.length === 0
                        ? "No polling units found for this ward"
                        : "— Select polling unit —"}
              </option>
              {pollingUnitsData.map((pu) => (
                <option key={pu.id} value={pu.pu_name}>
                  {pu.pu_code} — {pu.pu_name}
                </option>
              ))}
            </select>
            {puLoading && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <Spinner />
              </div>
            )}
          </div>
          {puError && (
            <p className="mt-1.5 text-xs text-amber-600">
              Could not load polling units. Check your connection and try again.
            </p>
          )}
          {!puLoading &&
            !puError &&
            form.ward &&
            pollingUnitsData.length === 0 && (
              <p className="mt-1.5 text-xs text-text-gray">
                No polling units found for this ward. Contact your
                administrator.
              </p>
            )}
        </FieldWrapper>

        {/* ── Submit ── */}
        <div className="pt-2">
          <motion.button
            type="submit"
            disabled={isSubmitting || imageUploading}
            whileHover={{ scale: isSubmitting || imageUploading ? 1 : 1.01 }}
            whileTap={{ scale: isSubmitting || imageUploading ? 1 : 0.99 }}
            className="w-full px-8 py-4 rounded-xl font-secondary font-semibold text-base text-white bg-primary-green hover:bg-secondary-green disabled:bg-text-gray disabled:opacity-70 disabled:cursor-not-allowed shadow-lg transition-colors"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner className="h-5 w-5" /> Submitting…
              </span>
            ) : imageUploading ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner className="h-5 w-5" /> Uploading photo…
              </span>
            ) : (
              submitButtonText
            )}
          </motion.button>
        </div>

        {/* ── Status messages ── */}
        <AnimatePresence>
          {submitStatus === "success" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-6 rounded-xl text-center bg-light-green border-2 border-accent-green"
            >
              <div className="w-12 h-12 rounded-full bg-primary-green flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="font-primary font-bold text-lg text-primary-green mb-1">
                Registration Successful!
              </p>
              <p className="font-secondary text-sm text-secondary-green mb-3">
                Welcome to the Atunluto Group family.
              </p>
              {successData && <MembershipCardDownload member={successData} />}
              <button
                type="button"
                onClick={handleReset}
                className="mt-4 px-6 py-2.5 rounded-xl border-2 border-primary-green text-primary-green font-secondary font-medium text-sm hover:bg-primary-green hover:text-white transition-colors"
              >
                Register Another Member
              </button>
            </motion.div>
          )}

          {submitStatus === "error" && errors.submit && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-6 rounded-xl text-center bg-red-50 border-2 border-red-300"
            >
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <p className="font-primary font-bold text-lg text-red-700 mb-1">
                Registration Failed
              </p>
              <p className="font-secondary text-sm text-red-600">
                {errors.submit}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
}
