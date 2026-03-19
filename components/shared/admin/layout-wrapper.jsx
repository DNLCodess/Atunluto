// components/shared/admin/layout-wrapper.jsx
"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "./sidebar";
import MobileMenu from "./mobile";
import Header from "./header";
import InactivityLogout from "./InactivityLogout";

export default function AdminLayoutWrapper({ children }) {
  const { isAuthenticated, isLoading, isNetworkError } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Genuinely resolving auth for the first time — show spinner
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-green-700 font-medium font-poppins">
            Loading Dashboard...
          </p>
        </div>
      </div>
    );
  }

  // Network completely down AND no cached session — can't verify identity
  if (isNetworkError) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center z-50 p-6">
        <div className="text-center max-w-sm">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: "#FFF3E0" }}
          >
            <svg
              className="w-8 h-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="#E65100"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 5.636a9 9 0 010 12.728M15.536 8.464a5 5 0 010 7.072M12 12h.01M8.464 15.536a5 5 0 010-7.072M5.636 18.364a9 9 0 010-12.728"
              />
            </svg>
          </div>
          <h2 className="text-xl font-extrabold text-gray-900 mb-2">
            No Connection
          </h2>
          <p className="text-gray-500 text-sm font-poppins mb-6">
            Unable to verify your session. Please check your internet connection
            and try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 rounded-xl text-white font-poppins font-semibold text-sm shadow-md transition hover:opacity-90"
            style={{ backgroundColor: "#1B5E20" }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Middleware handles the redirect — this is a last-resort defensive guard
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <InactivityLogout />
      {sidebarOpen && <MobileMenu setSidebarOpen={setSidebarOpen} />}

      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
        <Sidebar />
      </div>

      <div className="lg:pl-72">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="py-8 px-4 sm:px-6 lg:px-10 min-h-screen pb-20 lg:pb-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
      {/* 
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
        <div className="flex justify-around py-2">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-3 text-green-700 hover:bg-green-50 rounded-lg transition"
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
        </div>
      </div> */}
    </div>
  );
}
