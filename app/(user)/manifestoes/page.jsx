"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSection } from "@/hooks/use-site-content";

export default function ManifestosPage() {
  const hero = useSection("manifestoes.hero");
  const cta = useSection("manifestoes.cta");
  const slides = hero.slides || [];
  const stats = hero.stats || [];
  const manifestos = useSection("manifestoes.items").items || [];

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      {/* Hero Section */}
      <section
        className="relative pt-24 pb-16 md:pt-32 md:pb-24"
        style={{ backgroundColor: "#1b5e20" }}
      >
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
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
                  {hero.badge}
                </span>
              </div>

              <h1
                className="font-montserrat text-4xl font-bold md:text-5xl lg:text-6xl"
                style={{ color: "#ffffff" }}
              >
                {hero.heading}
              </h1>

              <p
                className="mt-6 font-poppins text-lg leading-relaxed md:text-xl"
                style={{ color: "rgba(255, 255, 255, 0.9)" }}
              >
                {hero.intro}
              </p>

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

              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <Link href={hero.ctaPrimary.href}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    className="w-full sm:w-auto px-8 py-4 rounded-lg font-poppins font-semibold"
                    style={{ backgroundColor: "#ffffff", color: "#1b5e20" }}
                  >
                    {hero.ctaPrimary.label}
                  </motion.button>
                </Link>
                <Link href={hero.ctaSecondary.href}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    className="w-full sm:w-auto px-8 py-4 rounded-lg border-2 font-poppins font-semibold"
                    style={{
                      borderColor: "rgba(255, 255, 255, 0.3)",
                      color: "#ffffff",
                      backgroundColor: "transparent",
                    }}
                  >
                    {hero.ctaSecondary.label}
                  </motion.button>
                </Link>
              </div>
            </motion.div>

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
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent" />
                  </motion.div>
                </AnimatePresence>
              </div>

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
                  />
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="absolute -bottom-6 -right-6 rounded-xl p-6 shadow-lg"
                style={{ backgroundColor: "#2e7d32", color: "#ffffff" }}
              >
                <div className="font-montserrat text-2xl font-bold">
                  {hero.badgeCardValue}
                </div>
                <div className="mt-1 font-poppins text-sm">
                  {hero.badgeCardLabel}
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Manifestos Details */}
      <section
        className="py-20 md:py-32"
        style={{ backgroundColor: "#ffffff" }}
      >
        <div className="mx-auto max-w-6xl px-6 sm:px-8 lg:px-12">
          <div className="space-y-20">
            {manifestos.map((manifesto, index) => (
              <motion.div
                key={index}
                id={manifesto.title.toLowerCase()}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="relative"
              >
                {/* Number */}
                <div className="flex items-start gap-8">
                  <div className="flex-shrink-0">
                    <div
                      className="font-montserrat text-6xl font-bold leading-none"
                      style={{ color: manifesto.color, opacity: 0.2 }}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="mb-6">
                      <h2
                        className="font-montserrat text-3xl font-bold mb-2"
                        style={{ color: manifesto.color }}
                      >
                        {manifesto.title}
                      </h2>
                      <p
                        className="font-poppins text-lg font-semibold"
                        style={{ color: "#757575" }}
                      >
                        {manifesto.subtitle}
                      </p>
                    </div>

                    <div
                      className="pl-6 mb-6"
                      style={{ borderLeft: `4px solid ${manifesto.color}` }}
                    >
                      <p
                        className="font-poppins text-base leading-relaxed mb-4"
                        style={{ color: "#424242" }}
                      >
                        {manifesto.description}
                      </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div
                        className="p-4 rounded-lg"
                        style={{ backgroundColor: "#fafafa" }}
                      >
                        <p
                          className="font-poppins text-sm font-semibold mb-2"
                          style={{ color: "#757575" }}
                        >
                          TARGET
                        </p>
                        <p
                          className="font-poppins text-base"
                          style={{ color: "#212121" }}
                        >
                          {manifesto.target}
                        </p>
                      </div>
                      <div
                        className="p-4 rounded-lg"
                        style={{ backgroundColor: "#fafafa" }}
                      >
                        <p
                          className="font-poppins text-sm font-semibold mb-2"
                          style={{ color: "#757575" }}
                        >
                          TIMELINE / SCOPE
                        </p>
                        <p
                          className="font-poppins text-base"
                          style={{ color: "#212121" }}
                        >
                          {manifesto.timeline}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                {index < manifestos.length - 1 && (
                  <div
                    className="mt-16 h-px"
                    style={{ backgroundColor: "#e0e0e0" }}
                  />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        className="py-20 md:py-32"
        style={{ backgroundColor: "#1b5e20" }}
      >
        <div className="mx-auto max-w-4xl px-6 sm:px-8 lg:px-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2
              className="font-montserrat text-3xl font-bold mb-6 md:text-4xl"
              style={{ color: "#ffffff" }}
            >
              {cta.heading}
            </h2>
            <p
              className="font-poppins text-xl mb-8"
              style={{ color: "rgba(255, 255, 255, 0.9)" }}
            >
              {cta.intro}
            </p>
            <Link href="/join-us">
              <motion.button
                whileHover={{ scale: 1.05 }}
                className="px-12 py-4 rounded-lg font-poppins font-semibold"
                style={{ backgroundColor: "#ffffff", color: "#1b5e20" }}
              >
                {cta.ctaLabel}
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>
    </>
  );
}
