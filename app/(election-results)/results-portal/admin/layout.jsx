/**
 * app/results-portal/admin/layout.jsx
 * State Admin shell — auth guard + sidebar.
 * Server component: handles auth via headers(), passes name to Sidebar.
 */

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Sidebar from "./sidebar"; // client component

export default async function StateAdminLayout({ children }) {
  const hdrs = await headers();
  const role = hdrs.get("x-erms-role");
  const name = hdrs.get("x-erms-name") || "State Admin";

  if (!role || role !== "state_admin") redirect("/results-portal/login");

  return (
    <div className="min-h-screen flex bg-[#F0F4F0]">
      {/* Skip link */}
      <a
        href="#erms-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-[#1B5E20] focus:rounded-lg focus:shadow-lg focus:text-sm focus:font-semibold"
      >
        Skip to content
      </a>

      {/* Print-only header */}
      <div className="hidden print:block print:mb-6">
        <h1 className="text-lg font-bold">
          Atunluto Group — Election Results Management System
        </h1>
        <p className="text-sm text-text-gray">
          Oyo South Senatorial District · Printed{" "}
          {new Date().toLocaleDateString("en-NG")} · Confidential
        </p>
      </div>

      {/* Sidebar — client component, receives name as prop */}
      <Sidebar name={name} />

      {/* Main */}
      <main
        id="erms-main"
        className="flex-1 min-w-0 overflow-auto print:overflow-visible"
      >
        {children}
      </main>

      {/* Print footer */}
      <div className="hidden print:block print:mt-6 print:text-xs print:text-text-gray">
        Atunluto Group ERMS · Confidential · {new Date().getFullYear()}
      </div>
    </div>
  );
}
