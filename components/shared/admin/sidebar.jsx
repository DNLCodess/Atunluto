"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrentAdmin } from "@/hooks/use-admins";

// ─── Inline SVG icons ─────────────────────────────────────────────────────────
const Icons = {
  LayoutDashboard: (props) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.size ?? 18}
      height={props.size ?? 18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  ),
  Users: (props) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.size ?? 18}
      height={props.size ?? 18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  UserPlus: (props) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.size ?? 18}
      height={props.size ?? 18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  ),
  Shield: (props) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.size ?? 18}
      height={props.size ?? 18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  Image: (props) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.size ?? 18}
      height={props.size ?? 18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  ),
  FileText: (props) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.size ?? 18}
      height={props.size ?? 18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  ),
  Building2: (props) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.size ?? 18}
      height={props.size ?? 18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
      <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
      <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
      <path d="M10 6h4" />
      <path d="M10 10h4" />
      <path d="M10 14h4" />
      <path d="M10 18h4" />
    </svg>
  ),
  Home: (props) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.size ?? 18}
      height={props.size ?? 18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  ArrowLeft: (props) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.size ?? 18}
      height={props.size ?? 18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  ),
  Lock: (props) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.size ?? 18}
      height={props.size ?? 18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  ChevronRight: (props) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.size ?? 18}
      height={props.size ?? 18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
};

// ─── Role-based nav config ────────────────────────────────────────────────────
function getNavItems(role) {
  const all = {
    dashboard: {
      label: "Dashboard",
      href: "/dashboard",
      icon: Icons.LayoutDashboard,
    },
    members: {
      label: "Members",
      href: "/dashboard/members",
      icon: Icons.Users,
    },
    addMember: {
      label: "Register Member",
      href: "/dashboard/add-member",
      icon: Icons.UserPlus,
    },
    admins: {
      label: "Admin Management",
      href: "/dashboard/admins",
      icon: Icons.Shield,
    },
    gallery: {
      label: "Gallery",
      href: "/dashboard/gallery",
      icon: Icons.Image,
    },
    content: {
      label: "Site Content",
      href: "/dashboard/content",
      icon: Icons.FileText,
    },
  };

  switch (role) {
    case "state_admin":
      return [
        all.dashboard,
        all.members,
        all.addMember,
        all.admins,
        all.gallery,
        all.content,
      ];
    case "super_user":
      return [
        all.dashboard,
        all.members,
        all.addMember,
        all.admins,
        all.gallery,
        all.content,
      ];
    case "administrator":
      return [all.dashboard, all.members, all.addMember, all.gallery];
    case "registration":
      return [all.dashboard, all.addMember, all.members];
    case "manager":
      return [all.dashboard, all.gallery, all.content];
    default:
      return [all.dashboard];
  }
}

