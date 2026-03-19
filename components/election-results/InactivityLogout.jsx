"use client";

/**
 * ERMSInactivityLogout — Election Results Portal
 * - Logs out after 15 minutes of inactivity
 *
 * Note: sendBeacon on pagehide was removed — pagehide fires on page refresh
 * as well as tab close, making it impossible to distinguish the two without
 * a more complex architecture. The 15-minute inactivity timer is the primary
 * security mechanism.
 */

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

const IDLE_TIMEOUT = 15 * 60 * 1000; // 15 minutes

const ACTIVITY_EVENTS = [
  "mousemove",
  "mousedown",
  "keydown",
  "touchstart",
  "scroll",
  "click",
];

export default function ERMSInactivityLogout() {
  const router = useRouter();
  const timerRef = useRef(null);
  const isLoggingOut = useRef(false);

  const performLogout = useCallback(async () => {
    if (isLoggingOut.current) return;
    isLoggingOut.current = true;
    try {
      await fetch("/results-portal/logout", { method: "POST" });
    } catch {
      // best effort
    }
    router.replace("/results-portal/login");
  }, [router]);

  const resetTimer = useCallback(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(performLogout, IDLE_TIMEOUT);
  }, [performLogout]);

  useEffect(() => {
    resetTimer();

    ACTIVITY_EVENTS.forEach((ev) =>
      window.addEventListener(ev, resetTimer, { passive: true })
    );

    return () => {
      clearTimeout(timerRef.current);
      ACTIVITY_EVENTS.forEach((ev) => window.removeEventListener(ev, resetTimer));
    };
  }, [resetTimer]);

  return null;
}
