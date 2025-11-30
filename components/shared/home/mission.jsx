"use client";
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import Link from "next/link";
import { useRef } from "react";
import { HiArrowCircleUp, HiOutlineEye, HiArrowRight } from "react-icons/hi";

export default function MissionVision() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  return (
    <section
      ref={ref}
      className="relative bg-gradient-to-br from-[#1b5e20] via-[#2e7d32] to-[#1b5e20] py-8 md:py-12 overflow-hidden"
    >
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#4caf50] rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      {/* Decorative grid pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            "radial-gradient(circle, white 1px, transparent 1px)",
          backgroundSize: "50px 50px",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
        {/* Section Header */}
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={fadeInUp}
          className="text-center mb-16"
        >
          <h2 className="font-montserrat text-4xl font-bold text-white md:text-5xl">
            Mission & Vision
          </h2>
        </motion.div>

        {/* Diagonal Split Layout */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 mb-12">
          {/* Mission - Left Side */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            {/* Large Background Number */}
            <div className="absolute -top-10 -left-10 font-montserrat text-[180px] font-bold text-white/5 select-none">
              01
            </div>

            <div className="relative bg-white/5 backdrop-blur-md rounded-3xl p-8 md:p-10 border border-white/20 hover:bg-white/10 transition-all group">
              {/* Floating icon */}
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center justify-center w-20 h-20 bg-linear-to-br from-accent-green to-[#66bb6a] rounded-2xl mb-6 shadow-lg"
              >
                <HiArrowCircleUp className="w-10 h-10 text-white" />
              </motion.div>

              {/* Title */}
              <h3 className="font-montserrat text-3xl font-bold text-white mb-4">
                Mission
              </h3>

              {/* Divider */}
              <div className="w-16 h-1 bg-linear-to-r from-accent-green to-transparent rounded-full mb-6" />

              {/* Content */}
              <p className="font-poppins text-lg leading-relaxed text-white mb-6">
                To work hard and free our people from multidimensional poverty
                and move them into financial independence.
              </p>

              {/* Key points */}
              <div className="space-y-3">
                {[
                  "Cooperative politics",
                  "Grassroots empowerment",
                  "Economic freedom",
                ].map((point, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 bg-accent-green rounded-full" />
                    <span className="font-poppins text-base text-white">
                      {point}
                    </span>
                  </div>
                ))}
              </div>

              {/* Hover indicator */}
              <Link href="/mission-vision">
                <div className="mt-8 flex items-center gap-2 text-white font-poppins font-semibold opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ">
                  <span className="text-lg">Explore our mission</span>
                  <HiArrowRight className="w-4 h-4" />
                </div>
              </Link>
            </div>
          </motion.div>

          {/* Vision - Right Side */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative lg:mt-16"
          >
            {/* Large Background Number */}
            <div className="absolute -top-10 -right-10 font-montserrat text-[180px] font-bold text-white/5 select-none">
              02
            </div>

            <div className="relative bg-white/5 backdrop-blur-md rounded-3xl p-8 md:p-10 border border-white/20 hover:bg-white/10 transition-all group">
              {/* Floating icon */}
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#4caf50] to-[#66bb6a] rounded-2xl mb-6 shadow-lg"
              >
                <HiOutlineEye className="w-10 h-10 text-white" />
              </motion.div>

              {/* Title */}
              <h3 className="font-montserrat text-3xl font-bold text-white mb-4">
                Vision
              </h3>

              {/* Divider */}
              <div className="w-16 h-1 bg-gradient-to-r from-[#4caf50] to-transparent rounded-full mb-6" />

              {/* Content */}
              <p className="font-poppins text-lg leading-relaxed text-white/90 mb-6">
                A Nigeria of prosperous people living in decent houses, with
                access to quality infrastructure and global opportunities,
                starting with Oyo South.
              </p>

              {/* Key points */}
              <div className="space-y-3">
                {[
                  "Quality healthcare & education",
                  "Modern infrastructure",
                  "Economic prosperity",
                ].map((point, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 bg-[#4caf50] rounded-full" />
                    <span className="font-poppins text-sm text-white">
                      {point}
                    </span>
                  </div>
                ))}
              </div>

              {/* Hover indicator */}
              <Link href="/mission-vision">
                <div className="mt-8 flex items-center gap-2 text-white font-poppins font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-lg">Explore our vision</span>
                  <HiArrowRight className="w-4 h-4" />
                </div>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Bottom CTA Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="relative"
        >
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-2xl overflow-hidden">
            {/* Decorative corner accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-br from-accent-green/20 to-transparent rounded-bl-full" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-linear-to-tr from-primary-green/10 to-transparent rounded-tr-full" />

            <div className="relative grid md:grid-cols-3 gap-8 items-center">
              {/* Left - Large Quote Mark */}
              <div className="md:col-span-2">
                <div className="flex gap-6">
                  <div className="shrink-0">
                    <div className="w-16 h-16 bg-linear-to-br from-primary-green to-secondary-green rounded-2xl flex items-center justify-center">
                      <span className="text-4xl text-white font-serif leading-none">
                        &ldquo;
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="font-poppins text-xl md:text-2xl font-semibold text-gray-900 leading-relaxed">
                      We sponsor competent candidates, hold them accountable,
                      and maintain the power to remove them if they fail to
                      deliver.
                    </p>
                    <div className="mt-4 flex items-center gap-3">
                      <div className="h-px flex-1 bg-gray-200 max-w-[100px]" />
                      <p className="font-poppins text-sm font-medium text-gray-600">
                        The Atunluto Model
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right - CTA */}
              <div className="md:col-span-1 flex md:justify-end">
                <motion.a
                  href="/mission-vision"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="group inline-flex items-center gap-3 bg-gradient-to-r from-[#1b5e20] to-[#2e7d32] text-white px-8 py-4 rounded-2xl font-poppins font-semibold shadow-lg hover:shadow-2xl transition-all cursor-pointer"
                >
                  <span>Learn More</span>
                  <HiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.a>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
