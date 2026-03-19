"use client";

/**
 * InactivityLogout — Registration Portal (Dashboard)
 * Logs out after 15 minutes of inactivity.
 *
 * On timeout: navigates to /api/logout/dashboard (GET) which signs out
 * server-side and redirects to /login — no client-side signOut(), so
 * onAuthStateChange never fires and the layout never goes blank.
 */

import { useEffect, useRef, useCallback } from "react";

const IDLE_TIMEOUT = 15 * 60 * 1000; // 15 minutes

const ACTIVITY_EVENTS = [
  "mousemove",
  "mousedown",
  "keydown",
  "touchstart",
  "scroll",
  "click",
];

export default function InactivityLogout() {
  const timerRef = useRef(null);
  const isLoggingOut = useRef(false);

  const performLogout = useCallback(() => {
    if (isLoggingOut.current) return;
    isLoggingOut.current = true;
    window.location.replace("/api/logout/dashboard");
  }, []);

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
