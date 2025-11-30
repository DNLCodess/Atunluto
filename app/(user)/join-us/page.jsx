"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import Image from "next/image";
import MemberRegistrationForm from "@/components/common/reg-form";

const slides = [
  {
    image: "/hero1.jpg",
    title: "Join 800+ Members",
    subtitle: "Building a better Oyo South together",
  },
  {
    image: "/hero2.jpg",
    title: "Cooperative Politics",
    subtitle: "Own the structure, demand accountability",
  },
  {
    image: "/hero3.jpg",
    title: "Development Focus",
    subtitle: "Real change through collective action",
  },
  {
    image: "/hero2.jpg",
    title: "No Membership Fee",
    subtitle: "Free to join, powered by our contributions",
  },
];

export default function RegisterPage() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleSuccess = (data) => {
    console.log("New member registered:", data);
    // Optional: Add analytics tracking, redirect, etc.
  };

  const handleError = (error) => {
    console.error("Registration failed:", error);
    // Optional: Send error to logging service
  };

  return (
    <div className="min-h-screen pt-20" style={{ backgroundColor: "#fafafa" }}>
      <div className="mx-auto max-w-7xl px-6 py-12 sm:px-8 lg:px-12">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <h1
            className="font-montserrat text-4xl font-bold mb-3 md:text-5xl"
            style={{ color: "#1b5e20" }}
          >
            Join Atunluto Group
          </h1>
          <p className="font-poppins text-lg" style={{ color: "#757575" }}>
            Register to become part of the cooperative politics movement
          </p>
        </motion.div>

        {/* Main Grid - Form + Slider */}
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Left Side - Image Slider (40%) */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-2 order-2 lg:order-1"
          >
            <div className="sticky top-24">
              {/* Image Slider */}
              <div
                className="relative rounded-2xl overflow-hidden shadow-xl"
                style={{ height: "600px" }}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentSlide}
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.8 }}
                    className="absolute inset-0"
                  >
                    <Image
                      src={slides[currentSlide].image}
                      alt={slides[currentSlide].title}
                      fill
                      className="object-cover"
                      priority={currentSlide === 0}
                    />
                    {/* Gradient Overlay */}
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          "linear-gradient(to top, rgba(27, 94, 32, 0.9) 0%, rgba(27, 94, 32, 0.4) 50%, transparent 100%)",
                      }}
                    />

                    {/* Text Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-8">
                      <motion.h3
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="font-montserrat text-2xl font-bold mb-2"
                        style={{ color: "#ffffff" }}
                      >
                        {slides[currentSlide].title}
                      </motion.h3>
                      <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="font-poppins text-base"
                        style={{ color: "rgba(255, 255, 255, 0.9)" }}
                      >
                        {slides[currentSlide].subtitle}
                      </motion.p>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Progress Indicators */}
                <div className="absolute bottom-4 right-4 flex gap-2">
                  {slides.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className="transition-all rounded-full"
                      style={{
                        width: currentSlide === index ? "40px" : "10px",
                        height: "10px",
                        backgroundColor:
                          currentSlide === index
                            ? "#4caf50"
                            : "rgba(255, 255, 255, 0.5)",
                      }}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              </div>

              {/* Stats Below Slider */}
              <div className="mt-6 grid grid-cols-3 gap-4">
                {[
                  { value: "800+", label: "Members" },
                  { value: "5 LGAs", label: "Active" },
                  { value: "Free", label: "No Fee" },
                ].map((stat, index) => (
                  <div
                    key={index}
                    className="text-center p-4 rounded-xl"
                    style={{ backgroundColor: "#ffffff" }}
                  >
                    <div
                      className="font-montserrat text-2xl font-bold"
                      style={{ color: "#1b5e20" }}
                    >
                      {stat.value}
                    </div>
                    <div
                      className="font-poppins text-xs mt-1"
                      style={{ color: "#757575" }}
                    >
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right Side - Registration Form (60%) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-3 order-1 lg:order-2"
          >
            <div
              className="rounded-2xl p-8 md:p-10 shadow-lg"
              style={{ backgroundColor: "#ffffff" }}
            >
              {/* Reusable Form Component */}
              <MemberRegistrationForm
                onSuccess={handleSuccess}
                onError={handleError}
                showHeader={true}
                submitButtonText="Complete Registration"
              />

              {/* Privacy Note */}
              <div
                className="mt-8 pt-6"
                style={{ borderTop: "1px solid #e0e0e0" }}
              >
                <p
                  className="font-poppins text-xs text-center"
                  style={{ color: "#757575" }}
                >
                  🔒 Your information is secure and will only be used for
                  membership management. We respect your privacy and follow data
                  protection guidelines.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
