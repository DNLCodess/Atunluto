"use client";

import { Suspense } from "react";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Shield, CheckCircle2 } from "lucide-react";
import {
  loginResultsAdmin,
  getResultsSession,
} from "@/app/actions/election-auth";

const TRUST_POINTS = [
  "End-to-end encrypted result submissions",
  "Tamper-evident SHA-256 checksums",
  "Real-time collation across 9 LGAs",
];

// ── Session check with hard timeout so it never hangs forever ──
async function checkSessionWithTimeout(timeoutMs = 5000) {
  return Promise.race([
    getResultsSession(),
    new Promise((resolve) => setTimeout(() => resolve(null), timeoutMs)),
  ]);
}

// ── Inner component — uses useSearchParams, must be inside Suspense ──
function LoginForm() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "";
  const submitTimeoutRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const session = await checkSessionWithTimeout(5000);
        if (cancelled) return;

        if (session) {
          router.replace(
            session.role === "state_admin"
              ? "/results-portal/admin"
              : session.role === "polling_unit_admin"
                ? "/results-portal/pu"
                : "/results-portal/lga",
          );
        } else {
          setChecking(false);
        }
      } catch {
        // Session check failed — show the form anyway, never hang
        if (!cancelled) setChecking(false);
      }
    }

    checkSession();
    return () => {
      cancelled = true;
    };
  }, [router]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (submitTimeoutRef.current) clearTimeout(submitTimeoutRef.current);
    };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Hard timeout — if the server action hangs for >15s, unblock the UI
    submitTimeoutRef.current = setTimeout(() => {
      setLoading(false);
      setError(
        "Request timed out. Please check your connection and try again.",
      );
    }, 15000);

    try {
      const formData = new FormData(e.currentTarget);
      const result = await loginResultsAdmin(formData);

      // Clear the timeout — action returned in time
      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current);
        submitTimeoutRef.current = null;
      }

      if (result?.error) {
        setError(result.error);
        setLoading(false);
      }
      // On success, the server action redirects — loading stays true briefly
      // until navigation completes, which is the correct UX.
      // If redirect doesn't fire within 5s, unblock the button as a fallback.
      else if (!result?.error) {
        submitTimeoutRef.current = setTimeout(() => {
          setLoading(false);
          setError("Redirect failed. Please refresh and try again.");
        }, 5000);
      }
    } catch (err) {
      // Next.js redirect() throws a NEXT_REDIRECT error to trigger navigation —
      // it is not a real failure, so silently let the navigation proceed.
      if (err?.digest?.startsWith("NEXT_REDIRECT")) return;

      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current);
        submitTimeoutRef.current = null;
      }

      // Deployment mismatch — the server action ID the browser knows about no
      // longer exists on the current server build (happens when a new deployment
      // lands while the user has the old page open). Force a hard reload so the
      // browser fetches the latest bundle; the user can then retry immediately.
      if (err?.message?.includes("Server Action")) {
        setError("A newer version of this page is available. Reloading…");
        setTimeout(() => window.location.reload(), 1500);
        return;
      }

      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white gap-4">
        <div className="w-8 h-8 border-4 border-[color:var(--color-border-gray)] border-t-[color:var(--color-primary-green)] rounded-full animate-spin" />
        <p className="text-[color:var(--color-text-gray)] text-xs">
          Checking session…
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white min-h-screen">
      {/* Mobile logo bar */}
      <div className="lg:hidden flex items-center gap-3 px-6 pt-8 pb-6 border-b border-[color:var(--color-border-gray)]">
        <div className="w-8 h-8 rounded-lg overflow-hidden bg-[#E8F5E9] flex items-center justify-center">
          <Image
            src="/logo.png"
            alt="Atunluto Group"
            width={32}
            height={32}
            className="object-contain"
          />
        </div>
        <div>
          <div className="font-[family-name:var(--font-family-primary)] font-black text-[12px] tracking-widest text-[color:var(--color-primary-green)]">
            ATUNLUTO GROUP
          </div>
          <div className="text-[color:var(--color-text-gray)] text-[10px]">
            Election Results Portal
          </div>
        </div>
      </div>

      {/* Form area */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 sm:px-12 lg:px-14 xl:px-20 py-12">
        <div className="w-full max-w-[400px]">
          <div className="mb-9">
            <h2 className="font-[family-name:var(--font-family-primary)] text-[26px] font-extrabold text-[color:var(--color-primary-green)] mb-2 leading-tight">
              Sign in to your
              <br />
              account
            </h2>
            <p className="text-[color:var(--color-text-gray)] text-[13px]">
              Authorised personnel only — all access is logged.
            </p>
          </div>

          {from && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-5 text-[13px] text-blue-800 flex items-center gap-2.5">
              <Shield size={14} className="shrink-0" />
              Please sign in to continue to your destination.
            </div>
          )}

          {error && (
            <div
              role="alert"
              aria-live="assertive"
              className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5 text-[13px] text-red-800 flex items-start gap-2.5"
            >
              <span className="text-base shrink-0 mt-0.5">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {from && <input type="hidden" name="from" value={from} />}

            <div>
              <label
                htmlFor="email"
                className="block text-[12px] font-bold text-[color:var(--color-text-dark)] mb-2 tracking-wide uppercase"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                name="email"
                required
                autoComplete="email"
                placeholder="admin@atunluto.org"
                disabled={loading}
                className="w-full px-4 py-3.5 border-[1.5px] border-[color:var(--color-border-gray)] rounded-xl text-sm outline-none transition-all duration-200 placeholder:text-[#BDBDBD] focus:border-[color:var(--color-primary-green)] focus:ring-4 focus:ring-[color:var(--color-primary-green)]/10 bg-[#FAFAFA] focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-[12px] font-bold text-[color:var(--color-text-dark)] mb-2 tracking-wide uppercase"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  disabled={loading}
                  className="w-full pl-4 pr-12 py-3.5 border-[1.5px] border-[color:var(--color-border-gray)] rounded-xl text-sm outline-none transition-all duration-200 placeholder:text-[#BDBDBD] focus:border-[color:var(--color-primary-green)] focus:ring-4 focus:ring-[color:var(--color-primary-green)]/10 bg-[#FAFAFA] focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  disabled={loading}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute top-1/2 -translate-y-1/2 right-0 w-12 h-full flex items-center justify-center text-[#BDBDBD] hover:text-[color:var(--color-primary-green)] transition-colors duration-150 bg-transparent border-none cursor-pointer disabled:pointer-events-none"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="w-full py-4 mt-2 rounded-xl text-[14px] font-bold text-white tracking-wide transition-all duration-200 border-none disabled:bg-[color:var(--color-light-green)] disabled:cursor-not-allowed bg-[color:var(--color-primary-green)] cursor-pointer hover:bg-[color:var(--color-secondary-green)] active:scale-[0.99] shadow-lg shadow-[color:var(--color-primary-green)]/25"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2.5">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : (
                "Sign In →"
              )}
            </button>
          </form>

          <div className="mt-10 pt-6 border-t border-[#F0F0F0]">
            <p className="text-[11px] text-[#BDBDBD] leading-relaxed text-center">
              This system is for authorised Atunluto Group personnel only.
              <br />
              All login attempts are recorded and monitored.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page export — Suspense wraps the useSearchParams consumer ────────
