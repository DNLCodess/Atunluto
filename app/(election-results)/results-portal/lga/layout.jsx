/**
 * app/results/lga/layout.jsx
 * LGA Admin shell — auth guard + sidebar + session data injection.
 */

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import "../erms.css";

const C = {
  primary: "#1B5E20",
  secondary: "#2E7D32",
  accent: "#4CAF50",
  light: "#C8E6C9",
  white: "#FFFFFF",
  gray: "#757575",
  border: "#E0E0E0",
};

const NAV_ITEMS = [
  { href: "/results-portal/lga/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/results-portal/lga/submit", label: "Submit Result", icon: "📊" },
  { href: "/results-portal/lga/results", label: "My Results", icon: "📋" },
  { href: "/results-portal/lga/report", label: "Report Issue", icon: "🚨" },
  { href: "/results-portal/lga/settings", label: "Settings", icon: "⚙️" },
];

export default async function LGALayout({ children }) {
  const hdrs = await headers();
  const role = hdrs.get("x-erms-role");
  const adminId = hdrs.get("x-erms-id") || "";
  const lga = hdrs.get("x-erms-lga") || "";
  const name = hdrs.get("x-erms-name") || "LGA Admin";

  if (!role || role !== "lga_admin") redirect("/results-portal/login");

  return (
    <div
      className="erms-root erms-shell"
      /* Inject session into DOM so client components can read it */
      data-erms-id={adminId}
      data-erms-lga={lga}
      data-erms-name={name}
    >
      {/* Skip to content */}
      <a href="#erms-main" className="erms-skip-link">
        Skip to content
      </a>

      {/* ── Sidebar ───────────────────────── */}
      <aside className="erms-sidebar" aria-label="LGA Admin Navigation">
        {/* Logo */}
        <div
          className="erms-sidebar-logo"
          style={{
            padding: "24px 20px 16px",
            borderBottom: `1px solid rgba(255,255,255,0.12)`,
          }}
        >
          <div
            style={{
              fontFamily: "Montserrat, sans-serif",
              fontSize: "14px",
              fontWeight: 900,
              color: C.white,
              letterSpacing: "1px",
            }}
          >
            ATUNLUTO
          </div>
          <div
            style={{
              fontSize: "10px",
              color: "rgba(255,255,255,0.55)",
              letterSpacing: "0.5px",
              marginTop: "2px",
            }}
          >
            ELECTION RESULTS SYSTEM
          </div>
        </div>

        {/* Role badge */}
        <div
          className="erms-sidebar-role"
          style={{
            padding: "14px 20px",
            borderBottom: `1px solid rgba(255,255,255,0.12)`,
          }}
        >
          <div
            style={{
              background: "rgba(255,255,255,0.12)",
              borderRadius: "8px",
              padding: "10px 12px",
            }}
          >
            <div
              style={{
                fontSize: "10px",
                color: "rgba(255,255,255,0.55)",
                fontWeight: 700,
                letterSpacing: "0.8px",
                textTransform: "uppercase",
                marginBottom: "3px",
              }}
            >
              LGA Admin
            </div>
            <div
              style={{
                fontSize: "14px",
                color: C.white,
                fontWeight: 700,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {name}
            </div>
            <div style={{ fontSize: "11px", color: C.light, marginTop: "2px" }}>
              📍 {lga}
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="erms-sidebar-nav" style={{ padding: "12px 0" }}>
          {NAV_ITEMS.map(({ href, label, icon }) => (
            <SidebarLink key={href} href={href} label={label} icon={icon} />
          ))}
        </nav>

        {/* Footer */}
        <div
          className="erms-sidebar-footer"
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "16px 20px",
            borderTop: `1px solid rgba(255,255,255,0.12)`,
          }}
        >
          <form action="/results/api/logout" method="POST">
            <button
              type="submit"
              style={{
                width: "100%",
                padding: "10px",
                background: "rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.75)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "Poppins, sans-serif",
              }}
            >
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* ── Main content ──────────────────── */}
      <main
        id="erms-main"
        className="erms-content"
        style={{ background: "#F5F5F5", minHeight: "100vh" }}
      >
        {children}
      </main>
    </div>
  );
}

function SidebarLink({ href, label, icon }) {
  return (
    <Link
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "11px 20px",
        color: "rgba(255,255,255,0.8)",
        textDecoration: "none",
        fontSize: "13px",
        fontWeight: 500,
        transition: "all 0.15s",
        borderLeft: "3px solid transparent",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(255,255,255,0.1)";
        e.currentTarget.style.color = "#fff";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.color = "rgba(255,255,255,0.8)";
      }}
    >
      <span style={{ fontSize: "16px", width: "20px", textAlign: "center" }}>
        {icon}
      </span>
      <span className="erms-sidebar-label">{label}</span>
    </Link>
  );
}
