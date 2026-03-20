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

/**
 * Resets a 15-minute countdown on every user activity event.
 * When the timer expires, navigates to logoutUrl (GET) which signs out
 * server-side — no client-side signOut(), no race conditions.
 *
 * @param {string} logoutUrl  Full path to the logout GET endpoint.
 */
export function useInactivityLogout(logoutUrl) {
  const timerRef = useRef(null);
  const isLoggingOut = useRef(false);

  const performLogout = useCallback(() => {
    if (isLoggingOut.current) return;
    isLoggingOut.current = true;
    window.location.replace(logoutUrl);
  }, [logoutUrl]);

  const resetTimer = useCallback(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(performLogout, IDLE_TIMEOUT);
  }, [performLogout]);

  useEffect(() => {
    resetTimer();

    ACTIVITY_EVENTS.forEach((ev) =>
      window.addEventListener(ev, resetTimer, { passive: true }),
    );

    return () => {
      clearTimeout(timerRef.current);
      ACTIVITY_EVENTS.forEach((ev) =>
        window.removeEventListener(ev, resetTimer),
      );
    };
  }, [resetTimer]);
}