export default function ResultsLoginPage() {
  return (
    <div className="min-h-screen flex font-[family-name:var(--font-family-secondary)]">
      {/* Left panel — static, no hooks */}
      <div className="hidden lg:flex lg:w-[58%] xl:w-[60%] relative flex-col overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=1600&q=85&fit=crop"
          alt="People casting votes at a polling station"
          fill
          className="object-cover object-center"
          priority
          sizes="60vw"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a2e0c]/95 via-[#1B5E20]/85 to-[#2E7D32]/70" />
        <div className="absolute inset-0 opacity-[0.04] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuNjUiIG51bU9jdGF2ZXM9IjMiIHN0aXRjaFRpbGVzPSJzdGl0Y2giLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsdGVyPSJ1cmwoI25vaXNlKSIgb3BhY2l0eT0iMSIvPjwvc3ZnPg==')]" />

        <div className="relative z-10 flex flex-col h-full px-12 xl:px-16 py-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shrink-0">
              <Image
                src="/logo.png"
                alt="Atunluto Group"
                width={40}
                height={40}
                className="object-contain w-full h-full"
              />
            </div>
            <div>
              <div className="text-white font-[family-name:var(--font-family-primary)] font-black text-sm tracking-[3px]">
                ATUNLUTO GROUP
              </div>
              <div className="text-white/65 text-[10px] tracking-widest uppercase">
                Oyo South Senatorial District
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center max-w-md">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full px-4 py-1.5 mb-8 w-fit">
              <div className="w-1.5 h-1.5 rounded-full bg-[color:var(--color-accent-green)] animate-pulse" />
              <span className="text-white/80 text-xs font-medium tracking-wide">
                Secure Results Portal · Active
              </span>
            </div>

            <h1 className="font-[family-name:var(--font-family-primary)] text-4xl xl:text-5xl font-black text-white leading-[1.1] mb-6">
              Transparent
              <br />
              <span className="text-[#81C784]">Democracy</span>
              <br />
              Starts Here.
            </h1>

            <p className="text-white/80 text-[15px] leading-relaxed mb-10 max-w-sm">
              The Atunluto Group&apos;s secure platform for collating and
              verifying election results across Oyo South&apos;s nine Local
              Government Areas.
            </p>

            <div className="space-y-3.5">
              {TRUST_POINTS.map((point) => (
                <div key={point} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[color:var(--color-accent-green)]/20 border border-[color:var(--color-accent-green)]/40 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={11} className="text-[#81C784]" />
                  </div>
                  <span className="text-white text-[13px]">{point}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-white/85 text-[11px]">
              © {new Date().getFullYear()} Atunluto Group · Confidential
            </p>
            <div className="flex items-center gap-1.5 text-white/85">
              <Shield size={11} />
              <span className="text-[11px]">256-bit encrypted</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — Suspense required for useSearchParams */}
      <Suspense
        fallback={
          <div className="flex-1 flex flex-col items-center justify-center bg-white gap-4">
            <div className="w-8 h-8 border-4 border-[color:var(--color-border-gray)] border-t-[color:var(--color-primary-green)] rounded-full animate-spin" />
            <p className="text-[color:var(--color-text-gray)] text-xs">
              Loading…
            </p>
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
