import { useEffect } from "react";

/**
 * Uses navigator.sendBeacon to POST to beaconUrl on beforeunload so the
 * server can invalidate the session even if the page unloads before a
 * regular fetch completes.
 *
 * Note: beforeunload fires on tab/window close AND on hard refresh (F5).
 * Client-side Next.js navigation does NOT trigger beforeunload, so moving
 * between protected pages is unaffected.
 *
 * @param {string} beaconUrl  Full path to the logout POST endpoint.
 */
export function useTabCloseLogout(beaconUrl) {
  useEffect(() => {
    function handleBeforeUnload() {
      navigator.sendBeacon(beaconUrl);
    }

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [beaconUrl]);
}
