// components/common/admin/edit.jsx
"use client";

import { useState, useRef } from "react";
import {
  X,
  Save,
  Loader2,
  Upload,
  Calendar,
  User as UserIcon,
} from "lucide-react";
import { createClient } from "@/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

const supabase = createClient();

export default function EditMemberModal({ member, onClose, onUpdate }) {
  const [formData, setFormData] = useState({
    full_name: member.full_name,
    address: member.address || "",
    phone: member.phone,
    whatsapp: member.whatsapp || "",
    messenger: member.messenger || "",
    lga: member.lga,
    ward: member.ward,
    polling_unit: member.polling_unit,
    date_of_birth: member.date_of_birth || "",
    gender: member.gender || "",
  });
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(
    member.profile_image_url || null
  );
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

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
    if (!birthDate) return null;
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

  const handleSave = async () => {
    setSaving(true);

    try {
      let profile_image_url = member.profile_image_url;

      // Upload new image if selected
      if (profileImage) {
        const sigRes = await fetch(
          `/api/cloudinary-sign?lga=${encodeURIComponent(formData.lga)}`,
        );
        if (!sigRes.ok) {
          alert("Failed to get upload signature");
          setSaving(false);
          return;
        }
        const { signature, timestamp, folder, cloudName, apiKey } =
          await sigRes.json();

        const fd = new FormData();
        fd.append("file", profileImage);
        fd.append("api_key", apiKey);
        fd.append("timestamp", String(timestamp));
        fd.append("signature", signature);
        fd.append("folder", folder);

        const uploadRes = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          { method: "POST", body: fd },
        );
        if (!uploadRes.ok) {
          alert("Failed to upload image");
          setSaving(false);
          return;
        }
        const uploadData = await uploadRes.json();
        profile_image_url = uploadData.secure_url;

        // Remove old Supabase image if present (best-effort, ignore failure)
        if (
          member.profile_image_url?.includes("supabase.co")
        ) {
          try {
            const oldPath =
              member.profile_image_url.split("/members-images/")[1];
            if (oldPath) {
              await supabase.storage.from("members-images").remove([oldPath]);
            }
          } catch {
            // non-critical
          }
        }
      }

      // Validate age if date_of_birth is provided
      if (formData.date_of_birth) {
        const age = calculateAge(formData.date_of_birth);
        if (age < 18) {
          alert("Member must be at least 18 years old");
          setSaving(false);
          return;
        }
      }

      // Update member data
      const updateData = {
        ...formData,
        profile_image_url,
      };

      const { error } = await supabase
        .from("members")
        .update(updateData)
        .eq("id", member.id);

      if (!error) {
        if (onUpdate) {
          onUpdate({ ...member, ...updateData });
        }
        onClose();
      } else {
        alert("Failed to update member: " + error.message);
      }
    } catch (err) {
      console.error("Save error:", err);
      alert("An error occurred while saving");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Glossy Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-linear-to-br from-gray-900/60 via-gray-800/40 to-gray-900/60 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="p-8 border-b border-gray-200 bg-gradient-to-br from-white to-gray-50/50">
            <div className="flex justify-between items-center">
              <motion.h2
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="text-2xl font-bold text-gray-900"
              >
                Edit Member Details
              </motion.h2>
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 }}
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-3 hover:bg-gray-100 rounded-full transition"
              >
                <X className="w-6 h-6 text-gray-600" />
              </motion.button>
            </div>
          </div>

          {/* Form - Scrollable */}
          <div className="p-8 overflow-y-auto max-h-[calc(90vh-220px)]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              {/* Profile Image Upload */}
              <div className="pb-6 border-b border-gray-200">
                <label className="block text-sm font-semibold text-gray-700 mb-4">
                  Profile Photo
                </label>
                <div className="flex items-start gap-6">
                  <div
                    className="w-32 h-32 rounded-2xl border-2 overflow-hidden flex items-center justify-center"
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
                        <UserIcon className="w-12 h-12 mx-auto text-gray-400" />
                        <p className="text-xs text-gray-400 mt-2">No photo</p>
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
                      id="profileImageEdit"
                    />
                    <label
                      htmlFor="profileImageEdit"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl cursor-pointer transition"
                    >
                      <Upload className="w-5 h-5" />
                      Change Photo
                    </label>
                    <p className="mt-2 text-sm text-gray-600">
                      JPEG, PNG or WebP • Max 5MB
                    </p>
                    {errors.profileImage && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.profileImage}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Personal Information Section */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) =>
                      setFormData({ ...formData, full_name: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                    placeholder="Enter full name"
                  />
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Date of Birth
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                    <input
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          date_of_birth: e.target.value,
                        })
                      }
                      max={
                        new Date(
                          new Date().setFullYear(new Date().getFullYear() - 18)
                        )
                          .toISOString()
                          .split("T")[0]
                      }
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                    />
                  </div>
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) =>
                      setFormData({ ...formData, gender: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                  >
                    <option value="">-- Select gender --</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </div>

                {/* Address */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Residential Address
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition resize-none"
                    placeholder="Enter residential address"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone Number <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                    placeholder="08012345678"
                  />
                </div>

                {/* WhatsApp */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    value={formData.whatsapp}
                    onChange={(e) =>
                      setFormData({ ...formData, whatsapp: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                    placeholder="08012345678 (optional)"
                  />
                </div>

                {/* Messenger */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Facebook Messenger ID
                  </label>
                  <input
                    type="text"
                    value={formData.messenger}
                    onChange={(e) =>
                      setFormData({ ...formData, messenger: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                    placeholder="Messenger username (optional)"
                  />
                </div>

                {/* Political Unit Section */}
                <div className="md:col-span-2 pt-4 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Political Unit
                  </h3>
                </div>

                {/* LGA */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Local Government Area{" "}
                    <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.lga}
                    onChange={(e) =>
                      setFormData({ ...formData, lga: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                    placeholder="Enter LGA"
                  />
                </div>

                {/* Ward */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Ward <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.ward}
                    onChange={(e) =>
                      setFormData({ ...formData, ward: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                    placeholder="Enter ward number"
                  />
                </div>

                {/* Polling Unit */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Polling Unit <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.polling_unit}
                    onChange={(e) =>
                      setFormData({ ...formData, polling_unit: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                    placeholder="Enter polling unit"
                  />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="flex justify-end gap-4 p-8 border-t border-gray-200 bg-gray-50/50"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              disabled={saving}
              className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-100 font-medium text-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              disabled={saving}
              className="px-8 py-3 bg-green-700 hover:bg-green-800 text-white rounded-xl flex items-center gap-2 disabled:opacity-70 font-semibold shadow-lg shadow-green-700/30 transition"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Changes
                </>
              )}
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
