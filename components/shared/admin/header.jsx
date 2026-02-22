// components/shared/admin/header.jsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { LogOut, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ROLE_LABELS = {
  super_user: "Super User",
  administrator: "Administrator",
  registration: "Registration Staff",
  manager: "Website Updater",
};

export default function Header({ sidebarOpen, setSidebarOpen }) {
  const { user, profile, role, logout } = useAuth();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    setDropdownOpen(false);
    logout(undefined, {
      onSuccess: () => router.replace("/login"),
    });
  };

  const displayName = user?.email || "Admin";
  const roleLabel = ROLE_LABELS[role] || "Administrator";
  const initial = displayName[0]?.toUpperCase() || "A";

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition"
            aria-label="Open menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <div className="hidden lg:block">
            <h1 className="text-xl font-bold text-green-800 font-montserrat">
              Atunluto Admin
            </h1>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-semibold text-gray-900 font-poppins">
              {displayName}
            </p>
            <p className="text-xs text-gray-500 font-poppins">{roleLabel}</p>
          </div>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((o) => !o)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition"
              aria-label="User menu"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md"
                style={{
                  background: "linear-gradient(135deg, #1B5E20, #2E7D32)",
                }}
              >
                {initial}
              </div>
              <ChevronDown
                className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden"
                >
                  {/* User info */}
                  <div
                    className="p-4 border-b border-gray-100"
                    style={{
                      background: "linear-gradient(135deg, #f0fdf4, #ffffff)",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl"
                        style={{
                          background:
                            "linear-gradient(135deg, #1B5E20, #2E7D32)",
                        }}
                      >
                        {initial}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate font-poppins">
                          {displayName}
                        </p>
                        <p className="text-xs text-gray-500 font-poppins">
                          {roleLabel}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="py-2">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition font-medium font-poppins"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
