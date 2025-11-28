"use client";
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import {
  Tractor,
  Heart,
  GraduationCap,
  Briefcase,
  Palmtree,
  Bus,
} from "lucide-react";
import Link from "next/link";

const manifestos = [
  {
    icon: Tractor,
    title: "Agriculture",
    description:
      "Farm mechanization with brand new tractors in each agrarian LGA to triple cultivated acres.",
    color: "#2E7D32",
    highlights: [
      "10 tractors per LGA",
      "Triple farm output",
      "Modern equipment",
    ],
  },
  {
    icon: Heart,
    title: "Healthcare",
    description:
      "Health insurance for vulnerable populations and specialist treatment accessibility.",
    color: "#E53935",
    highlights: [
      "500 vulnerable covered",
      "HMO partnerships",
      "Hospital equipment",
    ],
  },
  {
    icon: GraduationCap,
    title: "Education",
    description:
      "Improve learning environments, upgrade teachers, and enhance technical colleges.",
    color: "#1976D2",
    highlights: ["School repairs", "Teacher training", "Lab equipment"],
  },
  {
    icon: Briefcase,
    title: "Entrepreneurship",
    description:
      "Interest-free loans for artisans, traders, and farmers to improve livelihoods.",
    color: "#F57C00",
    highlights: ["Micro-loans", "Business support", "Transport unions"],
  },
  {
    icon: Palmtree,
    title: "Tourism",
    description:
      "Develop Olokemeji forest reserves and Ibarapa mountain ranges as tourist destinations.",
    color: "#00796B",
    highlights: [
      "Forest reserves",
      "Mountain tourism",
      "Investor partnerships",
    ],
  },
  {
    icon: Bus,
    title: "Transport",
    description:
      "High-capacity CNG buses and reorganized routes to reduce congestion.",
    color: "#5E35B1",
    highlights: ["CNG buses", "Route planning", "Reduced congestion"],
  },
];

export default function Manifestos() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <section ref={ref} className="bg-white py-16 md:py-24" id="manifesto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={fadeInUp}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <h2 className="font-montserrat text-3xl font-extrabold text-primary sm:text-4xl md:text-5xl">
            Our Manifestos
          </h2>
          <p className="mt-4 font-poppins text-lg text-gray-600 md:text-xl">
            Six key areas of development for Oyo South Senatorial District
          </p>
        </motion.div>

        {/* Manifestos Grid */}
        <div className="mt-12 grid gap-6 md:mt-16 md:grid-cols-2 lg:grid-cols-3">
          {manifestos.map((manifesto, index) => (
            <motion.div
              key={index}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              variants={fadeInUp}
              transition={{ duration: 0.6, delay: 0.1 + index * 0.1 }}
              whileHover={{ y: -8 }}
              className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-xl"
            >
              {/* Background Gradient on Hover */}
              <div
                className="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
                style={{
                  background: `linear-gradient(135deg, ${manifesto.color}05, transparent)`,
                }}
              />

              {/* Content */}
              <div className="relative">
                {/* Icon */}
                <div
                  className="mb-4 inline-flex rounded-xl p-3 transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${manifesto.color}15` }}
                >
                  <manifesto.icon
                    className="h-7 w-7"
                    style={{ color: manifesto.color }}
                  />
                </div>

                {/* Title */}
                <h3 className="font-montserrat text-xl font-bold text-gray-900">
                  {manifesto.title}
                </h3>

                {/* Description */}
                <p className="mt-3 font-poppins text-sm leading-relaxed text-gray-600">
                  {manifesto.description}
                </p>

                {/* Highlights */}
                <ul className="mt-4 space-y-2">
                  {manifesto.highlights.map((highlight, idx) => (
                    <li
                      key={idx}
                      className="flex items-center gap-2 font-poppins text-xs text-gray-500"
                    >
                      <div
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: manifesto.color }}
                      />
                      {highlight}
                    </li>
                  ))}
                </ul>

                {/* Learn More Link */}
                <div className="mt-6 flex items-center gap-2 font-poppins text-sm font-semibold transition-all group-hover:gap-3">
                  <span style={{ color: manifesto.color }}>Learn more</span>
                  <svg
                    className="h-4 w-4 transition-transform group-hover:translate-x-1"
                    style={{ color: manifesto.color }}
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
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={fadeInUp}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-12 text-center"
        >
          <Link href="/manifestos">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="rounded-full bg-primary px-8 py-4 font-poppins text-base font-bold text-white shadow-lg transition-all hover:bg-secondary hover:shadow-xl"
            >
              View Full Manifestos
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
