// components/MemberRegistrationForm.jsx
"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef } from "react";
import { lgaData } from "@/lib/data";
import Image from "next/image";

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
    dateOfBirth: "",
    gender: "",
  });
  const [selectedLGA, setSelectedLGA] = useState("");
  const [wards, setWards] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [errors, setErrors] = useState({});
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

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

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setErrors({
        ...errors,
        profileImage: "Only JPEG, PNG, and WebP images are allowed",
      });
      return;
    }

    // Validate file size (5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setErrors({
        ...errors,
        profileImage: "Image size must be less than 5MB",
      });
      return;
    }

    setProfileImage(file);
    setErrors({ ...errors, profileImage: "" });

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const calculateAge = (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }

    return age;
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
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = "Date of birth is required";
    } else {
      const age = calculateAge(formData.dateOfBirth);
      if (age < 18) {
        newErrors.dateOfBirth = "You must be at least 18 years old to register";
      }
    }
    if (!formData.gender) newErrors.gender = "Please select your gender";
    if (!profileImage) newErrors.profileImage = "Profile photo is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Update only the handleSubmit function in MemberRegistrationForm.jsx

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("full_name", formData.fullName);
      formDataToSend.append("address", formData.address);
      formDataToSend.append("phone", formData.phone);
      formDataToSend.append("whatsapp", formData.whatsapp);
      formDataToSend.append("messenger", formData.messenger || "");
      formDataToSend.append("lga", formData.lga);
      formDataToSend.append("ward", formData.ward);
      formDataToSend.append("polling_unit", formData.pollingUnit);
      formDataToSend.append("date_of_birth", formData.dateOfBirth);
      formDataToSend.append("gender", formData.gender);

      if (profileImage) {
        formDataToSend.append("profile_image", profileImage);
      }

      const response = await fetch("/api/register-member", {
        method: "POST",
        body: formDataToSend,
        // Don't set Content-Type header - browser will set it automatically with boundary
      });

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Non-JSON response:", text);
        throw new Error(
          "Server returned an invalid response. Please check the console for details."
        );
      }

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
          dateOfBirth: "",
          gender: "",
        });
        setSelectedLGA("");
        setWards([]);
        setProfileImage(null);
        setImagePreview(null);
        setSubmitStatus(null);
        setErrors({});
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }, 3000);
    } catch (err) {
      console.error("Registration error:", err);
      setSubmitStatus("error");

      // Show more specific error message
      setErrors({
        ...errors,
        submit: err.message || "An error occurred during registration",
      });

      if (onError) onError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={className}>
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
            with * are required. Members must be at least 18 years old.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Image Upload */}
        <div>
          <label
            className="block font-poppins text-sm font-semibold mb-2"
            style={{ color: "#212121" }}
          >
            Profile Photo <span style={{ color: "#e53935" }}>*</span>
          </label>
          <div className="flex items-start gap-4">
            <div
              className="w-32 h-32 rounded-lg border-2 overflow-hidden flex items-center justify-center"
              style={{
                borderColor: errors.profileImage ? "#e53935" : "#e0e0e0",
                backgroundColor: "#f5f5f5",
              }}
            >
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center p-4">
                  <svg
                    className="w-12 h-12 mx-auto mb-2"
                    fill="none"
                    stroke="#9e9e9e"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <p
                    className="font-poppins text-xs"
                    style={{ color: "#9e9e9e" }}
                  >
                    No photo
                  </p>
                </div>
              )}
            </div>
            <div className="flex-1">
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
                className="inline-block px-6 py-3 rounded-lg font-poppins font-medium text-sm cursor-pointer transition-all hover:opacity-90"
                style={{
                  backgroundColor: "#4caf50",
                  color: "#ffffff",
                }}
              >
                Choose Photo
              </label>
              <p
                className="mt-2 font-poppins text-xs"
                style={{ color: "#757575" }}
              >
                JPEG, PNG or WebP • Max 5MB
              </p>
              {errors.profileImage && (
                <p
                  className="mt-1 font-poppins text-xs"
                  style={{ color: "#e53935" }}
                >
                  {errors.profileImage}
                </p>
              )}
            </div>
          </div>
        </div>

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

        {/* Date of Birth and Gender */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="dateOfBirth"
              className="block font-poppins text-sm font-semibold mb-2"
              style={{ color: "#212121" }}
            >
              Date of Birth <span style={{ color: "#e53935" }}>*</span>
            </label>
            <input
              type="date"
              id="dateOfBirth"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              max={
                new Date(new Date().setFullYear(new Date().getFullYear() - 18))
                  .toISOString()
                  .split("T")[0]
              }
              className="w-full px-4 py-3 rounded-lg border-2 font-poppins text-base transition-all focus:outline-none"
              style={{
                borderColor: errors.dateOfBirth ? "#e53935" : "#e0e0e0",
                color: "#212121",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#1b5e20")}
              onBlur={(e) =>
                (e.target.style.borderColor = errors.dateOfBirth
                  ? "#e53935"
                  : "#e0e0e0")
              }
            />
            {errors.dateOfBirth && (
              <p
                className="mt-1 font-poppins text-xs"
                style={{ color: "#e53935" }}
              >
                {errors.dateOfBirth}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="gender"
              className="block font-poppins text-sm font-semibold mb-2"
              style={{ color: "#212121" }}
            >
              Gender <span style={{ color: "#e53935" }}>*</span>
            </label>
            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border-2 font-poppins text-base transition-all focus:outline-none"
              style={{
                borderColor: errors.gender ? "#e53935" : "#e0e0e0",
                color: formData.gender ? "#212121" : "#757575",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#1b5e20")}
              onBlur={(e) =>
                (e.target.style.borderColor = errors.gender
                  ? "#e53935"
                  : "#e0e0e0")
              }
            >
              <option value="">-- Select gender --</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
            {errors.gender && (
              <p
                className="mt-1 font-poppins text-xs"
                style={{ color: "#e53935" }}
              >
                {errors.gender}
              </p>
            )}
          </div>
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
              {/* Show membership number if available */}
              {onSuccess && (
                <div className="mt-4 p-3 bg-white/60 rounded-lg inline-block">
                  <p className="text-xs text-gray-600 mb-1">
                    Membership Number
                  </p>
                  <p
                    className="font-mono font-bold text-lg"
                    style={{ color: "#1b5e20" }}
                  >
                    {/* This will be populated by the parent component */}
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {submitStatus === "error" && errors.submit && (
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
                {errors.submit}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
}
