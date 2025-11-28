"use client";
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";

export default function About() {
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
            About Atunluto Group
          </h2>

          <div className="space-y-6 font-poppins text-lg leading-relaxed text-gray-700">
            <p>
              Atunluto Group is a political association of men and women
              committed to transforming Oyo South Senatorial District through
              cooperative politics and shared responsibility.
            </p>

            <p>
              Founded in March 2024, we operate on a simple principle: politics
              should serve the people, not personal interests. Our members fund
              and own the political structure, ensuring accountability from the
              ground up.
            </p>

            <p>
              We sponsor competent candidates from our ranks, hold them
              accountable, and maintain the power to remove leaders who fail to
              deliver on their promises to the community.
            </p>
          </div>

          <div className="border-l-4 border-primary bg-light/30 p-6 md:p-8">
            <p className="font-poppins text-base italic text-gray-800 md:text-lg">
              &quot;We are not waiting for change. We are funding it
              ourselves—through shared responsibility and cooperative
              action.&rdquo;
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
