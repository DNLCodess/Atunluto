"use client";

/**
 * ERMSInactivityLogout — Election Results Portal
 *
 * Mounts all three session-management hooks for the authenticated ERMS:
 *  - 15-minute inactivity timer → GET /results-portal/logout
 *  - 60-second heartbeat        → POST /results-portal/heartbeat
 *  - Tab/window close beacon    → POST /results-portal/logout
 */

import { useInactivityLogout } from "@/hooks/use-inactivity-logout";
import { useHeartbeat } from "@/hooks/use-heartbeat";
import { useTabCloseLogout } from "@/hooks/use-tab-close-logout";

export default function ERMSInactivityLogout() {
  useInactivityLogout("/results-portal/logout");
  useHeartbeat("/results-portal/heartbeat");
  useTabCloseLogout("/results-portal/logout");
  return null;
}
