/**
 * app/results-portal/admin/layout.jsx
 * State Admin shell — auth guard + fixed sidebar layout.
 */

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Sidebar from "./sidebar";

export default async function StateAdminLayout({ children }) {
  const hdrs = await headers();
  const role = hdrs.get("x-erms-role");
  const name = hdrs.get("x-erms-name") || "State Admin";

  if (!role || role !== "state_admin") redirect("/results-portal/login");

  return (
    <div className="h-screen flex overflow-hidden bg-[#F0F4F0]">
      {/* Skip link */}
      <a
        href="#erms-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-[#1B5E20] focus:rounded-lg focus:shadow-lg focus:text-sm focus:font-semibold"
      >
        Skip to content
      </a>

      {/* Print-only header */}
      <div className="hidden print:block print:mb-6 print:fixed print:top-0 print:left-0 print:right-0">
        <h1 className="text-lg font-bold">
          Atunluto Group — Election Results Management System
        </h1>
        <p className="text-sm text-[#757575]">
          Oyo South Senatorial District · Confidential
        </p>
      </div>

      {/* Sidebar */}
      <Sidebar name={name} />

      {/* Main — scrolls independently */}
      <main
        id="erms-main"
        className="flex-1 min-w-0 h-screen overflow-y-auto print:overflow-visible"
      >
        {children}
      </main>
    </div>
  );
}
