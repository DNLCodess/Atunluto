"use client";
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Eye, Compass } from "lucide-react";

export default function MissionVision() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <section
      ref={ref}
      className="bg-gradient-to-b from-white to-light/30 py-16 md:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 lg:gap-12">
          {/* Mission */}
          <motion.div
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
            className="group relative overflow-hidden rounded-2xl bg-white p-8 shadow-sm transition-all hover:shadow-lg md:p-10"
          >
            {/* Background Accent */}
            <div className="absolute right-0 top-0 h-40 w-40 translate-x-10 -translate-y-10 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 blur-3xl transition-all group-hover:scale-150" />

            {/* Icon */}
            <div className="relative mb-6 inline-flex rounded-xl bg-primary/10 p-4">
              <Compass className="h-8 w-8 text-primary" />
            </div>

            {/* Content */}
            <div className="relative">
              <h2 className="font-montserrat text-2xl font-extrabold text-gray-900 sm:text-3xl">
                Our Mission
              </h2>
              <p className="mt-4 font-poppins text-base leading-relaxed text-gray-700 md:text-lg">
                To work hard and free our people from multidimensional poverty
                and move them into financial independence through cooperative
                politics and grassroots empowerment.
              </p>
            </div>

            {/* Decorative Line */}
            <div className="relative mt-6 h-1 w-20 rounded-full bg-gradient-to-r from-primary to-accent" />
          </motion.div>

          {/* Vision */}
          <motion.div
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={fadeInUp}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="group relative overflow-hidden rounded-2xl bg-white p-8 shadow-sm transition-all hover:shadow-lg md:p-10"
          >
            {/* Background Accent */}
            <div className="absolute right-0 top-0 h-40 w-40 translate-x-10 -translate-y-10 rounded-full bg-gradient-to-br from-accent/10 to-secondary/10 blur-3xl transition-all group-hover:scale-150" />

            {/* Icon */}
            <div className="relative mb-6 inline-flex rounded-xl bg-accent/10 p-4">
              <Eye className="h-8 w-8 text-accent" />
            </div>

            {/* Content */}
            <div className="relative">
              <h2 className="font-montserrat text-2xl font-extrabold text-gray-900 sm:text-3xl">
                Our Vision
              </h2>
              <p className="mt-4 font-poppins text-base leading-relaxed text-gray-700 md:text-lg">
                To see a Nigeria populated by prosperous people capable of doing
                what others are doing in the Western world—living in decent
                houses, having access to good roads, schools, hospitals, and
                recreational facilities, starting with Oyo South.
              </p>
            </div>

            {/* Decorative Line */}
            <div className="relative mt-6 h-1 w-20 rounded-full bg-gradient-to-r from-accent to-secondary" />
          </motion.div>
        </div>

        {/* Bottom Statement */}
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={fadeInUp}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 text-center"
        >
          <div className="mx-auto max-w-3xl rounded-xl border-l-4 border-primary bg-white p-6 shadow-sm md:p-8">
            <p className="font-poppins text-lg font-semibold text-gray-900 md:text-xl">
              "We are building a political caucus that sponsors competent
              candidates from our ranks, holds them accountable, and can impeach
              them if they don't deliver."
            </p>
            <p className="mt-4 font-poppins text-sm text-gray-600">
              A new model of politics for Oyo South and Nigeria
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
