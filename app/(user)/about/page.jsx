"use client";
import Image from "next/image";
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";

function AboutPageHero() {
  return (
    <section className="relative bg-primary-green pt-24 pb-16 md:pt-32 md:pb-24">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Left - Text Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="font-montserrat text-4xl font-bold text-white md:text-5xl lg:text-6xl">
              Building a New Political Model for Nigeria
            </h1>

            <p className="mt-6 font-poppins text-lg leading-relaxed text-white/90 md:text-xl">
              Atunluto Group is pioneering cooperative politics in Oyo South
              Senatorial District—a grassroots movement where members fund
              candidates, demand accountability, and drive real development.
            </p>

            <div className="mt-10 grid grid-cols-3 gap-6">
              <div className="border-l-4 border-accent pl-4">
                <div className="font-montserrat text-3xl font-bold text-accent">
                  800+
                </div>
                <div className="mt-1 font-poppins text-sm text-white/80">
                  Members
                </div>
              </div>
              <div className="border-l-4 border-accent pl-4">
                <div className="font-montserrat text-3xl font-bold text-accent">
                  5 LGAs
                </div>
                <div className="mt-1 font-poppins text-sm text-white/80">
                  Coverage
                </div>
              </div>
              <div className="border-l-4 border-accent pl-4">
                <div className="font-montserrat text-3xl font-bold text-accent">
                  2024
                </div>
                <div className="mt-1 font-poppins text-sm text-white/80">
                  Founded
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right - Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="relative aspect-4/3 overflow-hidden rounded-lg shadow-2xl">
              <Image
                src="/hero3.jpg"
                alt="Atunluto Group community gathering"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function OurStory() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="bg-white py-20 md:py-32">
      <div className="mx-auto max-w-5xl px-6 sm:px-8 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8 }}
          className="grid gap-12 lg:grid-cols-12"
        >
          {/* Left - Title and Date */}
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-32">
              <h2 className="font-montserrat text-3xl font-bold text-primary md:text-4xl">
                Our Story
              </h2>
              <div className="mt-6 border-l-4 border-accent-green pl-4">
                <p className="font-montserrat text-2xl font-bold text-gray-900">
                  March 2024
                </p>
                <p className="mt-1 font-poppins text-sm text-gray-600">
                  Founded in Oyo South
                </p>
              </div>
            </div>
          </div>

          {/* Right - Content */}
          <div className="lg:col-span-8">
            <div className="space-y-6 font-poppins text-lg leading-relaxed text-gray-700">
              <p className="text-xl text-gray-900">
                Atunluto Group was founded on March 1st, 2024, by Mr. Oluwasegun
                Theophilus Oladimeji (OTO) and a coalition of like-minded
                individuals across Oyo South Senatorial District.
              </p>

              <p>
                We started with simultaneous discussions in Ibadan South East,
                Ibadan North East, Ibadan North, Ibarapa East, and Ibarapa
                North. Our initial focus was the LGA elections, and while that
                specific goal evolved, we found fertile ground in Ibarapa East,
                where our cooperative model took root.
              </p>

              <p>
                The inspiration came from Nigeria's successful thrift and
                cooperative systems. We asked ourselves: if this model works for
                savings and business, why not for politics? Members meet,
                contribute, and manage resources collectively—no more waiting
                for politicians to hand out transport money or buy votes.
              </p>

              <div className="bg-light p-8 rounded-lg">
                <p className="font-semibold text-gray-900">
                  Today, we are 800+ strong across 5 LGAs, with members who
                  understand that real change requires shared investment, not
                  just shared complaints.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function HowWeWork() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const principles = [
    {
      title: "Members Fund Politics",
      description:
        "We contribute as a group to sponsor competent candidates from our own ranks. No more waiting for wealthy outsiders to fund campaigns.",
    },
    {
      title: "We Own the Structure",
      description:
        "Because members finance the movement, we maintain control. Our candidates know they serve the collective, not individual benefactors.",
    },
    {
      title: "Accountability is Built In",
      description:
        "If an elected official fails to deliver on promises, we have the organized power to impeach or remove support. This is not possible with traditional money politics.",
    },
    {
      title: "Development Over Handouts",
      description:
        "Instead of politicians distributing ₦200 here and ₦2,000 there during campaigns, we pool those same resources to fund real projects: tractors, school repairs, business loans.",
    },
  ];

  return (
    <section ref={ref} className="relative overflow-hidden py-20 md:py-32">
      {/* Parallax Background Image */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ scale: 1.1 }}
        animate={isInView ? { scale: 1 } : { scale: 1.1 }}
        transition={{ duration: 1.2 }}
      >
        <Image
          src="/hero1.jpg"
          alt="Community collaboration"
          fill
          className="object-cover"
          quality={90}
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-primary/70" />
      </motion.div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-6xl px-6 sm:px-8 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <h2 className="font-montserrat text-3xl font-bold text-white md:text-4xl">
            How We Work
          </h2>
          <p className="mt-4 font-family-primary text-lg text-white/90">
            The four pillars of our cooperative model
          </p>
        </motion.div>

        {/* Principles Grid */}
        <div className="mt-16 grid gap-6 md:grid-cols-2">
          {principles.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
              className="group relative bg-white/10 backdrop-blur-sm p-8 rounded-lg border border-white/20 hover:bg-white/15 transition-all"
            >
              {/* Accent corner */}
              <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-accent rounded-tl-lg" />

              <div className="relative">
                <h3 className="font-montserrat text-xl font-bold text-white">
                  {item.title}
                </h3>
                <p className="mt-4 font-poppins text-base leading-relaxed text-white/80">
                  {item.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhyItMatters() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      ref={ref}
      className="relative bg-secondary-green py-20 md:py-20 overflow-hidden"
    >
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-montserrat text-4xl font-bold text-white md:text-5xl">
            Why This Model Matters
          </h2>
          <div className="mt-4 mx-auto h-1 w-24 bg-accent rounded-full" />
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {/* Problem Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative bg-white/10 backdrop-blur-sm p-8 rounded-2xl border border-white/20"
          >
            <h3 className="font-montserrat text-2xl font-bold text-white mt-6 mb-4">
              The Problem
            </h3>
            <p className="font-poppins text-base leading-relaxed text-white/80">
              Politicians spend millions on campaigns, enter office broke, and
              begin stealing to recoup investments. The electorate expects
              handouts instead of systemic development.
            </p>
          </motion.div>

          {/* Solution Card - Highlighted */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative bg-accent-green p-8 rounded-2xl shadow-2xl lg:scale-105"
          >
            <h3 className="font-montserrat text-2xl font-bold text-white mt-6 mb-4">
              Our Solution
            </h3>
            <p className="font-poppins text-base leading-relaxed text-white">
              Collective funding by small contributions. Officials enter office
              debt-free and accountable to the group, not wealthy sponsors. This
              breaks the cycle of corruption.
            </p>
          </motion.div>

          {/* Results Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="relative bg-white/10 backdrop-blur-sm p-8 rounded-2xl border border-white/20"
          >
            <h3 className="font-montserrat text-2xl font-bold text-white mt-6 mb-4">
              Proven Results
            </h3>
            <p className="font-poppins text-base leading-relaxed text-white/80">
              Not just theory. Already working through interest-free loans,
              school support programs, and community projects across Oyo South.
            </p>
          </motion.div>
        </div>

        {/* Quote Section - Full Width */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="relative"
        >
          <div className="bg-white rounded-2xl p-8 md:p-12 shadow-2xl">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              {/* Large Quote Mark */}
              <div className="shrink-0">
                <div className="w-20 h-20 md:w-32 md:h-32 bg-accent-green rounded-2xl flex items-center justify-center">
                  <span className="text-5xl md:text-7xl font-serif text-white">
                    &ldquo;
                  </span>
                </div>
              </div>

              {/* Quote Content */}
              <div className="flex-1">
                <p className="font-poppins text-xl md:text-2xl font-semibold text-gray-900 leading-relaxed">
                  We are the problem due to the system of our politics. So we at
                  Atunluto want to change this narrative and do politics of
                  development.
                </p>
                <div className="mt-6 flex items-center gap-4">
                  <div className="h-px flex-1 bg-gray-300" />
                  <p className="font-montserrat text-sm font-bold text-primary uppercase tracking-wide">
                    Founding Principle
                  </p>
                  <div className="h-px flex-1 bg-gray-300" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bottom Stats - Optional */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="mt-12 grid grid-cols-3 gap-6 max-w-3xl mx-auto"
        >
          <div className="text-center">
            <div className="font-montserrat text-3xl font-bold text-accent">
              800+
            </div>
            <div className="font-poppins text-sm text-white/70 mt-1">
              Members Strong
            </div>
          </div>
          <div className="text-center">
            <div className="font-montserrat text-3xl font-bold text-accent">
              5
            </div>
            <div className="font-poppins text-sm text-white/70 mt-1">
              LGAs Covered
            </div>
          </div>
          <div className="text-center">
            <div className="font-montserrat text-3xl font-bold text-accent">
              100+
            </div>
            <div className="font-poppins text-sm text-white/70 mt-1">
              Loans Disbursed
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default function AboutPage() {
  return (
    <>
      <AboutPageHero />
      <OurStory />
      <HowWeWork />
      <WhyItMatters />
    </>
  );
}
