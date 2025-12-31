"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

const slides = [
  { image: "/about1.jpg", alt: "Atunluto Group community meeting" },
  { image: "/about2.jpg", alt: "Members collaboration" },
  { image: "/about3.jpg", alt: "Grassroots empowerment" },
  { image: "/about4.jpg", alt: "Community development" },
];

const stats = [
  { value: "Mar 2024", label: "Founded" },
  { value: "5 LGAs", label: "Initial Reach" },
  { value: "800+", label: "Members" },
];

const coreValues = [
  {
    title: "Shared Responsibility",
    description:
      "Members fund the movement through contributions, not handouts from politicians",
  },
  {
    title: "Accountability",
    description:
      "We sponsor candidates and can impeach them if they fail to deliver",
  },
  {
    title: "Development Over Handouts",
    description: "Focus on infrastructure and systems, not temporary relief",
  },
  {
    title: "Cooperative Model",
    description: "Replicating the successful thrift system in politics",
  },
];

export default function AboutPage() {
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
            {/* Left - Text Content */}
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
                  Who We Are
                </span>
              </div>

              <h1
                className="font-montserrat text-4xl font-bold md:text-5xl lg:text-6xl"
                style={{ color: "#ffffff" }}
              >
                About Atunluto Group
              </h1>

              <p
                className="mt-6 font-poppins text-lg leading-relaxed md:text-xl"
                style={{ color: "rgba(255, 255, 255, 0.9)" }}
              >
                A political association of change makers committed to
                transforming Oyo South through cooperative politics—where
                members own the structure, sponsor candidates, and demand
                accountability.
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

              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <Link href="/join">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    className="w-full sm:w-auto px-8 py-4 rounded-lg font-poppins font-semibold"
                    style={{ backgroundColor: "#ffffff", color: "#1b5e20" }}
                  >
                    Join Us Today
                  </motion.button>
                </Link>
                <Link href="/mission-vision">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    className="w-full sm:w-auto px-8 py-4 rounded-lg border-2 font-poppins font-semibold"
                    style={{
                      borderColor: "rgba(255, 255, 255, 0.3)",
                      color: "#ffffff",
                      backgroundColor: "transparent",
                    }}
                  >
                    Our Mission & Vision
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
                <div className="font-montserrat text-2xl font-bold">OTO</div>
                <div className="mt-1 font-poppins text-sm">Founder</div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* The Problem Section */}
      <section
        className="py-20 md:py-32"
        style={{ backgroundColor: "#ffffff" }}
      >
        <div className="mx-auto max-w-6xl px-6 sm:px-8 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-16"
          >
            <h2
              className="font-montserrat text-3xl font-bold mb-6 md:text-4xl"
              style={{ color: "#1b5e20" }}
            >
              Why Atunluto Exists
            </h2>
            <div
              className="h-1 w-20 rounded-full mb-8"
              style={{ backgroundColor: "#4caf50" }}
            />
          </motion.div>

          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="pl-6"
              style={{ borderLeft: "3px solid #e0e0e0" }}
            >
              <h3
                className="font-montserrat text-xl font-bold mb-3"
                style={{ color: "#212121" }}
              >
                The Current System Breeds Poverty by Design
              </h3>
              <p
                className="font-poppins text-base leading-relaxed"
                style={{ color: "#757575" }}
              >
                Money politics makes politicians spend their last kobo to get
                into office, forcing them to steal once elected. Campaign
                handouts that could repair health centers or fix roads are
                consumed instead of invested in development.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="pl-6"
              style={{ borderLeft: "3px solid #e0e0e0" }}
            >
              <h3
                className="font-montserrat text-xl font-bold mb-3"
                style={{ color: "#212121" }}
              >
                No Accountability Structure
              </h3>
              <p
                className="font-poppins text-base leading-relaxed"
                style={{ color: "#757575" }}
              >
                Politicians are not caucused, making impeachment impossible.
                They answer to individual sponsors rather than the collective
                good, leading to personal aggrandizement over public service.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="pl-6"
              style={{ borderLeft: "3px solid #e0e0e0" }}
            >
              <h3
                className="font-montserrat text-xl font-bold mb-3"
                style={{ color: "#212121" }}
              >
                We Are the Problem
              </h3>
              <p
                className="font-poppins text-base leading-relaxed"
                style={{ color: "#757575" }}
              >
                Everyone wants change but expects others to change first. We
                wait for society to transform like Western countries we watch on
                TV, without doing what they do: thinking of others, working for
                the greater good, and separating governance from personal gain.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* The Atunluto Solution */}
      <section
        className="py-20 md:py-32"
        style={{ backgroundColor: "#fafafa" }}
      >
        <div className="mx-auto max-w-6xl px-6 sm:px-8 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <h2
              className="font-montserrat text-3xl font-bold mb-4 md:text-4xl"
              style={{ color: "#1b5e20" }}
            >
              The Atunluto Model
            </h2>
            <p
              className="font-poppins text-lg max-w-2xl mx-auto"
              style={{ color: "#757575" }}
            >
              Replicating the cooperative thrift system within the body polity
              of Oyo South
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {coreValues.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-xl"
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e0e0e0",
                }}
              >
                <h3
                  className="font-montserrat text-xl font-bold mb-3"
                  style={{ color: "#1b5e20" }}
                >
                  {value.title}
                </h3>
                <p
                  className="font-poppins text-base leading-relaxed"
                  style={{ color: "#757575" }}
                >
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Achievements Section */}
      <section
        className="py-20 md:py-32"
        style={{ backgroundColor: "#ffffff" }}
      >
        <div className="mx-auto max-w-6xl px-6 sm:px-8 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <h2
              className="font-montserrat text-3xl font-bold mb-6 md:text-4xl"
              style={{ color: "#1b5e20" }}
            >
              What We Have Done
            </h2>
            <p className="font-poppins text-lg" style={{ color: "#757575" }}>
              Early interventions showing what Atunluto means in practice
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-8 rounded-xl"
              style={{ backgroundColor: "#E8F5E9" }}
            >
              <div
                className="font-montserrat text-4xl font-bold mb-3"
                style={{ color: "#1b5e20" }}
              >
                50+
              </div>
              <h3
                className="font-montserrat text-xl font-bold mb-3"
                style={{ color: "#212121" }}
              >
                Education Support
              </h3>
              <p
                className="font-poppins text-base leading-relaxed"
                style={{ color: "#424242" }}
              >
                WAEC fees paid for students and bush cutting machines provided
                for school fields across three LGAs in Oyo South district.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="p-8 rounded-xl"
              style={{ backgroundColor: "#E8F5E9" }}
            >
              <div
                className="font-montserrat text-4xl font-bold mb-3"
                style={{ color: "#1b5e20" }}
              >
                ₦50K - ₦100K
              </div>
              <h3
                className="font-montserrat text-xl font-bold mb-3"
                style={{ color: "#212121" }}
              >
                Interest-Free Loans
              </h3>
              <p
                className="font-poppins text-base leading-relaxed"
                style={{ color: "#424242" }}
              >
                Small traders receiving loans to grow their businesses.
                Beneficiaries who do well can move up from ₦50,000 to ₦75,000
                and ₦100,000.
              </p>
            </motion.div>
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
              Join the Political Caucus
            </h2>
            <p
              className="font-poppins text-xl mb-8"
              style={{ color: "rgba(255, 255, 255, 0.9)" }}
            >
              Start the journey with us towards rescuing Nigeria, one office at
              a time
            </p>
            <Link href="/join">
              <motion.button
                whileHover={{ scale: 1.05 }}
                className="px-12 py-4 rounded-lg font-poppins font-semibold"
                style={{ backgroundColor: "#ffffff", color: "#1b5e20" }}
              >
                Become a Member
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>
    </>
  );
}
