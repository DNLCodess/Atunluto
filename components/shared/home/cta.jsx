"use client";
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";
import { ArrowRight, Users, CheckCircle } from "lucide-react";

export default function CTA() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
  };

  const benefits = [
    "Be part of a movement changing Nigerian politics",
    "Help sponsor competent leaders from our community",
    "Hold elected officials accountable",
    "Access our interest-free loan schemes",
    "Contribute to real development projects",
    "Join 800+ change makers across Oyo South",
  ];

  return (
    <section
      ref={ref}
      className="relative overflow-hidden bg-gradient-to-br from-primary-green via-secondary-green to-accent-green py-16 md:py-24"
      id="register"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left Side - Content */}
          <motion.div
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
            className="flex flex-col justify-center"
          >
            <h2 className="font-montserrat text-3xl font-extrabold text-white sm:text-4xl md:text-5xl">
              Ready to Rescue Nigeria?
            </h2>
            <p className="mt-4 font-poppins text-lg text-white/90 md:text-xl">
              Join the Atunluto movement today. Together, we fund real change
              through cooperative politics—one office at a time.
            </p>

            {/* Benefits List */}
            <div className="mt-8 space-y-3">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial="hidden"
                  animate={isInView ? "visible" : "hidden"}
                  variants={fadeInUp}
                  transition={{ duration: 0.4, delay: 0.1 + index * 0.05 }}
                  className="flex items-start gap-3"
                >
                  <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-white" />
                  <span className="font-poppins text-sm text-white/90 md:text-base">
                    {benefit}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* Additional Info */}
            <motion.div
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              variants={fadeInUp}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-8 rounded-xl border border-white/20 bg-white/10 p-6 backdrop-blur-sm"
            >
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-white" />
                <div>
                  <p className="font-montserrat text-2xl font-bold text-white">
                    800+ Members
                  </p>
                  <p className="font-poppins text-sm text-white/80">
                    Already building the future
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Side - CTA Card */}
          <motion.div
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={fadeInUp}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex items-center"
          >
            <div className="w-full rounded-2xl border border-white/20 bg-white p-8 shadow-2xl md:p-10">
              <div className="mb-6 inline-flex rounded-full bg-primary-green/10 p-3">
                <Users className="h-8 w-8 text-primary-green" />
              </div>

              <h3 className="font-family-sans text-2xl font-extrabold text-gray-900 md:text-3xl">
                Become a Change Maker
              </h3>
              <p className="mt-3 font-poppins text-base text-gray-600">
                Registration is quick and simple. Join us in building a better
                Oyo South and Nigeria.
              </p>

              {/* Registration Form Preview */}
              <div className="mt-6 space-y-4">
                <div>
                  <label className="block font-poppins text-sm font-semibold text-gray-700">
                    What you&apos;ll need:
                  </label>
                  <ul className="mt-2 space-y-2 font-poppins text-sm text-gray-600">
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary-green" />
                      Full name and contact information
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary-green" />
                      Home address in Oyo South
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary-green" />
                      LGA, Ward, and Polling Unit details
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary-green" />
                      WhatsApp and Messenger contacts
                    </li>
                  </ul>
                </div>

                {/* CTA Buttons */}
                <div className="space-y-3 pt-4">
                  <Link href="/join" className="block">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary-green to-secondary-green py-4 font-poppins text-base font-bold text-white shadow-lg transition-all hover:shadow-xl"
                    >
                      Join Now
                      <ArrowRight className="h-5 w-5" />
                    </motion.button>
                  </Link>

                  <Link href="/about" className="block">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full rounded-full border-2 border-gray-300 bg-white py-4 font-poppins text-base font-bold text-gray-700 transition-all hover:border-primary-green hover:text-primary-green"
                    >
                      Learn More First
                    </motion.button>
                  </Link>
                </div>
              </div>

              {/* Trust Indicator */}
              <div className="mt-6 border-t border-gray-200 pt-6">
                <p className="text-center font-poppins text-xs text-gray-500">
                  🔒 Your information is secure and will only be used for
                  membership purposes
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
