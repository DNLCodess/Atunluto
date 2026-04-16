"use client";

import { useEffect } from "react";

/**
 * Forces the browser to check for a new service worker on every page load.
 * Without this, browsers only re-fetch service-worker.js every 24 hours,
 * so stale cached JS chunks can survive across deployments and crash the app.
 *
 * When a new SW is found and activated it reloads the page once so users
 * always run the current bundle.
 */
export default function ServiceWorkerUpdater() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.getRegistration("/").then((reg) => {
      if (!reg) return;

      // Force an immediate update check (bypasses the 24h browser throttle)
      reg.update().catch(() => {});

      reg.addEventListener("updatefound", () => {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener("statechange", () => {
          // New SW activated + page is not already controlled by it → reload once
          if (
            newWorker.state === "activated" &&
            navigator.serviceWorker.controller
          ) {
            window.location.reload();
          }
        });
      });
    });
  }, []);

  return null;
}
