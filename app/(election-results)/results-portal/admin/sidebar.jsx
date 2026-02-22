"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutResultsAdmin } from "@/app/actions/election-auth";

const NAV_ITEMS = [
  { href: "/results-portal/admin", label: "Dashboard", icon: "🏠" },
  { href: "/results-portal/admin/elections", label: "Elections", icon: "🗳️" },
  { href: "/results-portal/admin/admins", label: "LGA Admins", icon: "👥" },
  { href: "/results-portal/admin/results", label: "Collation", icon: "📊" },
  { href: "/results-portal/admin/audit", label: "Audit Log", icon: "📋" },
  { href: "/results-portal/admin/reports", label: "Security", icon: "🔒" },
];

export default function Sidebar({ name }) {
  const pathname = usePathname();
  const initial =
    name?.trim().length > 0 ? name.trim().charAt(0).toUpperCase() : "A";

  return (
    <aside className="w-64 min-h-screen bg-[#1B5E20] flex flex-col shrink-0 shadow-xl print:hidden">
      {/* Branding */}
      <div className="px-6 pt-7 pb-5">
        <div className="flex items-center gap-3 mb-1">
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

      <div className="mx-6 border-t border-white/10" />

      {/* User badge */}
      <div className="px-4 py-4">
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
                State Admin
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-6 border-t border-white/10 mb-2" />

      {/* Nav label */}
      <div className="px-6 mb-1">
        <span className="text-white/35 text-[9px] font-bold tracking-widest uppercase">
          Navigation
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3">
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const isActive =
            href === "/results-portal/admin"
              ? pathname === href
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 my-0.5 rounded-lg text-[13px] font-medium transition-all duration-150 group
                ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "text-white/65 hover:text-white hover:bg-white/10"
                }`}
            >
              <span
                className={`w-5 h-5 flex items-center justify-center text-sm transition-opacity ${isActive ? "opacity-100" : "opacity-75 group-hover:opacity-100"}`}
              >
                {icon}
              </span>
              <span className="tracking-wide">{label}</span>
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#A5D6A7]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom — logout */}
      <div className="px-4 py-5 mt-2">
        <div className="mx-2 border-t border-white/10 mb-4" />
        <form action={logoutResultsAdmin}>
          <button
            type="submit"
            className="w-full py-2.5 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white/65 hover:text-white border border-white/15 hover:border-white/25 rounded-xl text-[13px] font-semibold cursor-pointer transition-all duration-150"
          >
            <span className="text-sm">↩</span>
            Sign Out
          </button>
        </form>
        <p className="text-center text-white/25 text-[10px] mt-3 tracking-wide">
          Oyo South Senatorial District
        </p>
      </div>
    </aside>
  );
}
