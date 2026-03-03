"use client";

// components/MemberRegistrationForm.jsx
// Public-facing registration form — uses OYO_SOUTH_LGAS for cascading
// LGA → Ward → Polling Unit dropdowns. All styling via Tailwind tokens.

import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef } from "react";
import {
  OYO_SOUTH_LGAS,
  LGA_NAMES,
  getWardsForLGA,
  getPollingUnitsForWard,
} from "@/lib/oyo-south-lgas";

export default function MemberRegistrationForm({
  onSuccess,
  onError,
  showHeader = true,
  submitButtonText = "Complete Registration",
  className = "",
}) {
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
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // "success" | "error" | null
  const [membershipNumber, setMembershipNumber] = useState(null);
  const fileInputRef = useRef(null);

  // ── Derived dropdown options ───────────────────────────────────────────────
  const wardOptions = form.lga ? getWardsForLGA(form.lga) : [];
  const pollingUnitOptions = form.ward
    ? getPollingUnitsForWard(form.lga, form.ward)
    : [];

  // ── Handlers ──────────────────────────────────────────────────────────────
  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  function handleLGAChange(lga) {
    setForm((prev) => ({ ...prev, lga, ward: "", pollingUnit: "" }));
    setErrors((prev) => ({ ...prev, lga: "", ward: "", pollingUnit: "" }));
  }

  function handleWardChange(ward) {
    setForm((prev) => ({ ...prev, ward, pollingUnit: "" }));
    setErrors((prev) => ({ ...prev, ward: "", pollingUnit: "" }));
  }

  function handleImageChange(e) {
    const file = e.target.files[0];
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
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
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
    if (!profileImage) e.profileImage = "Profile photo is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) {
      // Scroll to first error
      const first = document.querySelector("[data-error='true']");
      first?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const fd = new FormData();
      fd.append("full_name", form.fullName);
      fd.append("address", form.address);
      fd.append("phone", form.phone);
      fd.append("whatsapp", form.whatsapp);
      fd.append("messenger", form.messenger || "");
      fd.append("lga", form.lga);
      fd.append("ward", form.ward);
      fd.append("polling_unit", form.pollingUnit);
      fd.append("date_of_birth", form.dateOfBirth);
      fd.append("gender", form.gender);
      if (profileImage) fd.append("profile_image", profileImage);

      const res = await fetch("/api/register-member", {
        method: "POST",
        body: fd,
      });

      const contentType = res.headers.get("content-type");
      if (!contentType?.includes("application/json")) {
        throw new Error("Server returned an invalid response.");
      }

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to register member");

      setSubmitStatus("success");
      setMembershipNumber(result.data?.membership_number ?? null);
      if (onSuccess) onSuccess(result.data);

      // Reset after 4 s
      setTimeout(() => {
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
        setSubmitStatus(null);
        setMembershipNumber(null);
        setErrors({});
        if (fileInputRef.current) fileInputRef.current.value = "";
      }, 4000);
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

  // ── Max DOB date (must be 18+) ─────────────────────────────────────────────
  const maxDOB = new Date(new Date().setFullYear(new Date().getFullYear() - 18))
    .toISOString()
    .split("T")[0];

  // ── Shared input class helper ──────────────────────────────────────────────
  function inputCls(field) {
    return `w-full px-4 py-3 rounded-xl border-2 font-secondary text-sm text-text-dark bg-white placeholder-text-light transition-all focus:outline-none focus:border-primary-green ${
      errors[field] ? "border-red-400" : "border-border-gray"
    }`;
  }

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
              <p className="mt-2 text-xs text-text-gray">
                JPEG, PNG or WebP · Max 5 MB
              </p>
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
            data-error={!!errors.fullName}
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
              data-error={!!errors.dateOfBirth}
            />
          </FieldWrapper>
          <FieldWrapper label="Gender" required error={errors.gender}>
            <select
              value={form.gender}
              onChange={(e) => set("gender", e.target.value)}
              className={`${inputCls("gender")} ${!form.gender ? "text-text-light" : ""}`}
              data-error={!!errors.gender}
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
            data-error={!!errors.address}
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
              data-error={!!errors.phone}
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
              data-error={!!errors.whatsapp}
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

        {/* ── LGA + Ward ── */}
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
              data-error={!!errors.lga}
            >
              <option value="">— Select LGA —</option>
              {LGA_NAMES.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </FieldWrapper>

          <FieldWrapper label="Ward" required error={errors.ward}>
            <select
              value={form.ward}
              onChange={(e) => handleWardChange(e.target.value)}
              disabled={!form.lga}
              className={`${inputCls("ward")} ${!form.ward ? "text-text-light" : ""} disabled:opacity-50 disabled:cursor-not-allowed`}
              data-error={!!errors.ward}
            >
              <option value="">— Select ward —</option>
              {wardOptions.map((ward) => (
                <option key={ward} value={ward}>
                  {ward}
                </option>
              ))}
            </select>
          </FieldWrapper>
        </div>

        {/* ── Polling Unit ── */}
        <FieldWrapper label="Polling Unit" required error={errors.pollingUnit}>
          <select
            value={form.pollingUnit}
            onChange={(e) => set("pollingUnit", e.target.value)}
            disabled={!form.ward}
            className={`${inputCls("pollingUnit")} ${!form.pollingUnit ? "text-text-light" : ""} disabled:opacity-50 disabled:cursor-not-allowed`}
            data-error={!!errors.pollingUnit}
          >
            <option value="">— Select polling unit —</option>
            {pollingUnitOptions.map((pu) => (
              <option key={pu} value={pu}>
                {pu}
              </option>
            ))}
          </select>
        </FieldWrapper>

        {/* ── Submit ── */}
        <div className="pt-2">
          <motion.button
            type="submit"
            disabled={isSubmitting}
            whileHover={{ scale: isSubmitting ? 1 : 1.01 }}
            whileTap={{ scale: isSubmitting ? 1 : 0.99 }}
            className="w-full px-8 py-4 rounded-xl font-secondary font-semibold text-base text-white bg-primary-green hover:bg-secondary-green disabled:bg-text-gray disabled:opacity-70 disabled:cursor-not-allowed shadow-lg transition-colors"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Submitting…
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
              {membershipNumber && (
                <div className="inline-block px-5 py-3 bg-white rounded-xl border border-light-green">
                  <p className="text-xs text-text-gray mb-1">
                    Membership Number
                  </p>
                  <p className="font-mono font-bold text-xl text-primary-green">
                    {membershipNumber}
                  </p>
                </div>
              )}
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

// ─── Field wrapper ─────────────────────────────────────────────────────────────
function FieldWrapper({ label, required, hint, error, children }) {
  return (
    <div data-error={!!error}>
      <label className="block font-secondary text-sm font-semibold mb-2 text-text-dark">
        {label} {required && <span className="text-red-500">*</span>}
        {hint && <span className="font-normal text-text-gray">({hint})</span>}
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
