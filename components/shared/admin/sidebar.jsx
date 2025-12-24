"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import useAuthStore from "@/lib/store";
// React Icons
import {
  MdDashboard,
  MdPeople,
  MdPersonAdd,
  MdAssessment,
  MdCampaign,
  MdCamera,
  MdSettings,
  MdSecurity,
  MdHome,
  MdArrowBack,
} from "react-icons/md";

export default function Sidebar() {
  const pathname = usePathname();
  const { role, profile, isLoading } = useAuthStore();

  // ICON MAP
  const icons = {
    Dashboard: <MdDashboard />,
    People: <MdPeople />,
    "Add Person": <MdPersonAdd />,
    Chart: <MdAssessment />,
    Megaphone: <MdCampaign />,
    Camera: <MdCamera />,
    Settings: <MdSettings />,
    Shield: <MdSecurity />,
  };

  const getNavItems = () => {
    const baseItems = [
      { name: "Dashboard", href: "/dashboard", icon: "Dashboard" },
      { name: "Members", href: "/dashboard/members", icon: "People" },
      {
        name: "Register Member",
        href: "/dashboard/add-member",
        icon: "Add Person",
      },
    ];

    const adminItems = {
      reports: { name: "Reports", href: "/dashboard/reports", icon: "Chart" },
      broadcast: {
        name: "Broadcast",
        href: "/dashboard/broadcast",
        icon: "Megaphone",
      },
      settings: {
        name: "Settings",
        href: "/dashboard/settings",
        icon: "Settings",
      },
      admins: { name: "Admins", href: "/dashboard/admins", icon: "Shield" },
      gallery: { name: "Gallery", href: "/dashboard/gallery", icon: "Camera" },
    };

    // Manager role gets Dashboard + Gallery only
    if (role === "manager") {
      return [baseItems[0], adminItems.gallery];
    }

    // Admin/Superuser gets everything
    if (role === "super_user" || role === "administrator") {
      return [...baseItems, adminItems.gallery];
    }

    // Registration staff and others get base items only
    return baseItems;
  };

  const navItems = getNavItems();

  if (isLoading)
    return (
      <div className="w-72 bg-gradient-to-b from-[#1B5E20] to-[#2E7D32] animate-pulse" />
    );

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#1B5E20] to-[#2E7D32] text-white shadow-2xl">
      {/* Back to Main Site Button */}
      <Link
        href="/"
        prefetch={true}
        className="mx-4 mt-4 mb-2 flex items-center gap-3 px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 transition-all duration-300 hover:scale-[1.02] group"
      >
        <MdArrowBack className="text-xl group-hover:-translate-x-1 transition-transform duration-300" />
        <div className="flex-1">
          <span className="text-sm font-medium block">Back to</span>
          <span className="text-xs text-green-100">Main Website</span>
        </div>
        <MdHome className="text-2xl opacity-50 group-hover:opacity-100 transition-opacity" />
      </Link>

      {/* Logo Section */}
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
            <MdSecurity className="text-2xl text-[#C8E6C9]" />
          </div>
          <div>
            <h2
              className="text-xl font-extrabold tracking-wide"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              ADMIN PORTAL
            </h2>
            <p className="text-[#C8E6C9] text-xs font-medium">Atunluto Group</p>
          </div>
        </div>

        {profile && (
          <div className="mt-4 p-3 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10">
            <p className="text-[#C8E6C9] text-xs font-medium mb-1">
              Logged in as
            </p>
            <p className="font-semibold text-sm mb-2 truncate">
              {profile.full_name}
            </p>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#4CAF50] rounded-full text-xs font-bold shadow-lg">
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
              {role?.toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navItems.map((item, index) => {
          const isActive =
            pathname &&
            (pathname === item.href || pathname.startsWith(item.href + "/"));
          return (
            <Link
              key={item.name}
              href={item.href}
              prefetch={true}
              className={`flex items-center gap-4 px-4 py-3.5 rounded-lg font-medium transition-all duration-300 group relative overflow-hidden ${
                isActive
                  ? "bg-white text-[#1B5E20] shadow-xl scale-[1.02]"
                  : "hover:bg-white/10 hover:translate-x-1 hover:shadow-lg backdrop-blur-sm"
              }`}
              style={{
                animationDelay: `${index * 50}ms`,
              }}
            >
              {/* Hover Effect Background */}
              {!isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              )}

              <span
                className={`text-2xl relative z-10 transition-transform duration-300 ${
                  isActive ? "scale-110" : "group-hover:scale-110"
                }`}
              >
                {icons[item.icon]}
              </span>
              <span className="relative z-10 text-base">{item.name}</span>

              {isActive && (
                <div className="ml-auto flex items-center gap-2 relative z-10">
                  <div className="w-2 h-2 bg-[#4CAF50] rounded-full animate-pulse"></div>
                  <div className="w-1 h-1 bg-[#4CAF50] rounded-full animate-pulse delay-75"></div>
                </div>
              )}

              {!isActive && (
                <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300 relative z-10">
                  <div className="w-1.5 h-1.5 bg-[#C8E6C9] rounded-full"></div>
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-6 border-t border-white/10">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-8 h-0.5 bg-gradient-to-r from-transparent via-[#C8E6C9] to-transparent"></div>
        </div>
        <p className="text-[#C8E6C9] text-xs text-center font-medium">
          © 2025 Atunluto Group
        </p>
        <p className="text-white/40 text-xs text-center mt-1">
          Oyo South Senatorial District
        </p>
      </div>
    </div>
  );
}
