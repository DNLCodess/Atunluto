"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { createClient } from "@/supabase/client";
import { lgaData } from "@/lib/data";

// LGA data with their wards

export default function MemberRegistrationForm({
  onSuccess,
  onError,
  showHeader = true,
  submitButtonText = "Complete Registration",
  className = "",
}) {
  const [formData, setFormData] = useState({
    fullName: "",
    address: "",
    phone: "",
    whatsapp: "",
    messenger: "",
    lga: "",
    ward: "",
    pollingUnit: "",
  });
  const [selectedLGA, setSelectedLGA] = useState("");
  const [wards, setWards] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [errors, setErrors] = useState({});

  const handleLGAChange = (e) => {
    const lga = e.target.value;
    setSelectedLGA(lga);
    setWards(lgaData[lga] || []);
    setFormData({ ...formData, lga, ward: "" });
    setErrors({ ...errors, lga: "" });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: "" });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = "Name is required";
    if (!formData.address.trim()) newErrors.address = "Address is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    if (!formData.whatsapp.trim())
      newErrors.whatsapp = "WhatsApp number is required";
    if (!formData.lga) newErrors.lga = "Please select your LGA";
    if (!formData.ward) newErrors.ward = "Please select your ward";
    if (!formData.pollingUnit.trim())
      newErrors.pollingUnit = "Polling unit is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const response = await fetch("/api/register-member", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: formData.fullName,
          address: formData.address,
          phone: formData.phone,
          whatsapp: formData.whatsapp,
          messenger: formData.messenger || null,
          lga: formData.lga,
          ward: formData.ward,
          polling_unit: formData.pollingUnit,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to register member");
      }

      setSubmitStatus("success");
      if (onSuccess) onSuccess(result.data);

      // Reset form after success
      setTimeout(() => {
        setFormData({
          fullName: "",
          address: "",
          phone: "",
          whatsapp: "",
          messenger: "",
          lga: "",
          ward: "",
          pollingUnit: "",
        });
        setSelectedLGA("");
        setWards([]);
        setSubmitStatus(null);
        setErrors({});
      }, 3000);
    } catch (err) {
      console.error("Registration error:", err);
      setSubmitStatus("error");
      if (onError) onError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={className}>
      {/* Form Header (Optional) */}
      {showHeader && (
        <div className="mb-8">
          <h2
            className="font-montserrat text-2xl font-bold mb-2"
            style={{ color: "#212121" }}
          >
            Membership Registration
          </h2>
          <p className="font-poppins text-sm" style={{ color: "#757575" }}>
            Complete the form below to register a new member. All fields marked
            with * are required.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Full Name */}
        <div>
          <label
            htmlFor="fullName"
            className="block font-poppins text-sm font-semibold mb-2"
            style={{ color: "#212121" }}
          >
            Full Name <span style={{ color: "#e53935" }}>*</span>
          </label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-lg border-2 font-poppins text-base transition-all focus:outline-none"
            style={{
              borderColor: errors.fullName ? "#e53935" : "#e0e0e0",
              color: "#212121",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#1b5e20")}
            onBlur={(e) =>
              (e.target.style.borderColor = errors.fullName
                ? "#e53935"
                : "#e0e0e0")
            }
            placeholder="e.g., Oluwasegun Theophilus Oladimeji"
          />
          {errors.fullName && (
            <p
              className="mt-1 font-poppins text-xs"
              style={{ color: "#e53935" }}
            >
              {errors.fullName}
            </p>
          )}
        </div>

        {/* Address */}
        <div>
          <label
            htmlFor="address"
            className="block font-poppins text-sm font-semibold mb-2"
            style={{ color: "#212121" }}
          >
            Residential Address <span style={{ color: "#e53935" }}>*</span>
          </label>
          <textarea
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            rows="3"
            className="w-full px-4 py-3 rounded-lg border-2 font-poppins text-base transition-all focus:outline-none resize-none"
            style={{
              borderColor: errors.address ? "#e53935" : "#e0e0e0",
              color: "#212121",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#1b5e20")}
            onBlur={(e) =>
              (e.target.style.borderColor = errors.address
                ? "#e53935"
                : "#e0e0e0")
            }
            placeholder="Enter complete residential address"
          />
          {errors.address && (
            <p
              className="mt-1 font-poppins text-xs"
              style={{ color: "#e53935" }}
            >
              {errors.address}
            </p>
          )}
        </div>

        {/* Phone and WhatsApp */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="phone"
              className="block font-poppins text-sm font-semibold mb-2"
              style={{ color: "#212121" }}
            >
              Phone Number <span style={{ color: "#e53935" }}>*</span>
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border-2 font-poppins text-base transition-all focus:outline-none"
              style={{
                borderColor: errors.phone ? "#e53935" : "#e0e0e0",
                color: "#212121",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#1b5e20")}
              onBlur={(e) =>
                (e.target.style.borderColor = errors.phone
                  ? "#e53935"
                  : "#e0e0e0")
              }
              placeholder="080XXXXXXXX"
            />
            {errors.phone && (
              <p
                className="mt-1 font-poppins text-xs"
                style={{ color: "#e53935" }}
              >
                {errors.phone}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="whatsapp"
              className="block font-poppins text-sm font-semibold mb-2"
              style={{ color: "#212121" }}
            >
              WhatsApp Number <span style={{ color: "#e53935" }}>*</span>
            </label>
            <input
              type="tel"
              id="whatsapp"
              name="whatsapp"
              value={formData.whatsapp}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border-2 font-poppins text-base transition-all focus:outline-none"
              style={{
                borderColor: errors.whatsapp ? "#e53935" : "#e0e0e0",
                color: "#212121",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#1b5e20")}
              onBlur={(e) =>
                (e.target.style.borderColor = errors.whatsapp
                  ? "#e53935"
                  : "#e0e0e0")
              }
              placeholder="080XXXXXXXX"
            />
            {errors.whatsapp && (
              <p
                className="mt-1 font-poppins text-xs"
                style={{ color: "#e53935" }}
              >
                {errors.whatsapp}
              </p>
            )}
          </div>
        </div>

        {/* Messenger */}
        <div>
          <label
            htmlFor="messenger"
            className="block font-poppins text-sm font-semibold mb-2"
            style={{ color: "#212121" }}
          >
            Facebook Messenger ID{" "}
            <span className="font-normal" style={{ color: "#757575" }}>
              (Optional)
            </span>
          </label>
          <input
            type="text"
            id="messenger"
            name="messenger"
            value={formData.messenger}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-lg border-2 font-poppins text-base transition-all focus:outline-none"
            style={{ borderColor: "#e0e0e0", color: "#212121" }}
            onFocus={(e) => (e.target.style.borderColor = "#1b5e20")}
            onBlur={(e) => (e.target.style.borderColor = "#e0e0e0")}
            placeholder="Messenger username"
          />
        </div>

        {/* LGA and Ward */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="lga"
              className="block font-poppins text-sm font-semibold mb-2"
              style={{ color: "#212121" }}
            >
              Local Government Area <span style={{ color: "#e53935" }}>*</span>
            </label>
            <select
              id="lga"
              name="lga"
              value={formData.lga}
              onChange={handleLGAChange}
              className="w-full px-4 py-3 rounded-lg border-2 font-poppins text-base transition-all focus:outline-none"
              style={{
                borderColor: errors.lga ? "#e53935" : "#e0e0e0",
                color: formData.lga ? "#212121" : "#757575",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#1b5e20")}
              onBlur={(e) =>
                (e.target.style.borderColor = errors.lga
                  ? "#e53935"
                  : "#e0e0e0")
              }
            >
              <option value="">-- Select LGA --</option>
              {Object.keys(lgaData).map((lga) => (
                <option key={lga} value={lga}>
                  {lga}
                </option>
              ))}
            </select>
            {errors.lga && (
              <p
                className="mt-1 font-poppins text-xs"
                style={{ color: "#e53935" }}
              >
                {errors.lga}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="ward"
              className="block font-poppins text-sm font-semibold mb-2"
              style={{ color: "#212121" }}
            >
              Ward <span style={{ color: "#e53935" }}>*</span>
            </label>
            <select
              id="ward"
              name="ward"
              value={formData.ward}
              onChange={handleChange}
              disabled={!selectedLGA}
              className="w-full px-4 py-3 rounded-lg border-2 font-poppins text-base transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                borderColor: errors.ward ? "#e53935" : "#e0e0e0",
                color: formData.ward ? "#212121" : "#757575",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#1b5e20")}
              onBlur={(e) =>
                (e.target.style.borderColor = errors.ward
                  ? "#e53935"
                  : "#e0e0e0")
              }
            >
              <option value="">-- Select ward --</option>
              {wards.map((ward) => (
                <option key={ward} value={ward}>
                  {ward}
                </option>
              ))}
            </select>
            {errors.ward && (
              <p
                className="mt-1 font-poppins text-xs"
                style={{ color: "#e53935" }}
              >
                {errors.ward}
              </p>
            )}
          </div>
        </div>

        {/* Polling Unit */}
        <div>
          <label
            htmlFor="pollingUnit"
            className="block font-poppins text-sm font-semibold mb-2"
            style={{ color: "#212121" }}
          >
            Polling Unit <span style={{ color: "#e53935" }}>*</span>
          </label>
          <input
            type="text"
            id="pollingUnit"
            name="pollingUnit"
            value={formData.pollingUnit}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-lg border-2 font-poppins text-base transition-all focus:outline-none"
            style={{
              borderColor: errors.pollingUnit ? "#e53935" : "#e0e0e0",
              color: "#212121",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#1b5e20")}
            onBlur={(e) =>
              (e.target.style.borderColor = errors.pollingUnit
                ? "#e53935"
                : "#e0e0e0")
            }
            placeholder="Polling unit name or number"
          />
          {errors.pollingUnit && (
            <p
              className="mt-1 font-poppins text-xs"
              style={{ color: "#e53935" }}
            >
              {errors.pollingUnit}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <motion.button
            type="submit"
            disabled={isSubmitting}
            whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
            whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
            className="w-full px-8 py-4 rounded-lg font-poppins font-semibold text-lg transition-all disabled:cursor-not-allowed shadow-lg"
            style={{
              backgroundColor: isSubmitting ? "#9e9e9e" : "#1b5e20",
              color: "#ffffff",
              opacity: isSubmitting ? 0.7 : 1,
            }}
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
                Submitting...
              </span>
            ) : (
              submitButtonText
            )}
          </motion.button>
        </div>

        {/* Success/Error Message */}
        <AnimatePresence>
          {submitStatus === "success" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="p-6 rounded-xl text-center"
              style={{
                backgroundColor: "#E8F5E9",
                border: "2px solid #4caf50",
              }}
            >
              <div className="text-4xl mb-2">✓</div>
              <p
                className="font-poppins font-bold text-lg mb-1"
                style={{ color: "#1b5e20" }}
              >
                Registration Successful!
              </p>
              <p className="font-poppins text-sm" style={{ color: "#2e7d32" }}>
                Member has been successfully registered.
              </p>
            </motion.div>
          )}
          {submitStatus === "error" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="p-6 rounded-xl text-center"
              style={{
                backgroundColor: "#FFEBEE",
                border: "2px solid #e53935",
              }}
            >
              <div className="text-4xl mb-2">✕</div>
              <p
                className="font-poppins font-bold text-lg mb-1"
                style={{ color: "#e53935" }}
              >
                Registration Failed
              </p>
              <p className="font-poppins text-sm" style={{ color: "#c62828" }}>
                An error occurred. Please try again.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
}
