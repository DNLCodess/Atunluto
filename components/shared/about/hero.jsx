"use client";
import Image from "next/image";
import { motion } from "framer-motion";

export default function PageHero({
  title,
  description,
  imageSrc,
  imageAlt,
  stats = [],
  badge = null,
  darkMode = true, // Use dark green background by default
}) {
  return (
    <section
      className={`relative pt-24 pb-16 md:pt-32 md:pb-24 ${
        darkMode ? "bg-primary" : "bg-white"
      }`}
    >
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Left - Text Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1
              className={`font-montserrat text-4xl font-bold md:text-5xl lg:text-6xl ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              {title}
            </h1>

            <p
              className={`mt-6 font-poppins text-lg leading-relaxed md:text-xl ${
                darkMode ? "text-white/90" : "text-gray-700"
              }`}
            >
              {description}
            </p>

            {/* Optional Stats */}
            {stats.length > 0 && (
              <div className="mt-10 grid grid-cols-3 gap-6">
                {stats.map((stat, index) => (
                  <div key={index} className="border-l-4 border-accent pl-4">
                    <div
                      className={`font-montserrat text-3xl font-bold ${
                        darkMode ? "text-accent" : "text-primary"
                      }`}
                    >
                      {stat.value}
                    </div>
                    <div
                      className={`mt-1 font-poppins text-sm ${
                        darkMode ? "text-white/80" : "text-gray-600"
                      }`}
                    >
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Right - Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg shadow-2xl">
              <Image
                src={imageSrc}
                alt={imageAlt}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            </div>

            {/* Optional Badge */}
            {badge && (
              <div className="absolute -bottom-6 -right-6 rounded-lg bg-secondary p-6 text-white shadow-lg">
                <div className="font-montserrat text-2xl font-bold">
                  {badge.value}
                </div>
                <div className="mt-1 font-poppins text-sm">{badge.label}</div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
