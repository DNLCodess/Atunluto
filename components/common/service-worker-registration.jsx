"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    // Only register service worker in production or when explicitly enabled
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      (process.env.NODE_ENV === "production" ||
        process.env.NEXT_PUBLIC_ENABLE_SW === "true")
    ) {
      const registerServiceWorker = async () => {
        try {
          // Wait for the page to load before registering
          if (document.readyState === "complete") {
            await register();
          } else {
            window.addEventListener("load", register);
          }
        } catch (error) {
          console.error("Service Worker registration error:", error);
        }
      };

      const register = async () => {
        try {
          const registration = await navigator.serviceWorker.register(
            "/service-worker.js",
            {
              scope: "/",
              updateViaCache: "none",
            }
          );

          console.log(
            "✅ Service Worker registered successfully:",
            registration.scope
          );

          // Check for updates
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;

            if (newWorker) {
              console.log("🔄 New service worker found, installing...");

              newWorker.addEventListener("statechange", () => {
                if (
                  newWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  console.log("✨ New service worker available");

                  // Show update notification (optional)
                  if (
                    window.confirm("New version available! Reload to update?")
                  ) {
                    newWorker.postMessage({ type: "SKIP_WAITING" });
                    window.location.reload();
                  }
                }
              });
            }
          });

          // Check for updates on page visibility change
          document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "visible") {
              registration.update();
            }
          });
        } catch (error) {
          console.error("❌ Service Worker registration failed:", error);
        }
      };

      registerServiceWorker();

      // Handle controller change
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        console.log("🔄 Service Worker controller changed");
        window.location.reload();
      });

      // Handle install prompt
      window.addEventListener("beforeinstallprompt", (event) => {
        console.log("📲 App can be installed");
        event.preventDefault();
        window.deferredPrompt = event;
      });

      // Detect when app is installed
      window.addEventListener("appinstalled", () => {
        console.log("✅ PWA was installed");
        window.deferredPrompt = null;
      });

      // Handle online/offline status
      window.addEventListener("online", () => {
        console.log("🌐 App is online");
        // Sync any pending data
        if ("serviceWorker" in navigator && "sync" in navigator.serviceWorker) {
          navigator.serviceWorker.ready
            .then((registration) => {
              return registration.sync.register("sync-registrations");
            })
            .catch((err) => console.log("Sync registration failed:", err));
        }
      });

      window.addEventListener("offline", () => {
        console.log("📵 App is offline");
      });
    } else if (process.env.NODE_ENV === "development") {
      console.log("ℹ️ Service Worker disabled in development mode");
      console.log("   Set NEXT_PUBLIC_ENABLE_SW=true in .env.local to enable");
    }

    // Cleanup
    return () => {
      // Event listeners are automatically cleaned up
    };
  }, []);

  return null;
}
