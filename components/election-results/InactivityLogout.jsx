"use client";

/**
 * ERMSInactivityLogout — Election Results Portal
 * Logs out after 15 minutes of inactivity.
 *
 * On timeout: navigates to /results-portal/logout (GET) which revokes the
 * session server-side and redirects to /results-portal/login — no async
 * fetch to wait for, no blank page, no race condition.
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

export default function ERMSInactivityLogout() {
  const timerRef = useRef(null);
  const isLoggingOut = useRef(false);

  const performLogout = useCallback(() => {
    if (isLoggingOut.current) return;
    isLoggingOut.current = true;
    window.location.replace("/results-portal/logout");
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
