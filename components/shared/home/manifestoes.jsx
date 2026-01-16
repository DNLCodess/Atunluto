"use client";
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";

const manifestos = [
  {
    title: "Agriculture",
    focus: "10 tractors per agrarian LGA for farm mechanization",
    target: "Triple cultivated acres",
  },
  {
    title: "Healthcare",
    focus: "Health insurance for 500+ vulnerable per LGA",
    target: "All 9 LGAs covered",
  },
  {
    title: "Education",
    focus: "School repairs and teacher training upgrades",
    target: "Western standards trajectory",
  },
  {
    title: "Entrepreneurship",
    focus: "Interest-free loans and transport union support",
    target: "Coverage across 9 LGAs",
  },
  {
    title: "Tourism",
    focus: "Olokemeji reserves and Ibarapa mountain ranges",
    target: "Investor partnerships",
  },
  {
    title: "Transport",
    focus: "High-capacity CNG buses with route reorganization",
    target: "Reduced congestion",
  },
];

export default function Manifestos() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      ref={ref}
      className="py-24 md:py-40"
      style={{ backgroundColor: "#fafafa" }}
    >
      <div className="mx-auto max-w-6xl px-6 sm:px-8 lg:px-12">
        {/* Header Block */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
          className="mb-24"
        >
          <div className="grid md:grid-cols-2 gap-12 items-end">
            <div>
              <p
                className="font-poppins text-sm font-medium mb-4 tracking-wide uppercase"
                style={{ color: "#757575" }}
              >
                Strategic Framework
              </p>
              <h2
                className="font-montserrat text-5xl md:text-6xl font-bold leading-tight"
                style={{ color: "#212121" }}
              >
                Six Pillars of Development
              </h2>
            </div>
            <div className="md:text-right">
              <p
                className="font-poppins text-lg leading-relaxed"
                style={{ color: "#757575" }}
              >
                Our comprehensive approach to transforming Oyo South Senatorial
                District through evidence-based policy and grassroots
                implementation.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Manifestos Table */}
        <div className="bg-white rounded-lg overflow-hidden shadow-sm">
          {/* Table Header */}
          <div
            className="grid grid-cols-12 gap-4 px-8 py-5 border-b-2"
            style={{ borderColor: "#1b5e20", backgroundColor: "#fafafa" }}
          >
            <div className="col-span-3">
              <p
                className="font-poppins text-xs font-bold uppercase tracking-wide"
                style={{ color: "#757575" }}
              >
                Priority Area
              </p>
            </div>
            <div className="col-span-5 hidden md:block">
              <p
                className="font-poppins text-xs font-bold uppercase tracking-wide"
                style={{ color: "#757575" }}
              >
                Key Focus
              </p>
            </div>
            <div className="col-span-4 hidden md:block text-right">
              <p
                className="font-poppins text-xs font-bold uppercase tracking-wide"
                style={{ color: "#757575" }}
              >
                Target
              </p>
            </div>
          </div>

          {/* Table Rows */}
          {manifestos.map((manifesto, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.1 + index * 0.05 }}
              className="grid grid-cols-12 gap-4 px-8 py-6 border-b group hover:bg-[#fafafa] transition-colors cursor-pointer"
              style={{ borderColor: "#e0e0e0" }}
            >
              {/* Title */}
              <div className="col-span-12 md:col-span-3">
                <div className="flex items-center gap-3">
                  <span
                    className="font-montserrat text-sm font-bold"
                    style={{ color: "#1b5e20" }}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3
                    className="font-montserrat text-xl font-bold"
                    style={{ color: "#212121" }}
                  >
                    {manifesto.title}
                  </h3>
                </div>
              </div>

              {/* Focus */}
              <div className="col-span-12 md:col-span-5 mt-2 md:mt-0">
                <p
                  className="font-poppins text-base"
                  style={{ color: "#424242" }}
                >
                  {manifesto.focus}
                </p>
              </div>

              {/* Target */}
              <div className="col-span-12 md:col-span-4 mt-2 md:mt-0 md:text-right">
                <p
                  className="font-poppins text-sm font-medium"
                  style={{ color: "#757575" }}
                >
                  {manifesto.target}
                </p>
                <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link href="/manifestoes" prefetch>
                    <span
                      className="inline-flex items-center gap-1 font-poppins text-xs font-semibold"
                      style={{ color: "#1b5e20" }}
                    >
                      View details
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </span>
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-12 grid md:grid-cols-3 gap-8"
        >
          <div className="text-center md:text-left">
            <p
              className="font-montserrat text-4xl font-bold mb-2"
              style={{ color: "#1b5e20" }}
            >
              2027
            </p>
            <p className="font-poppins text-sm" style={{ color: "#757575" }}>
              Implementation from electoral wins
            </p>
          </div>
          <div className="text-center md:text-left">
            <p
              className="font-montserrat text-4xl font-bold mb-2"
              style={{ color: "#1b5e20" }}
            >
              9 LGAs
            </p>
            <p className="font-poppins text-sm" style={{ color: "#757575" }}>
              Across Oyo South district
            </p>
          </div>
          <div className="text-center md:text-left">
            <p
              className="font-montserrat text-4xl font-bold mb-2"
              style={{ color: "#1b5e20" }}
            >
              4 Years
            </p>
            <p className="font-poppins text-sm" style={{ color: "#757575" }}>
              To transform trajectory
            </p>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mt-16 text-center"
        >
          <Link href="/manifestoes" prefetch>
            <motion.button
              whileHover={{ backgroundColor: "#1b5e20", color: "#ffffff" }}
              className="font-poppins text-base font-semibold px-12 py-4 border-2 transition-all inline-flex items-center gap-3"
              style={{
                borderColor: "#1b5e20",
                color: "#1b5e20",
                backgroundColor: "transparent",
              }}
            >
              <span>Read Full Manifestos</span>
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
