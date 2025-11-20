"use client";

import { useState, useEffect } from "react";

export default function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  // Detect iOS - computed once, no setState
  const isIOS = (() => {
    if (typeof window === "undefined") return false;
    try {
      return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    } catch {
      return false;
    }
  })();

  // Detect standalone mode - computed once, no setState
  const isStandalone = (() => {
    if (typeof window === "undefined") return false;
    try {
      return (
        window.matchMedia("(display-mode: standalone)").matches ||
        window.navigator.standalone === true ||
        document.referrer.includes("android-app://")
      );
    } catch {
      return false;
    }
  })();

  useEffect(() => {
    // Don't run if already installed
    if (isStandalone) return;

    // Check dismiss tracking
    const dismissedTime = localStorage.getItem("installPromptDismissed");
    const dismissedCount = parseInt(
      localStorage.getItem("installPromptDismissCount") || "0"
    );

    const shouldShowPrompt = () => {
      // iOS logic
      if (isIOS) {
        if (!dismissedTime) return true;
        const hours = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60);
        return hours >= 24;
      }

      // First time visitor
      if (!dismissedTime) return true;

      const hours = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60);

      // Show after 24 hours if dismissed less than 3 times
      if (dismissedCount < 3) return hours >= 24;

      // Show after 7 days if dismissed 3+ times
      return hours >= 168;
    };

    // ANDROID / DESKTOP PWA INSTALL
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);

      if (shouldShowPrompt()) {
        setTimeout(() => setShowPrompt(true), 2000);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // iOS MANUAL INSTRUCTIONS
    if (isIOS && shouldShowPrompt()) {
      setTimeout(() => setShowPrompt(true), 2000);
    }

    // APP INSTALLED EVENT
    const handleAppInstalled = () => {
      setShowPrompt(false);
      setShowIOSModal(false);
      setDeferredPrompt(null);

      // Clear dismiss history
      localStorage.removeItem("installPromptDismissed");
      localStorage.removeItem("installPromptDismissCount");
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    // Cleanup
    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [isIOS, isStandalone]);

  // INSTALL BUTTON CLICK (Android/Desktop)
  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setShowPrompt(false);
      localStorage.removeItem("installPromptDismissed");
      localStorage.removeItem("installPromptDismissCount");
    } else {
      handleDismiss();
    }

    setDeferredPrompt(null);
  };

  // iOS INSTALL BUTTON CLICK
  const handleIOSInstallClick = () => {
    setShowPrompt(false);
    setShowIOSModal(true);
  };

  // DISMISS PROMPT
  const handleDismiss = () => {
    setShowPrompt(false);
    setShowIOSModal(false);

    const count = parseInt(
      localStorage.getItem("installPromptDismissCount") || "0"
    );

    localStorage.setItem("installPromptDismissed", Date.now().toString());
    localStorage.setItem("installPromptDismissCount", (count + 1).toString());
  };

  // DON'T RENDER IF INSTALLED
  if (isStandalone) return null;

  return (
    <>
      {/* INSTALL PROMPT BANNER */}
      {showPrompt && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-primary-green shadow-lg animate-slide-up">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              {/* Icon */}
              <div className="shrink-0">
                <div className="w-12 h-12 bg-primary-green rounded-lg flex items-center justify-center">
                  <svg
                    className="w-7 h-7 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1">
                <h3 className="font-montserrat font-extrabold text-text-dark text-sm md:text-base">
                  Install Atunluto Group App
                </h3>
                <p className="font-poppins text-text-gray text-xs md:text-sm">
                  Get quick access and work offline
                </p>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={isIOS ? handleIOSInstallClick : handleInstallClick}
                  className="bg-primary-green text-white font-poppins font-semibold px-4 py-2 rounded-lg hover:bg-secondary-green transition-colors duration-200 text-sm md:text-base whitespace-nowrap"
                >
                  Install
                </button>
                <button
                  onClick={handleDismiss}
                  className="text-text-gray hover:text-text-dark transition-colors p-2"
                  aria-label="Close install prompt"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* iOS Install Instructions Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black bg-opacity-50 p-4 animate-fade-in">
          <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-xl max-w-md w-full p-6 animate-slide-up">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-montserrat font-extrabold text-text-dark">
                Install Atunluto App
              </h3>
              <button
                onClick={handleDismiss}
                className="text-text-gray hover:text-text-dark transition-colors"
                aria-label="Close modal"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-4 font-poppins text-text-dark">
              <p className="text-sm">
                To install this app on your iPhone/iPad:
              </p>

              <ol className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <span className="shrink-0 w-6 h-6 bg-primary-green text-white rounded-full flex items-center justify-center text-xs font-bold">
                    1
                  </span>
                  <span>
                    Tap the <strong>Share</strong> button
                    <svg
                      className="inline w-4 h-4 mx-1"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M16 5l-1.42 1.42-1.59-1.59V16h-1.98V4.83L9.42 6.42 8 5l4-4 4 4zm4 5v11c0 1.1-.9 2-2 2H6c-1.11 0-2-.9-2-2V10c0-1.11.89-2 2-2h3v2H6v11h12V10h-3V8h3c1.1 0 2 .89 2 2z" />
                    </svg>
                    in Safari
                  </span>
                </li>

                <li className="flex items-start gap-3">
                  <span className="shrink-0 w-6 h-6 bg-primary-green text-white rounded-full flex items-center justify-center text-xs font-bold">
                    2
                  </span>
                  <span>
                    Scroll down and tap{" "}
                    <strong>&quot;Add to Home Screen&quot;</strong>
                  </span>
                </li>

                <li className="flex items-start gap-3">
                  <span className="shrink-0 w-6 h-6 bg-primary-green text-white rounded-full flex items-center justify-center text-xs font-bold">
                    3
                  </span>
                  <span>
                    Tap <strong>&quot;Add&quot;</strong> in the top right corner
                  </span>
                </li>
              </ol>

              <div className="bg-light-green p-3 rounded-lg mt-4">
                <p className="text-xs text-text-dark">
                  <strong>Note:</strong> This only works in Safari browser. If
                  you&apos;re using another browser, please open this page in
                  Safari.
                </p>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              className="w-full mt-6 bg-primary-green text-white font-poppins font-semibold py-3 px-6 rounded-lg hover:bg-secondary-green transition-colors duration-200"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
