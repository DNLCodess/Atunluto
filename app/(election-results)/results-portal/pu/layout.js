/**
 * app/results-portal/pu/layout.jsx
 * Polling Unit Admin shell — lightweight sidebar.
 */

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Image from "next/image";
import { logoutResultsAdmin } from "@/app/actions/election-auth";
import PUSidebarNav from "./sidebar";

export default async function PULayout({ children }) {
  const hdrs = await headers();
  const role = hdrs.get("x-erms-role");
  const adminId = hdrs.get("x-erms-id") || "";
  const lga = hdrs.get("x-erms-lga") || "";
  const ward = hdrs.get("x-erms-ward") || "";
  const pollingUnit = hdrs.get("x-erms-polling-unit") || "";
  const name = hdrs.get("x-erms-name") || "PU Agent";

  if (!role || role !== "polling_unit_admin") redirect("/results-portal/login");

  const initial =
    name.trim().length > 0 ? name.trim().charAt(0).toUpperCase() : "A";

  return (
    <div className="h-screen flex overflow-hidden bg-[#F0F4F0]">
      <aside
        className="w-64 h-screen flex flex-col shrink-0 bg-[#1B5E20] shadow-xl overflow-hidden print:hidden"
        aria-label="PU Admin Navigation"
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
            <div className="flex items-center gap-2.5">
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
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-1.5 bg-white/10 rounded-lg px-2.5 py-1.5">
                <span className="text-[10px]">📍</span>
                <span className="text-[#C8E6C9] text-[11px] font-semibold truncate">
                  {lga}
                </span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 rounded-lg px-2.5 py-1.5">
                <span className="text-[10px]">🏘️</span>
                <span className="text-[#C8E6C9] text-[11px] font-medium truncate">
                  {ward}
                </span>
              </div>
              {pollingUnit && (
                <div className="flex items-center gap-1.5 bg-white/10 rounded-lg px-2.5 py-1.5">
                  <span className="text-[10px]">🗳️</span>
                  <span className="text-[#C8E6C9] text-[11px] font-medium truncate">
                    {pollingUnit}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mx-6 border-t border-white/10 mb-2 shrink-0" />

        <div className="px-6 mb-1 shrink-0">
          <span className="text-white/30 text-[9px] font-bold tracking-widest uppercase">
            Navigation
          </span>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 scrollbar-none">
          <PUSidebarNav />
        </div>

        <div className="px-4 py-5 shrink-0">
          <div className="mx-2 border-t border-white/10 mb-4" />
          <form action={logoutResultsAdmin}>
            <button
              type="submit"
              className="w-full py-2.5 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white/65 hover:text-white border border-white/15 hover:border-white/25 rounded-xl text-[13px] font-semibold cursor-pointer transition-all duration-150"
            >
              <span className="text-sm">↩</span> Sign Out
            </button>
          </form>
          <p className="text-center text-white/25 text-[10px] mt-3 tracking-wide">
            Oyo South Senatorial District
          </p>
        </div>
      </aside>

      <main className="flex-1 w-full h-screen overflow-y-auto">{children}</main>
    </div>
  );
}
