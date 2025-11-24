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
          src="/hero1.jpg"
          alt="The Nigeria we must change"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
          quality={90}
        />
        {/* Vision photo – blended with perfect overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/40 via-transparent to-amber-900/30 mix-blend-overlay">
          <Image
            src="/hero2.jpg"
            alt="The Nigeria we are building"
            fill
            sizes="100vw"
            className="object-cover object-center opacity-80"
            quality={90}
          />
        </div>
      </div>

      {/* 2. Dark scrim – guarantees perfect text readability everywhere */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />

      {/* 3. Content – sits cleanly on top */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="font-black text-white"
        >
          {/* RESCUE */}
          <div className="text-4xl leading-tight sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl">
            RESCUE
          </div>

          {/* Typewriter – 100% GPU smooth, no repaint */}
          <div className="relative my-3 h-16 sm:my-4 sm:h-20 md:my-6 md:h-28 lg:h-36 xl:h-40">
            {words.map((word, i) => (
              <motion.div
                key={word}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 3.8, duration: 0 }}
                className="absolute inset-0 flex items-center justify-center"
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
                  <span className="inline-block whitespace-nowrap text-4xl text-[#D4AF37] sm:text-5xl md:text-7xl lg:text-8xl xl:text-9xl">
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
                  className="ml-1 inline-block h-8 w-1 bg-[#D4AF37] align-middle sm:ml-2 sm:h-10 sm:w-1.5 md:ml-3 md:h-14 md:w-2 lg:h-16 lg:w-3 xl:h-20 xl:w-4"
                />
              </motion.div>
            ))}
          </div>

          {/* ONE OFFICE AT A TIME */}
          <div className="text-3xl leading-tight sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
            ONE OFFICE AT A TIME
          </div>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mx-auto mt-6 max-w-3xl px-4 text-base leading-relaxed text-gray-200 sm:mt-8 sm:text-lg md:mt-10 md:text-xl lg:text-2xl"
        >
          We are not waiting for change.
          <br className="hidden sm:block" />
          We are funding it ourselves — through shared responsibility.
        </motion.p>

        {/* Dual CTAs – proven highest conversion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-8 flex flex-col gap-4 sm:mt-10 sm:flex-row sm:justify-center md:mt-12 md:gap-6"
        >
          <Link href="#register" scroll={false} className="w-full sm:w-auto">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full rounded-full bg-[#D4AF37] px-8 py-4 text-base font-bold text-black shadow-2xl transition-all hover:bg-[#e0b845] sm:w-auto sm:px-10 sm:py-5 md:px-12 md:py-6 md:text-xl lg:text-2xl"
            >
              Join the Movement Now →
            </motion.button>
          </Link>

          <Link href="#manifesto" scroll={false} className="w-full sm:w-auto">
            <motion.button
              whileHover={{ backgroundColor: "rgba(212, 175, 55, 0.15)" }}
              className="w-full rounded-full border-2 border-[#D4AF37] px-8 py-4 text-base font-bold text-[#D4AF37] transition-all sm:w-auto sm:border-3 sm:px-10 sm:py-5 md:border-4 md:px-12 md:py-6 md:text-xl lg:text-2xl"
            >
              Read Our Manifesto
            </motion.button>
          </Link>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="mt-8 text-sm text-gray-400 sm:mt-10 sm:text-base md:mt-12"
        >
          Founded March 2024 • Active in 5 LGAs • 800+ Change Makers
        </motion.p>
      </div>
    </section>
  );
}