// ─── Role display meta ────────────────────────────────────────────────────────
const ROLE_META = {
  state_admin: { label: "State Admin", color: "bg-amber-500" },
  super_user: { label: "LGA Super User", color: "bg-accent-green" },
  administrator: { label: "Administrator", color: "bg-blue-500" },
  registration: { label: "Registration Staff", color: "bg-violet-500" },
  manager: { label: "Content Manager", color: "bg-text-gray" },
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function Sidebar() {
  const pathname = usePathname();
  const { data: actor, isLoading } = useCurrentAdmin();

  if (isLoading || !actor) {
    return <SidebarSkeleton />;
  }

  const role = actor.role;
  const navItems = getNavItems(role);
  const roleMeta = ROLE_META[role];

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-primary-green to-secondary-green text-white shadow-2xl">
      {/* Back to main site */}
      <Link
        href="/"
        className="mx-4 mt-4 mb-2 flex items-center gap-3 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 transition-all duration-200 group"
      >
        <Icons.ArrowLeft
          size={17}
          className="shrink-0 group-hover:-translate-x-0.5 transition-transform duration-200"
        />
        <div className="flex-1 min-w-0">
          <span className="text-xs font-medium block text-white/80">
            Back to
          </span>
          <span className="text-sm font-semibold text-white">Main Website</span>
        </div>
        <Icons.Home
          size={17}
          className="text-white/40 group-hover:text-white/80 transition-colors"
        />
      </Link>

      {/* Brand + profile */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
            <Icons.Lock size={18} className="text-light-green" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-extrabold font-primary tracking-wide leading-tight">
              ADMIN PORTAL
            </h2>
            <p className="text-light-green text-xs font-medium">
              Atunluto Group
            </p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white/8 border border-white/10 space-y-1.5">
          <p className="text-white/60 text-xs font-medium">Logged in as</p>
          <p className="font-semibold text-sm text-white truncate">
            {actor.full_name || actor.email}
          </p>
          {actor.lga && (
            <p className="text-white/60 text-xs flex items-center gap-1">
              <Icons.Building2 size={11} className="shrink-0" />
              {actor.lga}
            </p>
          )}
          {roleMeta && (
            <div className="flex items-center gap-1.5 pt-0.5">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${roleMeta.color} text-white`}
              >
                <span className="w-1.5 h-1.5 bg-white/60 rounded-full" />
                {roleMeta.label}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              className={`flex items-center gap-3 px-3.5 py-3 rounded-xl font-medium transition-all duration-150 group relative ${
                isActive
                  ? "bg-white text-primary-green shadow-lg"
                  : "text-white/80 hover:bg-white/12 hover:text-white"
              }`}
            >
              <Icon
                size={18}
                className={`shrink-0 transition-transform duration-150 ${
                  isActive
                    ? "text-primary-green"
                    : "text-white/70 group-hover:text-white group-hover:scale-110"
                }`}
              />
              <span
                className={`text-sm flex-1 ${isActive ? "font-semibold" : ""}`}
              >
                {item.label}
              </span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-accent-green shrink-0" />
              )}
              {!isActive && (
                <Icons.ChevronRight
                  size={13}
                  className="text-white/0 group-hover:text-white/40 transition-colors shrink-0"
                />
              )}
            </Link>
          );
        })}

        {/* LGA Setup shortcut — state_admin only */}
        {role === "state_admin" && (
          <>
            <div className="pt-3 pb-1 px-3">
              <p className="text-white/30 text-xs font-medium uppercase tracking-widest">
                Quick Access
              </p>
            </div>
            <Link
              href="/dashboard/admins/setup"
              prefetch
              className={`flex items-center gap-3 px-3.5 py-3 rounded-xl font-medium transition-all duration-150 group ${
                pathname.startsWith("/dashboard/admins/setup")
                  ? "bg-white text-primary-green shadow-lg"
                  : "text-white/80 hover:bg-white/12 hover:text-white"
              }`}
            >
              <Icons.Building2
                size={18}
                className={`shrink-0 ${
                  pathname.startsWith("/dashboard/admins/setup")
                    ? "text-primary-green"
                    : "text-white/70 group-hover:text-white group-hover:scale-110 transition-transform"
                }`}
              />
              <span className="text-sm flex-1">LGA Setup Wizard</span>
              <span className="text-xs px-1.5 py-0.5 rounded-md bg-accent-green/30 text-light-green font-medium">
                New
              </span>
            </Link>
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-white/10">
        <p className="text-white/40 text-xs text-center font-secondary">
          © {new Date().getFullYear()} Atunluto Group
        </p>
        <p className="text-white/25 text-xs text-center mt-0.5">
          Oyo South Senatorial District
        </p>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SidebarSkeleton() {
  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-primary-green to-secondary-green">
      <div className="animate-pulse space-y-4 p-5">
        <div className="h-12 bg-white/10 rounded-xl" />
        <div className="flex items-center gap-3 py-1">
          <div className="w-11 h-11 rounded-xl bg-white/10 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-white/10 rounded w-3/4" />
            <div className="h-3 bg-white/10 rounded w-1/2" />
          </div>
        </div>
        <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2">
          <div className="h-3 bg-white/10 rounded w-1/3" />
          <div className="h-4 bg-white/10 rounded w-2/3" />
          <div className="h-6 bg-white/10 rounded-full w-28" />
        </div>
        <div className="space-y-1.5 pt-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-11 bg-white/10 rounded-xl"
              style={{ opacity: 1 - i * 0.12 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
