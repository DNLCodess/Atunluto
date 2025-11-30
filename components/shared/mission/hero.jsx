"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

const slides = [
  {
    image: "/hero1.jpg",
    alt: "Community gathering and empowerment",
  },
  {
    image: "/hero2.jpg",
    alt: "Agricultural development initiatives",
  },
  {
    image: "/hero3.jpg",
    alt: "Healthcare support programs",
  },
];

const stats = [
  { value: "2027", label: "Target Year" },
  { value: "9 LGAs", label: "Full Coverage" },
  { value: "6", label: "Key Priorities" },
];

export default function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-advance slides
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  return (
    <section
      className="relative pt-24 pb-16 md:pt-32 md:pb-24"
      style={{ backgroundColor: "#1b5e20" }}
    >
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Left - Text Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
              style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: "#4caf50" }}
              />
              <span
                className="font-poppins text-sm font-medium"
                style={{ color: "#ffffff" }}
              >
                Our Purpose & Direction
              </span>
            </div>

            <h1
              className="font-montserrat text-4xl font-bold md:text-5xl lg:text-6xl"
              style={{ color: "#ffffff" }}
            >
              Mission & Vision
            </h1>

            <p
              className="mt-6 font-poppins text-lg leading-relaxed md:text-xl"
              style={{ color: "rgba(255, 255, 255, 0.9)" }}
            >
              Our commitment to transforming Oyo South through cooperative
              politics and grassroots empowerment—guided by a clear purpose and
              bold vision for the future.
            </p>

            {/* Stats */}
            <div className="mt-10 grid grid-cols-3 gap-6">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                  className="pl-4"
                  style={{ borderLeft: "4px solid #4caf50" }}
                >
                  <div
                    className="font-montserrat text-3xl font-bold"
                    style={{ color: "#4caf50" }}
                  >
                    {stat.value}
                  </div>
                  <div
                    className="mt-1 font-poppins text-sm"
                    style={{ color: "rgba(255, 255, 255, 0.8)" }}
                  >
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link href="#mission">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto px-8 py-4 rounded-lg font-poppins font-semibold transition-all"
                  style={{ backgroundColor: "#ffffff", color: "#1b5e20" }}
                >
                  Read Our Mission
                </motion.button>
              </Link>
              <Link href="#vision">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto px-8 py-4 rounded-lg border-2 font-poppins font-semibold transition-all"
                  style={{
                    borderColor: "rgba(255, 255, 255, 0.3)",
                    color: "#ffffff",
                    backgroundColor: "transparent",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "rgba(255, 255, 255, 0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  See Our Vision
                </motion.button>
              </Link>
            </div>
          </motion.div>

          {/* Right - Image Slider */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-2xl">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1 }}
                  className="absolute inset-0"
                >
                  <Image
                    src={slides[currentSlide].image}
                    alt={slides[currentSlide].alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority={currentSlide === 0}
                  />
                  {/* Subtle gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Slide Indicators */}
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className="transition-all rounded-full"
                  style={{
                    width: currentSlide === index ? "32px" : "8px",
                    height: "8px",
                    backgroundColor:
                      currentSlide === index
                        ? "#4caf50"
                        : "rgba(255, 255, 255, 0.5)",
                  }}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>

            {/* Founded Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="absolute -bottom-6 -right-6 rounded-xl p-6 shadow-lg"
              style={{ backgroundColor: "#2e7d32", color: "#ffffff" }}
            >
              <div className="font-montserrat text-2xl font-bold">
                March 2024
              </div>
              <div className="mt-1 font-poppins text-sm">Est. by OTO</div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
