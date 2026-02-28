"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/results-portal/lga", label: "Dashboard", icon: "🏠", exact: true },
  {
    href: "/results-portal/lga/submit",
    label: "Submit Result",
    icon: "📊",
    exact: false,
  },
  {
    href: "/results-portal/lga/results",
    label: "My Results",
    icon: "📋",
    exact: false,
  },
  {
    href: "/results-portal/lga/agents",
    label: "PU Agents",
    icon: "📍",
    exact: false,
  },
  {
    href: "/results-portal/lga/report",
    label: "Report Issue",
    icon: "🚨",
    exact: false,
  },
  {
    href: "/results-portal/lga/settings",
    label: "Settings",
    icon: "⚙️",
    exact: false,
  },
];

export default function LGASidebarNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Main navigation">
      {NAV_ITEMS.map(({ href, label, icon, exact }) => {
        const isActive = exact ? pathname === href : pathname.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            className={`
              flex items-center gap-3 px-3 py-2.5 my-0.5 rounded-lg text-[13px] font-medium
              transition-all duration-150 no-underline group relative
              ${
                isActive
                  ? "bg-white/20 text-white"
                  : "text-white/65 hover:text-white hover:bg-white/10"
              }
            `}
            aria-current={isActive ? "page" : undefined}
          >
            {isActive && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#A5D6A7] rounded-full" />
            )}
            <span
              className={`w-5 h-5 flex items-center justify-center text-sm transition-opacity
              ${isActive ? "opacity-100" : "opacity-75 group-hover:opacity-100"}`}
            >
              {icon}
            </span>
            <span className="tracking-wide flex-1">{label}</span>
            {isActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#A5D6A7] shrink-0" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
