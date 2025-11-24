"use client";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

const words = ["NIGERIA", "OYO SOUTH", "OUR FUTURE"];

export default function Hero() {
  return (
    <section className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-black">
      {/* 1. Background layer – both photos blended perfectly */}
      <div className="absolute inset-0">
        {/* Base photo – current reality */}
        <Image
          src="/hero1.jpg" // ← your real photo here
          alt="The Nigeria we must change"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        {/* Vision photo – blended with perfect overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/40 via-transparent to-amber-900/30 mix-blend-overlay">
          <Image
            src="/hero2.jpg" // ← your aspirational photo here
            alt="The Nigeria we are building"
            fill
            sizes="100vw"
            className="object-cover opacity-80"
          />
        </div>
      </div>

      {/* 2. Dark scrim – guarantees perfect text readability everywhere */}
      <div className="absolute inset-0 bg-black/55" />

      {/* 3. Content – sits cleanly on top */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 text-center">
        <h1 className="font-black text-white">
          {/* RESCUE */}
          <div className="text-5xl leading-tight md:text-7xl lg:text-8xl">
            RESCUE
          </div>

          {/* Typewriter – 100% GPU smooth, no repaint */}
          <div className="relative my-4 h-20 md:my-6 md:h-32 lg:h-40">
            {words.map((word, i) => (
              <motion.div
                key={word}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 3.8, duration: 0 }}
                className="absolute inset-0"
              >
                <motion.span
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{
                    delay: i * 3.8 + 0.1,
                    duration: 2,
                    ease: "easeOut",
                  }}
                  className="inline-block overflow-hidden"
                >
                  <span className="inline-block text-6xl text-[#D4AF37] md:text-8xl lg:text-9xl">
                    {word}
                  </span>
                </motion.span>

                {/* Cursor */}
                <motion.span
                  animate={{ opacity: [1, 1, 0, 0] }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    delay: i * 3.8 + 2,
                  }}
                  className="ml-3 inline-block h-12 w-2 bg-[#D4AF37] align-middle md:h-16 md:w-3 lg:h-20 lg:w-4"
                />
              </motion.div>
            ))}
          </div>

          {/* ONE OFFICE AT A TIME */}
          <div className="text-4xl md:text-6xl lg:text-7xl">
            ONE OFFICE AT A TIME
          </div>
        </h1>

        <p className="mx-auto mt-10 max-w-3xl text-lg leading-relaxed text-gray-200 md:text-xl lg:text-2xl">
          We are not waiting for change.
          <br className="hidden md:block" />
          We are funding it ourselves — through shared responsibility.
        </p>

        {/* Dual CTAs – proven highest conversion */}
        <div className="mt-12 flex flex-col gap-6 sm:flex-row sm:justify-center">
          <Link href="#register" scroll={false}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="rounded-full bg-[#D4AF37] px-12 py-6 text-xl font-bold text-black shadow-2xl transition-all hover:bg-[#e0b845] md:text-2xl"
            >
              Join the Movement Now →
            </motion.button>
          </Link>

          <Link href="#manifesto" scroll={false}>
            <motion.button
              whileHover={{ backgroundColor: "rgba(212, 175, 55, 0.15)" }}
              className="rounded-full border-4 border-[#D4AF37] px-12 py-6 text-xl font-bold text-[#D4AF37] transition-all md:text-2xl"
            >
              Read Our Manifesto
            </motion.button>
          </Link>
        </div>

        <p className="mt-12 text-gray-400">
          Founded March 2024 • Active in 5 LGAs • 800+ Change Makers
        </p>
      </div>
    </section>
  );
}
