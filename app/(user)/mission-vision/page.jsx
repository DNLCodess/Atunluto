"use client";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import {
  HiOutlineTrendingUp,
  HiOutlineEye,
  HiOutlineLightBulb,
  HiOutlineChartBar,
  HiOutlineUsers,
  HiOutlineHeart,
  HiArrowRight,
} from "react-icons/hi";

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

const fadeInScale = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.7, ease: "easeOut" },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

function MissionVisionHero() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <section
      ref={ref}
      className="relative bg-[#1b5e20] pt-24 pb-20 md:pt-32 md:pb-32 overflow-hidden"
    >
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div style={{ y }} className="absolute inset-0">
          <Image
            src="/mission-vision-hero.jpg"
            alt="Mission and Vision"
            fill
            className="object-cover"
            quality={90}
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#1b5e20]/95 to-[#2e7d32]/90" />
        </motion.div>

        {/* Decorative elements */}
        <div className="absolute top-20 right-20 w-72 h-72 bg-[#4caf50]/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-[#2e7d32]/30 rounded-full blur-3xl" />
      </div>

      <motion.div
        style={{ opacity }}
        className="relative mx-auto max-w-5xl px-6 sm:px-8 lg:px-12 text-center"
      >
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div
            variants={fadeInUp}
            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full mb-8"
          >
            <HiOutlineLightBulb className="w-5 h-5 text-[#4caf50]" />
            <span className="font-poppins text-sm font-medium text-white">
              Our Purpose & Direction
            </span>
          </motion.div>

          <motion.h1
            variants={fadeInUp}
            className="font-montserrat text-4xl font-bold text-white md:text-5xl lg:text-6xl mb-6"
          >
            Mission & Vision
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="font-poppins text-xl text-white/90 max-w-3xl mx-auto leading-relaxed"
          >
            Our commitment to transforming Oyo South through cooperative
            politics and grassroots empowerment—guided by a clear purpose and
            bold vision for the future.
          </motion.p>

          {/* Decorative line */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: 120 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="h-1 bg-[#4caf50] mx-auto mt-10 rounded-full"
          />
        </motion.div>
      </motion.div>
    </section>
  );
}

function MissionSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const goals = [
    {
      icon: HiOutlineUsers,
      title: "Financial Independence",
      description:
        "Move our people from multidimensional poverty to self-sufficiency through structured support systems",
    },
    {
      icon: HiOutlineChartBar,
      title: "Economic Empowerment",
      description:
        "Build sustainable income sources through cooperative business models and interest-free loans",
    },
    {
      icon: HiOutlineHeart,
      title: "Community Development",
      description:
        "Strengthen social bonds and collective action for the greater good of Oyo South",
    },
  ];

  return (
    <section ref={ref} className="bg-white py-20 md:py-32">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left - Icon and Title */}
          <motion.div
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={staggerContainer}
          >
            <motion.div
              variants={fadeInScale}
              className="inline-flex items-center justify-center w-20 h-20 bg-[#1b5e20] rounded-2xl mb-8"
            >
              <HiOutlineTrendingUp className="w-10 h-10 text-white" />
            </motion.div>

            <motion.h2
              variants={fadeInUp}
              className="font-montserrat text-4xl font-bold text-[#1b5e20] mb-6"
            >
              Our Mission
            </motion.h2>

            <motion.p
              variants={fadeInUp}
              className="font-poppins text-2xl text-gray-900 font-semibold leading-relaxed mb-8"
            >
              To work hard and free our people from multidimensional poverty and
              move them into financial independence.
            </motion.p>

            <motion.p
              variants={fadeInUp}
              className="font-poppins text-lg text-gray-700 leading-relaxed"
            >
              Through cooperative politics and grassroots mobilization, we
              create opportunities for economic empowerment, quality education,
              accessible healthcare, and sustainable development across Oyo
              South Senatorial District.
            </motion.p>

            {/* Action link */}
            <motion.div variants={fadeInUp} className="mt-10">
              <motion.a
                href="#goals"
                whileHover={{ x: 5 }}
                className="inline-flex items-center gap-2 font-poppins text-[#1b5e20] font-semibold"
              >
                See how we achieve this
                <HiArrowRight className="w-5 h-5" />
              </motion.a>
            </motion.div>
          </motion.div>

          {/* Right - Key Goals */}
          <motion.div
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={staggerContainer}
            className="space-y-6"
          >
            {goals.map((goal, index) => (
              <motion.div
                key={index}
                variants={fadeInScale}
                whileHover={{ x: 10, backgroundColor: "#f0f9ff" }}
                className="flex gap-6 p-6 rounded-2xl border border-gray-100 transition-colors"
              >
                <div className="flex-shrink-0">
                  <div className="w-14 h-14 bg-[#c8e6c9] rounded-xl flex items-center justify-center">
                    <goal.icon className="w-7 h-7 text-[#1b5e20]" />
                  </div>
                </div>
                <div>
                  <h3 className="font-montserrat text-lg font-bold text-gray-900 mb-2">
                    {goal.title}
                  </h3>
                  <p className="font-poppins text-base text-gray-700 leading-relaxed">
                    {goal.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function VisionSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const visionPoints = [
    {
      title: "Prosperous Communities",
      description:
        "People living in decent houses with access to good roads, quality schools, and modern healthcare facilities",
    },
    {
      title: "Economic Opportunity",
      description:
        "Well-paying employment based on individual preferences and skills, matching standards in developed nations",
    },
    {
      title: "Quality Infrastructure",
      description:
        "Recreational facilities, transportation networks, and public services that rival Western standards",
    },
    {
      title: "Empowered Citizens",
      description:
        "Communities capable of self-governance and sustainable development without external dependency",
    },
  ];

  return (
    <section
      ref={ref}
      className="relative bg-[#2e7d32] py-20 md:py-32 overflow-hidden"
    >
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#4caf50]/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#1b5e20]/20 rounded-full blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left - Vision Points */}
          <motion.div
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={staggerContainer}
            className="space-y-6 order-2 lg:order-1"
          >
            {visionPoints.map((point, index) => (
              <motion.div
                key={index}
                variants={fadeInScale}
                whileHover={{ scale: 1.02 }}
                className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-[#4caf50] rounded-lg flex items-center justify-center font-montserrat font-bold text-white">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-montserrat text-lg font-bold text-white mb-2">
                      {point.title}
                    </h3>
                    <p className="font-poppins text-base text-white/80 leading-relaxed">
                      {point.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Right - Icon and Title */}
          <motion.div
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={staggerContainer}
            className="order-1 lg:order-2"
          >
            <motion.div
              variants={fadeInScale}
              className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl mb-8"
            >
              <HiOutlineEye className="w-10 h-10 text-white" />
            </motion.div>

            <motion.h2
              variants={fadeInUp}
              className="font-montserrat text-4xl font-bold text-white mb-6"
            >
              Our Vision
            </motion.h2>

            <motion.p
              variants={fadeInUp}
              className="font-poppins text-2xl text-white font-semibold leading-relaxed mb-8"
            >
              To see a Nigeria populated by prosperous people capable of doing
              what others are doing in the Western world.
            </motion.p>

            <motion.p
              variants={fadeInUp}
              className="font-poppins text-lg text-white/90 leading-relaxed"
            >
              Starting with Oyo South, we envision communities where every
              citizen has access to quality education, healthcare,
              infrastructure, and economic opportunities that match global
              standards.
            </motion.p>

            {/* Stats */}
            <motion.div
              variants={fadeInUp}
              className="mt-10 grid grid-cols-2 gap-6"
            >
              <div className="border-l-4 border-[#4caf50] pl-4">
                <div className="font-montserrat text-3xl font-bold text-[#4caf50]">
                  2027
                </div>
                <div className="font-poppins text-sm text-white/70 mt-1">
                  Target Year
                </div>
              </div>
              <div className="border-l-4 border-[#4caf50] pl-4">
                <div className="font-montserrat text-3xl font-bold text-[#4caf50]">
                  9 LGAs
                </div>
                <div className="font-poppins text-sm text-white/70 mt-1">
                  Full Coverage
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function CoreValues() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const values = [
    {
      title: "Transparency",
      description:
        "Open governance where members see how resources are spent and decisions are made",
      color: "#1b5e20",
    },
    {
      title: "Accountability",
      description:
        "Leaders answer to the collective, not individual sponsors or external interests",
      color: "#2e7d32",
    },
    {
      title: "Cooperation",
      description:
        "Shared responsibility and collective action—we rise together or not at all",
      color: "#4caf50",
    },
    {
      title: "Development",
      description:
        "Focus on systemic progress over handouts—building infrastructure, not dependency",
      color: "#66bb6a",
    },
  ];

  return (
    <section ref={ref} className="bg-white py-20 md:py-32">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={fadeInUp}
          className="text-center mb-16"
        >
          <h2 className="font-montserrat text-4xl font-bold text-[#1b5e20] mb-4">
            Our Core Values
          </h2>
          <p className="font-poppins text-lg text-gray-700 max-w-2xl mx-auto">
            The principles that guide every decision and action we take
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={staggerContainer}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {values.map((value, index) => (
            <motion.div
              key={index}
              variants={fadeInScale}
              whileHover={{ y: -10 }}
              className="relative group"
            >
              <div className="h-full bg-white p-8 rounded-2xl border-2 border-gray-100 hover:border-[#4caf50] transition-all shadow-sm hover:shadow-xl">
                {/* Color accent bar */}
                <div
                  className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
                  style={{ backgroundColor: value.color }}
                />

                <h3 className="font-montserrat text-xl font-bold text-gray-900 mb-3">
                  {value.title}
                </h3>
                <p className="font-poppins text-base text-gray-700 leading-relaxed">
                  {value.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function CallToAction() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      ref={ref}
      className="bg-gradient-to-br from-[#1b5e20] to-[#2e7d32] py-20 md:py-32"
    >
      <div className="mx-auto max-w-4xl px-6 sm:px-8 lg:px-12 text-center">
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={staggerContainer}
        >
          <motion.h2
            variants={fadeInUp}
            className="font-montserrat text-3xl font-bold text-white md:text-4xl mb-6"
          >
            Join Us in Building This Future
          </motion.h2>

          <motion.p
            variants={fadeInUp}
            className="font-poppins text-xl text-white/90 mb-10 leading-relaxed"
          >
            Our mission and vision require collective action. Be part of the
            movement transforming Oyo South through cooperative politics.
          </motion.p>

          <motion.div
            variants={fadeInScale}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <motion.a
              href="/join"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center justify-center gap-2 bg-white text-[#1b5e20] px-8 py-4 rounded-xl font-poppins font-semibold shadow-lg hover:shadow-xl transition-shadow"
            >
              Join the Movement
              <HiArrowRight className="w-5 h-5" />
            </motion.a>

            <motion.a
              href="/manifestos"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 px-8 py-4 rounded-xl font-poppins font-semibold hover:bg-white/20 transition-colors"
            >
              Read Our Manifestos
            </motion.a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

export default function MissionVisionPage() {
  return (
    <>
      <MissionVisionHero />
      <MissionSection />
      <VisionSection />
      <CoreValues />
      <CallToAction />
    </>
  );
}
