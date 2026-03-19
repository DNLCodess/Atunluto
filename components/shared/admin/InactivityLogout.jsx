"use client";

/**
 * InactivityLogout — Registration Portal (Dashboard)
 * - Logs out after 15 minutes of inactivity
 * - Instantly revokes session when tab/window is closed
 */

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/supabase/client";

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
  const router = useRouter();
  const timerRef = useRef(null);
  const isLoggingOut = useRef(false);

  const performLogout = useCallback(async () => {
    if (isLoggingOut.current) return;
    isLoggingOut.current = true;
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
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

    // Revoke session immediately when tab/window is closed
    const handlePageHide = () => {
      navigator.sendBeacon("/api/logout/dashboard");
    };
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      clearTimeout(timerRef.current);
      ACTIVITY_EVENTS.forEach((ev) => window.removeEventListener(ev, resetTimer));
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [resetTimer]);

  return null;
}
