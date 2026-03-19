/**
 * app/results-portal/admin/layout.jsx
 * State Admin shell — auth guard + fixed sidebar layout.
 */

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Sidebar from "./sidebar";
import ERMSInactivityLogout from "@/components/election-results/InactivityLogout";

export default async function StateAdminLayout({ children }) {
  const hdrs = await headers();
  const role = hdrs.get("x-erms-role");
  const name = hdrs.get("x-erms-name") || "State Admin";

  if (!role || role !== "state_admin") redirect("/results-portal/login");

  return (
    <div className="h-screen flex overflow-hidden bg-[#F0F4F0]">
      {/* Skip link */}

      {/* Print-only header */}
      <div className="hidden print:block print:mb-6 print:fixed print:top-0 print:left-0 print:right-0">
        <h1 className="text-lg font-bold">
          Atunluto Group — Election Results Management System
        </h1>
        <p className="text-sm text-text-gray">
          Oyo South Senatorial District · Confidential
        </p>
      </div>

      {/* Sidebar */}
      <Sidebar name={name} />

      {/* Main — scrolls independently */}
      <main className="flex-1 min-w-0 h-screen overflow-y-auto print:overflow-visible">
        <ERMSInactivityLogout />
        {children}
      </main>
    </div>
  );
}
