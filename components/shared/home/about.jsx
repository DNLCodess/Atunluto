"use client";
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { useSection } from "@/hooks/use-site-content";

export default function About() {
  const data = useSection("home.about");
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="bg-white py-20 md:py-32">
      <div className="mx-auto max-w-4xl px-6 sm:px-8 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8 }}
          className="space-y-8"
        >
          <h2 className="font-montserrat text-3xl font-bold text-gray-900 md:text-4xl">
            {data.heading}
          </h2>

          <div className="space-y-6 font-poppins text-lg leading-relaxed text-gray-700">
            {(data.paragraphs || []).map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>

          <div className="border-l-4 border-primary bg-light/30 p-6 md:p-8">
            <p className="font-poppins text-base italic text-gray-800 md:text-lg">
              &ldquo;{data.quote}&rdquo;
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
