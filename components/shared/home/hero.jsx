"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft } from "lucide-react";

const slides = [
  {
    id: 1,
    image: "/hero1.jpg",
    title: "RESCUE NIGERIA",
    subtitle: "One Office At A Time",
    description:
      "Join the movement for cooperative politics and grassroots empowerment in Oyo South Senatorial District.",
  },
  {
    id: 2,
    image: "/hero2.jpg",
    title: "RESCUE OYO SOUTH",
    subtitle: "Through Shared Responsibility",
    description:
      "We are not waiting for change. We are funding it ourselves through our cooperative system.",
  },
  {
    id: 3,
    image: "/hero3.jpg",
    title: "RESCUE OUR FUTURE",
    subtitle: "Building A Better Tomorrow",
    description:
      "800+ change makers across 5 LGAs working together for agriculture, healthcare, education, and more.",
  },
];

export default function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-advance slides every 5 seconds
  useEffect(() => {
    if (!isAutoPlaying) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [isAutoPlaying]);

  const goToSlide = (index) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000); // Resume after 10s
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-black">
      {/* Image Slider */}
      <div className="absolute inset-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 1, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <Image
              src={slides[currentSlide].image}
              alt={slides[currentSlide].title}
              fill
              priority
              sizes="100vw"
              className="object-cover object-center"
              quality={90}
            />

            {/* Dark overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-5xl text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="space-y-6"
            >
              {/* Title */}
              <h1 className="font-montserrat text-5xl font-extrabold leading-tight text-white sm:text-6xl md:text-7xl lg:text-8xl">
                {slides[currentSlide].title}
              </h1>

              {/* Subtitle */}
              <h2 className="font-montserrat text-2xl font-bold text-[#d4af37] sm:text-3xl md:text-4xl lg:text-5xl">
                {slides[currentSlide].subtitle}
              </h2>

              {/* Description */}
              <p className="mx-auto max-w-2xl font-poppins text-base leading-relaxed text-gray-200 sm:text-lg md:text-xl lg:text-2xl">
                {slides[currentSlide].description}
              </p>

              {/* CTA Buttons */}
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row md:mt-20">
                <Link href="/join" className="w-full sm:w-auto">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full rounded-full bg-gradient-to-r from-[#d4af37] to-[#f0c85a] px-8 py-4 font-poppins text-base font-bold text-black shadow-2xl transition-all duration-300 hover:shadow-[0_0_30px_rgba(212,175,55,0.5)] sm:w-auto md:px-10 md:py-5 md:text-lg"
                  >
                    <span className="flex items-center justify-center gap-2">
                      Join the Movement
                      <ChevronRight className="h-5 w-5" />
                    </span>
                  </motion.button>
                </Link>

                <Link href="/manifesto" className="w-full sm:w-auto">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full rounded-full border-2 border-white bg-transparent px-8 py-4 font-poppins text-base font-bold text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/10 sm:w-auto md:border-4 md:px-10 md:py-5 md:text-lg"
                  >
                    <span className="flex items-center justify-center gap-2">
                      Read Our Manifesto
                      <ChevronRight className="h-5 w-5" />
                    </span>
                  </motion.button>
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation Arrows */}
      <div className="hidden md:block">
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/10 p-3 backdrop-blur-md transition-all hover:bg-white/20 md:left-8 md:p-4"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-6 w-6 text-white md:h-8 md:w-8" />
        </button>

        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/10 p-3 backdrop-blur-md transition-all hover:bg-white/20 md:right-8 md:p-4"
          aria-label="Next slide"
        >
          <ChevronRight className="h-6 w-6 text-white md:h-8 md:w-8" />
        </button>
      </div>
      {/* Slide Indicators */}
      <div className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 gap-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-2 rounded-full transition-all duration-300 ${
              currentSlide === index
                ? "w-8 bg-[#d4af37]"
                : "w-2 bg-white/50 hover:bg-white/75"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Stats Bar */}
      {/* <div className="absolute bottom-20 left-1/2 z-20 hidden w-full max-w-4xl -translate-x-1/2 md:block">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="flex items-center justify-around rounded-2xl border border-white/10 bg-white/5 px-8 py-4 backdrop-blur-md"
        >
          <div className="text-center">
            <div className="font-montserrat text-3xl font-bold text-white">
              800+
            </div>
            <div className="font-poppins text-sm text-gray-300">
              Change Makers
            </div>
          </div>
          <div className="h-12 w-px bg-white/20" />
          <div className="text-center">
            <div className="font-montserrat text-3xl font-bold text-white">
              5 LGAs
            </div>
            <div className="font-poppins text-sm text-gray-300">
              Active Presence
            </div>
          </div>
          <div className="h-12 w-px bg-white/20" />
          <div className="text-center">
            <div className="font-montserrat text-3xl font-bold text-white">
              Mar 2024
            </div>
            <div className="font-poppins text-sm text-gray-300">Founded</div>
          </div>
        </motion.div>
      </div> */}

      {/* Bottom fade to white */}
      {/* <div className="absolute inset-x-0 bottom-0 z-10 h-32 bg-gradient-to-t from-white to-transparent" /> */}
    </section>
  );
}
