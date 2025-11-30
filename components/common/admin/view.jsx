// components/common/admin/view.jsx
"use client";

import { X, MapPin, Phone, MessageCircle, Calendar, Hash } from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

export default function ViewMemberModal({ member, onClose }) {
  if (!member) return null;

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
          {/* Header */}
          <div className="bg-gradient-to-r from-green-700 to-green-900 text-white p-8 relative overflow-hidden">
            {/* Decorative gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />

            <div className="relative flex justify-between items-start">
              <div>
                <motion.h2
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-3xl font-bold"
                >
                  {member.full_name}
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                  className="text-green-100 mt-2 opacity-90"
                >
                  Member ID:{" "}
                  <span className="font-mono">{member.id.slice(0, 8)}...</span>
                </motion.p>
              </div>
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-3 bg-white/20 hover:bg-white/30 rounded-full transition backdrop-blur-sm"
              >
                <X className="w-6 h-6" />
              </motion.button>
            </div>
          </div>

          {/* Body - Scrollable */}
          <div className="p-8 space-y-8 overflow-y-auto max-h-[calc(90vh-280px)]">
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
