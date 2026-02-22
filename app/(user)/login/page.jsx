"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, isLoggingIn, loginError, isAuthenticated, isLoading } =
    useAuth();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  // If already authenticated on mount, redirect immediately without flash
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isLoading, isAuthenticated, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    login(formData, {
      onSuccess: () => {
        // Show a smooth "signing in" transition before navigation
        setIsNavigating(true);
        // Small delay lets the success state render, then navigate
        setTimeout(() => router.replace("/dashboard"), 300);
      },
    });
  };

  // Show nothing while checking auth on initial load (prevents flash of login form)
  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#fafafa" }}
      >
        <svg
          className="animate-spin h-8 w-8"
          viewBox="0 0 24 24"
          style={{ color: "#1b5e20" }}
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
    );
  }

  const isBusy = isLoggingIn || isNavigating;

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
          {/* Left Side — Login Form (40%) */}
          <div
            className="w-full lg:w-2/5 flex items-center justify-center p-8 lg:p-12"
            style={{ backgroundColor: "#fafafa" }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-md"
            >
              {/* Header */}
              <div className="mb-12 pt-10">
                <h1 className="font-montserrat text-3xl font-bold mb-2 text-text-dark">
                  Administrator Login
                </h1>
                <p className="font-poppins text-base text-text-gray">
                  Atunluto Group Management Portal
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block font-poppins text-sm font-semibold mb-2"
                    style={{ color: "#212121" }}
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    autoComplete="email"
                    disabled={isBusy}
                    className="w-full px-4 py-3.5 rounded-xl border-2 font-poppins text-base transition-all focus:outline-none disabled:opacity-60"
                    style={{
                      borderColor: errors.email ? "#e53935" : "#e0e0e0",
                      color: "#212121",
                      backgroundColor: "#ffffff",
                    }}
                    onFocus={(e) => {
                      if (!errors.email) e.target.style.borderColor = "#1b5e20";
                    }}
                    onBlur={(e) => {
                      if (!errors.email) e.target.style.borderColor = "#e0e0e0";
                    }}
                    placeholder="Enter your email address"
                  />
                  <AnimatePresence>
                    {errors.email && (
                      <motion.p
                        key="email-error"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="mt-2 font-poppins text-xs"
                        style={{ color: "#e53935" }}
                      >
                        {errors.email}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="block font-poppins text-sm font-semibold mb-2"
                    style={{ color: "#212121" }}
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      autoComplete="current-password"
                      disabled={isBusy}
                      className="w-full px-4 py-3.5 rounded-xl border-2 font-poppins text-base transition-all focus:outline-none pr-12 disabled:opacity-60"
                      style={{
                        borderColor: errors.password ? "#e53935" : "#e0e0e0",
                        color: "#212121",
                        backgroundColor: "#ffffff",
                      }}
                      onFocus={(e) => {
                        if (!errors.password)
                          e.target.style.borderColor = "#1b5e20";
                      }}
                      onBlur={(e) => {
                        if (!errors.password)
                          e.target.style.borderColor = "#e0e0e0";
                      }}
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      disabled={isBusy}
                      className="absolute right-4 top-1/2 -translate-y-1/2 focus:outline-none"
                      style={{ color: "#757575" }}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
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
                      ) : (
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
                      )}
                    </button>
                  </div>
                  <AnimatePresence>
                    {errors.password && (
                      <motion.p
                        key="pw-error"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="mt-2 font-poppins text-xs"
                        style={{ color: "#e53935" }}
                      >
                        {errors.password}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Server / Login Error */}
                <AnimatePresence>
                  {loginError && !isBusy && (
                    <motion.div
                      key="login-error"
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="p-4 rounded-xl flex items-start gap-3"
                      style={{
                        backgroundColor: "#FFEBEE",
                        border: "1px solid #e53935",
                      }}
                      role="alert"
                    >
                      <svg
                        className="w-5 h-5 flex-shrink-0 mt-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="#e53935"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <p
                        className="font-poppins text-sm"
                        style={{ color: "#c62828" }}
                      >
                        {loginError}
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
                  className="w-full px-6 py-4 rounded-xl font-poppins font-semibold text-base transition-all disabled:cursor-not-allowed shadow-lg"
                  style={{
                    backgroundColor: isBusy ? "#9e9e9e" : "#1b5e20",
                    color: "#ffffff",
                    opacity: isBusy ? 0.85 : 1,
                  }}
                >
                  {isNavigating ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Redirecting...
                    </span>
                  ) : isLoggingIn ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Signing in...
                    </span>
                  ) : (
                    "Sign In"
                  )}
                </motion.button>
              </form>

              {/* Footer */}
              <div
                className="mt-8 pt-6"
                style={{ borderTop: "1px solid #e0e0e0" }}
              >
                <p
                  className="font-poppins text-xs text-center"
                  style={{ color: "#757575" }}
                >
                  🔒 Secure administrator access only. Unauthorised access
                  attempts are logged.
                </p>
              </div>
            </motion.div>
          </div>

          {/* Right Side — Branding (60%) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="hidden lg:flex lg:w-3/5 relative overflow-hidden"
            style={{ backgroundColor: "#1b5e20" }}
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
              <div
                className="absolute inset-0"
                style={{ backgroundColor: "rgba(27, 94, 32, 0.85)" }}
              />
            </div>

            <div className="relative z-10 flex flex-col justify-between p-12 lg:p-16">
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
                    <p className="font-montserrat text-xl font-bold text-white">
                      Atunluto Group
                    </p>
                    <p className="font-poppins text-sm text-white/80">
                      Admin Portal
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <motion.h2
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="font-montserrat text-4xl lg:text-5xl font-bold mb-6 leading-tight text-white"
                >
                  Transforming Oyo South Through Cooperative Politics
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                  className="font-poppins text-lg leading-relaxed max-w-xl"
                  style={{ color: "rgba(255,255,255,0.9)" }}
                >
                  Manage member registrations, oversee development initiatives,
                  and ensure accountability across all 9 LGAs in Oyo South
                  Senatorial District.
                </motion.p>
              </div>

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
                  <div
                    key={i}
                    className="border-l-4 pl-4"
                    style={{ borderColor: "#4caf50" }}
                  >
                    <div
                      className="font-montserrat text-3xl font-bold mb-1"
                      style={{ color: "#4caf50" }}
                    >
                      {stat.value}
                    </div>
                    <div
                      className="font-poppins text-sm"
                      style={{ color: "rgba(255,255,255,0.8)" }}
                    >
                      {stat.label}
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>

            <div
              className="absolute top-20 right-20 w-64 h-64 rounded-full opacity-10"
              style={{ backgroundColor: "#4caf50", filter: "blur(80px)" }}
            />
            <div
              className="absolute bottom-20 left-20 w-96 h-96 rounded-full opacity-10"
              style={{ backgroundColor: "#2e7d32", filter: "blur(100px)" }}
            />
          </motion.div>
        </motion.div>
      ) : (
        // Smooth transition overlay while navigating to dashboard
        <motion.div
          key="navigating"
          className="min-h-screen flex items-center justify-center flex-col gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ backgroundColor: "#fafafa" }}
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
          <svg
            className="animate-spin h-8 w-8"
            viewBox="0 0 24 24"
            style={{ color: "#1b5e20" }}
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <p className="font-poppins text-sm" style={{ color: "#757575" }}>
            Loading dashboard...
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
