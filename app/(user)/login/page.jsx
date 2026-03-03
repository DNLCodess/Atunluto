"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/supabase/client";

// Role → destination map
// state_admin goes to /dashboard (sees all LGAs)
// all other roles also go to /dashboard — the dashboard itself gates content by role
const ROLE_REDIRECT = {
  state_admin: "/dashboard",
  super_user: "/dashboard",
  administrator: "/dashboard",
  registration: "/dashboard/add-member",
  manager: "/dashboard/gallery",
};

const DEFAULT_REDIRECT = "/dashboard";

function getRoleRedirect(role) {
  return ROLE_REDIRECT[role] ?? DEFAULT_REDIRECT;
}

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, isLoggingIn, loginError, isAuthenticated, isLoading } =
    useAuth();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  // Redirect already-authenticated users — fetch their role to pick the right path
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      redirectByRole();
    }
  }, [isLoading, isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  async function redirectByRole() {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }

      const { data } = await supabase
        .from("admins")
        .select("role, is_active")
        .eq("id", user.id)
        .single();

      if (!data || !data.is_active) {
        // Account deactivated — sign out and stay on login
        await supabase.auth.signOut();
        setErrors({
          _form:
            "Your account has been deactivated. Contact your administrator.",
        });
        return;
      }

      router.replace(getRoleRedirect(data.role));
    } catch {
      router.replace(DEFAULT_REDIRECT);
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "", _form: "" }));
  };

  const validate = () => {
    const e = {};
    if (!formData.email.trim()) {
      e.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      e.email = "Invalid email format";
    }
    if (!formData.password) {
      e.password = "Password is required";
    } else if (formData.password.length < 6) {
      e.password = "Password must be at least 6 characters";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    login(formData, {
      onSuccess: async () => {
        setIsNavigating(true);
        try {
          const supabase = createClient();
          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (!user) {
            router.replace("/login");
            return;
          }

          const { data } = await supabase
            .from("admins")
            .select("role, is_active")
            .eq("id", user.id)
            .single();

          if (!data || !data.is_active) {
            await supabase.auth.signOut();
            setIsNavigating(false);
            setErrors({
              _form:
                "Your account has been deactivated. Contact your administrator.",
            });
            return;
          }

          // Small delay so the "Loading dashboard…" screen renders smoothly
          setTimeout(() => router.replace(getRoleRedirect(data.role)), 250);
        } catch {
          setTimeout(() => router.replace(DEFAULT_REDIRECT), 250);
        }
      },
    });
  };

  // Spinner shown during initial auth check
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-off-white">
        <Spinner className="h-8 w-8 text-primary-green" />
      </div>
    );
  }

  const isBusy = isLoggingIn || isNavigating;
  const serverError =
    errors._form || (loginError && !isBusy ? loginError : null);

  return (
    <AnimatePresence mode="wait">
      {!isNavigating ? (
        <motion.div
          key="login"
          className="min-h-screen flex"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.3 }}
        >
          {/* ── Left — Form (40%) ── */}
          <div className="w-full lg:w-2/5 flex items-center justify-center p-8 lg:p-12 bg-off-white">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-md"
            >
              <div className="mb-12 pt-10">
                <h1 className="font-primary text-3xl font-bold mb-2 text-text-dark">
                  Administrator Login
                </h1>
                <p className="font-secondary text-base text-text-gray">
                  Atunluto Group Management Portal
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                {/* Email */}
                <Field
                  label="Email Address"
                  htmlFor="email"
                  error={errors.email}
                >
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    autoComplete="email"
                    disabled={isBusy}
                    placeholder="Enter your email address"
                    className={`w-full px-4 py-3.5 rounded-xl border-2 font-secondary text-base transition-all focus:outline-none focus:border-primary-green disabled:opacity-60 bg-white text-text-dark placeholder-text-light ${
                      errors.email ? "border-red-500" : "border-border-gray"
                    }`}
                  />
                </Field>

                {/* Password */}
                <Field
                  label="Password"
                  htmlFor="password"
                  error={errors.password}
                >
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      autoComplete="current-password"
                      disabled={isBusy}
                      placeholder="Enter your password"
                      className={`w-full px-4 py-3.5 pr-12 rounded-xl border-2 font-secondary text-base transition-all focus:outline-none focus:border-primary-green disabled:opacity-60 bg-white text-text-dark placeholder-text-light ${
                        errors.password
                          ? "border-red-500"
                          : "border-border-gray"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      disabled={isBusy}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-text-gray focus:outline-none"
                    >
                      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                </Field>

                {/* Server / account error */}
                <AnimatePresence>
                  {serverError && (
                    <motion.div
                      key="server-error"
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="p-4 rounded-xl flex items-start gap-3 bg-red-50 border border-red-300"
                      role="alert"
                    >
                      <AlertIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="font-secondary text-sm text-red-700">
                        {serverError}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit */}
                <motion.button
                  type="submit"
                  disabled={isBusy}
                  whileHover={{ scale: isBusy ? 1 : 1.02 }}
                  whileTap={{ scale: isBusy ? 1 : 0.98 }}
                  className="w-full px-6 py-4 rounded-xl font-secondary font-semibold text-base text-white transition-all disabled:cursor-not-allowed shadow-lg bg-primary-green hover:bg-secondary-green disabled:bg-text-gray disabled:opacity-85"
                >
                  {isBusy ? (
                    <span className="flex items-center justify-center gap-2">
                      <Spinner className="h-5 w-5 text-white" />
                      {isNavigating ? "Loading dashboard…" : "Signing in…"}
                    </span>
                  ) : (
                    "Sign In"
                  )}
                </motion.button>
              </form>

              <div className="mt-8 pt-6 border-t border-border-gray">
                <p className="font-secondary text-xs text-center text-text-gray">
                  🔒 Secure administrator access only. Unauthorised access
                  attempts are logged.
                </p>
              </div>
            </motion.div>
          </div>

          {/* ── Right — Branding (60%) ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="hidden lg:flex lg:w-3/5 relative overflow-hidden bg-primary-green"
          >
            <div className="absolute inset-0">
              <Image
                src="/hero2.jpg"
                alt="Atunluto Group"
                fill
                className="object-cover"
                quality={90}
                priority
              />
              <div className="absolute inset-0 bg-primary-green/85" />
            </div>

            <div className="relative z-10 flex flex-col justify-between p-12 lg:p-16">
              {/* Logo */}
              <div className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center bg-white/20">
                    <Image
                      src="/logo.png"
                      alt="Atunluto Logo"
                      width={48}
                      height={48}
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <p className="font-primary text-xl font-bold text-white">
                      Atunluto Group
                    </p>
                    <p className="font-secondary text-sm text-white/80">
                      Admin Portal
                    </p>
                  </div>
                </div>
              </div>

              {/* Copy */}
              <div>
                <motion.h2
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="font-primary text-4xl lg:text-5xl font-bold mb-6 leading-tight text-white"
                >
                  Transforming Oyo South Through Cooperative Politics
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                  className="font-secondary text-lg leading-relaxed max-w-xl text-white/90"
                >
                  Manage member registrations, oversee development initiatives,
                  and ensure accountability across all 9 LGAs in Oyo South
                  Senatorial District.
                </motion.p>
              </div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.7 }}
                className="grid grid-cols-3 gap-8"
              >
                {[
                  { value: "800+", label: "Members" },
                  { value: "9", label: "LGAs" },
                  { value: "2027", label: "Target Year" },
                ].map((stat, i) => (
                  <div key={i} className="border-l-4 border-accent-green pl-4">
                    <div className="font-primary text-3xl font-bold mb-1 text-accent-green">
                      {stat.value}
                    </div>
                    <div className="font-secondary text-sm text-white/80">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Decorative blobs */}
            <div className="absolute top-20 right-20 w-64 h-64 rounded-full opacity-10 bg-accent-green blur-3xl" />
            <div className="absolute bottom-20 left-20 w-96 h-96 rounded-full opacity-10 bg-secondary-green blur-3xl" />
          </motion.div>
        </motion.div>
      ) : (
        // Loading dashboard screen
        <motion.div
          key="navigating"
          className="min-h-screen flex items-center justify-center flex-col gap-4 bg-off-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="w-16 h-16 rounded-2xl overflow-hidden mb-2">
            <Image
              src="/logo.png"
              alt="Atunluto"
              width={64}
              height={64}
              className="object-contain"
            />
          </div>
          <Spinner className="h-8 w-8 text-primary-green" />
          <p className="font-secondary text-sm text-text-gray">
            Loading dashboard…
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Small reusable pieces ────────────────────────────────────────────────────

function Field({ label, htmlFor, error, children }) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="block font-secondary text-sm font-semibold mb-2 text-text-dark"
      >
        {label}
      </label>
      {children}
      <AnimatePresence>
        {error && (
          <motion.p
            key={htmlFor + "-error"}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="mt-2 font-secondary text-xs text-red-600"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function Spinner({ className = "" }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
      />
    </svg>
  );
}

function AlertIcon({ className = "" }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}
