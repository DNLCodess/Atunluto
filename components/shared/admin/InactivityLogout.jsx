"use client";

/**
 * InactivityLogout — Registration Portal (Dashboard)
 *
 * Mounts all three session-management hooks for the authenticated dashboard:
 *  - 15-minute inactivity timer → GET /api/logout/dashboard
 *  - 60-second heartbeat        → POST /api/heartbeat/dashboard
 *  - Tab/window close beacon    → POST /api/logout/dashboard
 */

import { useInactivityLogout } from "@/hooks/use-inactivity-logout";
import { useHeartbeat } from "@/hooks/use-heartbeat";
import { useTabCloseLogout } from "@/hooks/use-tab-close-logout";

export default function InactivityLogout() {
  useInactivityLogout("/api/logout/dashboard");
  useHeartbeat("/api/heartbeat/dashboard");
  useTabCloseLogout("/api/logout/dashboard");
  return null;
}
