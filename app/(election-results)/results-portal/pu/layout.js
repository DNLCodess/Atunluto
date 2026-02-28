/**
 * app/results-portal/pu/layout.jsx
 * Polling Unit Admin shell — fixed sidebar + main content.
 */

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { logoutResultsAdmin } from "@/app/actions/election-auth";
import PUSidebarNav from "./sidebar";

export default async function PULayout({ children }) {
  const hdrs = await headers();
  const role = hdrs.get("x-erms-role");
  const name = hdrs.get("x-erms-name") || "PU Admin";
  const lga = hdrs.get("x-erms-lga") || "";
  const ward = hdrs.get("x-erms-ward") || "";
  const pu = hdrs.get("x-erms-polling-unit") || "";
  const adminId = hdrs.get("x-erms-id") || "";

  if (!role || role !== "polling_unit_admin") redirect("/results-portal/login");

  const initial = name.trim().charAt(0).toUpperCase() || "P";

  return (
    <div className="h-screen flex overflow-hidden bg-[#F0F4F0]">
      <a
        href="#pu-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-[#1B5E20] focus:rounded-lg focus:shadow-lg focus:text-sm focus:font-semibold"
      >
        Skip to content
      </a>

      {/* ── Sidebar ── */}
      <aside
        className="w-64 h-screen flex flex-col shrink-0 bg-[#1B5E20] shadow-xl overflow-hidden print:hidden"
        aria-label="Polling Unit Admin Navigation"
      >
        {/* Branding */}
        <div className="px-6 pt-7 pb-5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 bg-white/10 flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="Atunluto Group"
                width={36}
                height={36}
                className="object-contain w-full h-full"
              />
            </div>
            <div>
              <div className="text-white text-[13px] font-black tracking-widest font-[Montserrat,sans-serif]">
                ATUNLUTO
              </div>
              <div className="text-white/40 text-[9px] tracking-widest uppercase leading-none mt-0.5">
                Results Portal
              </div>
            </div>
          </div>
        </div>

        <div className="mx-6 border-t border-white/10 shrink-0" />

        {/* User badge */}
        <div className="px-4 py-4 shrink-0">
          <div className="bg-white/10 border border-white/10 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="w-8 h-8 rounded-full bg-[#4CAF50]/30 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {initial}
              </div>
              <div className="min-w-0">
                <div className="text-white text-[13px] font-semibold truncate leading-tight">
                  {name}
                </div>
                <div className="text-[#A5D6A7] text-[10px] font-medium tracking-wide uppercase mt-0.5">
                  PU Agent
                </div>
              </div>
            </div>
            {/* Location badges */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 bg-white/10 rounded-lg px-2.5 py-1.5">
                <span className="text-[10px]">🏛️</span>
                <span className="text-[#C8E6C9] text-[11px] font-semibold truncate">
                  {lga}
                </span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 rounded-lg px-2.5 py-1.5">
                <span className="text-[10px]">🏘️</span>
                <span className="text-[#C8E6C9] text-[11px] font-semibold truncate">
                  {ward}
                </span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 rounded-lg px-2.5 py-1.5">
                <span className="text-[10px]">📍</span>
                <span className="text-[#A5D6A7] text-[11px] font-bold truncate">
                  {pu}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-6 border-t border-white/10 mb-2 shrink-0" />
        <div className="px-6 mb-1 shrink-0">
          <span className="text-white/30 text-[9px] font-bold tracking-widest uppercase">
            Navigation
          </span>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden px-3">
          <PUSidebarNav />
        </div>

        {/* Footer */}
        <div className="px-4 py-5 shrink-0">
          <div className="mx-2 border-t border-white/10 mb-4" />
          <form action={logoutResultsAdmin}>
            <button
              type="submit"
              className="w-full py-2.5 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white/65 hover:text-white border border-white/15 rounded-xl text-[13px] font-semibold cursor-pointer transition-all duration-150"
            >
              <span className="text-sm">↩</span> Sign Out
            </button>
          </form>
          <p className="text-center text-white/25 text-[10px] mt-3 tracking-wide">
            Oyo South Senatorial District
          </p>
        </div>
      </aside>

      {/* ── Main ── */}
      <main
        id="pu-main"
        className="flex-1 min-w-0 h-screen overflow-y-auto"
        data-erms-id={adminId}
        data-erms-lga={lga}
        data-erms-ward={ward}
        data-erms-polling-unit={pu}
        data-erms-name={name}
      >
        {children}
      </main>
    </div>
  );
}
