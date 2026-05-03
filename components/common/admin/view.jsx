// components/common/admin/view.jsx
"use client";

import {
  X,
  MapPin,
  Phone,
  MessageCircle,
  Calendar,
  Hash,
  User,
  Cake,
} from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { getCldImageUrl } from "@/utils/cloudinary";

export default function ViewMemberModal({ member, onClose }) {
  if (!member) return null;

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birth = new Date(dateOfBirth);
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

  const age = member.date_of_birth ? calculateAge(member.date_of_birth) : null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Glossy Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-gradient-to-br from-gray-900/60 via-gray-800/40 to-gray-900/60 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header with Profile Image */}

          {/* Header with Profile Image */}
          <div className="bg-gradient-to-r from-green-700 to-green-900 text-white p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />

            <div className="relative flex justify-between items-start gap-4">
              <div className="flex items-start gap-6 flex-1 min-w-0">
                {/* Profile Image */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="flex-shrink-0"
                >
                  {member.profile_image_url ? (
                    <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-white/30 shadow-xl">
                      <img
                        src={getCldImageUrl(member.profile_image_url, { width: 192, height: 192 })}
                        alt={member.full_name}
                        className="w-full h-full object-cover"
                        decoding="async"
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-24 bg-white/20 rounded-2xl flex items-center justify-center font-bold text-4xl border-4 border-white/30 shadow-xl">
                      {member.full_name[0]}
                    </div>
                  )}
                </motion.div>

                {/* Name and Info */}
                <div className="flex-1 min-w-0">
                  <motion.h2
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-3xl font-bold truncate"
                  >
                    {member.full_name}
                  </motion.h2>

                  {/* Membership Number Badge */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.12 }}
                    className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
                      />
                    </svg>
                    <div>
                      <p className="text-xs text-green-100 opacity-80">
                        Member ID
                      </p>
                      <p className="font-mono font-bold text-base">
                        {member.membership_number}
                      </p>
                    </div>
                  </motion.div>

                  {/* Age and Gender Pills */}
                  {(age || member.gender) && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="flex flex-wrap gap-2 mt-3"
                    >
                      {age && (
                        <div className="px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-lg text-sm font-medium flex items-center gap-1.5">
                          <Cake className="w-4 h-4" />
                          {age} years old
                        </div>
                      )}
                      {member.gender && (
                        <div className="px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-lg text-sm font-medium flex items-center gap-1.5 capitalize">
                          <User className="w-4 h-4" />
                          {member.gender.replace("_", " ")}
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              </div>

              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-3 bg-white/20 hover:bg-white/30 rounded-full transition backdrop-blur-sm flex-shrink-0"
              >
                <X className="w-6 h-6" />
              </motion.button>
            </div>
          </div>
          {/* Body - Scrollable */}
          <div className="p-8 space-y-8 overflow-y-auto max-h-[calc(90vh-320px)]">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Personal Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-6"
              >
                <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <Hash className="w-5 h-5 text-green-600" />
                  </div>
                  Personal Details
                </h3>
                <div className="space-y-4 bg-gradient-to-br from-gray-50 to-gray-100/50 p-6 rounded-2xl border border-gray-200/50">
                  {/* Date of Birth */}
                  {member.date_of_birth && (
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 font-medium">
                          Date of Birth
                        </p>
                        <p className="font-semibold text-gray-900">
                          {format(
                            new Date(member.date_of_birth),
                            "dd MMMM yyyy"
                          )}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Phone */}
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Phone className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-medium">Phone</p>
                      <p className="font-semibold text-gray-900">
                        {member.phone}
                      </p>
                    </div>
                  </div>

                  {/* WhatsApp */}
                  {member.whatsapp && (
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <MessageCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 font-medium">
                          WhatsApp
                        </p>
                        <p className="font-semibold text-gray-900">
                          {member.whatsapp}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Messenger */}
                  {member.messenger && (
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <MessageCircle className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 font-medium">
                          Messenger
                        </p>
                        <p className="font-semibold text-gray-900">
                          {member.messenger}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Location Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="space-y-6"
              >
                <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-green-600" />
                  </div>
                  Political Unit
                </h3>
                <div className="space-y-4 bg-gradient-to-br from-gray-50 to-gray-100/50 p-6 rounded-2xl border border-gray-200/50">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">
                      Local Government Area
                    </p>
                    <p className="font-bold text-gray-900 text-lg mt-1">
                      {member.lga}
                    </p>
                  </div>
                  <div className="h-px bg-gray-200" />
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Ward</p>
                    <p className="font-bold text-gray-900 text-lg mt-1">
                      {member.ward}
                    </p>
                  </div>
                  <div className="h-px bg-gray-200" />
                  <div>
                    <p className="text-sm text-gray-500 font-medium">
                      Polling Unit
                    </p>
                    <p className="font-bold text-gray-900 text-lg mt-1">
                      {member.polling_unit}
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Address Section */}
            {member.address && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-gray-50 to-gray-100/50 p-6 rounded-2xl border border-gray-200/50"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Residential Address
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {member.address}
                </p>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="flex items-center justify-between p-8 border-t border-gray-200 bg-gray-50/50"
          >
            <div className="flex items-center gap-3 text-gray-600">
              <div className="w-10 h-10 bg-gray-200 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">
                  Registered on
                </p>
                <p className="font-semibold">
                  {format(new Date(member.created_at), "PPP")}
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="px-8 py-3 bg-green-700 hover:bg-green-800 text-white font-semibold rounded-xl transition shadow-lg shadow-green-700/30"
            >
              Close
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
