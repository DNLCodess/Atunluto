"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useMemo, useRef } from "react";

export default function GalleryPage() {
  const images = Array.from({ length: 30 }).map(() => "/sample.jpeg");

  // Random bento shapes (width/height combos)
  const shapes = [
    "h-40", // small square
    "h-60", // medium
    "h-80", // tall
    "h-52", // wide
    "h-96", // very tall
    "h-72", // block
    "h-44", // small rectangle
    "h-[22rem]", // large
  ];

  // Randomization logic
  const randomized = useMemo(() => {
    return images.map((src, i) => ({
      id: i,
      src,
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      rotation: (Math.random() * 2 - 1) * 2, // -2° to 2°
      floatX: Math.random() * 4 - 2,
      floatY: Math.random() * 4 - 2,
      delay: Math.random() * 0.7,
      speed: Math.random() * 0.15 + 0.05, // parallax scroll intensity
    }));
  }, []);

  // SINGLE IMAGE COMPONENT
  function GalleryItem({ img }) {
    const ref = useRef(null);

    // Scroll parallax
    const { scrollYProgress } = useScroll({
      target: ref,
      offset: ["start end", "end start"],
    });

    const translateY = useTransform(
      scrollYProgress,
      [0, 1],
      [0, img.speed * -120] // premium parallax movement
    );

    return (
      <motion.div
        ref={ref}
        style={{ y: translateY, rotate: img.rotation }}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: img.delay,
          duration: 0.8,
          ease: "easeOut",
        }}
        whileHover={{
          scale: 1.05,
          rotate: img.rotation * 0.5,
          x: img.floatX * 4,
          y: img.floatY * 4,
          zIndex: 20,
        }}
        className="relative rounded-xl overflow-hidden shadow-lg cursor-pointer mb-6"
      >
        <motion.img
          src={img.src}
          alt="Gallery"
          className={`w-full object-cover ${img.shape}`}
          animate={{
            x: [0, img.floatX, 0],
            y: [0, img.floatY, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f5f9] py-16">
      <h1 className="text-center text-4xl font-bold text-blue-900 mb-16 tracking-tight">
        Gallery
      </h1>

      <div className="px-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {randomized.map((img) => (
          <GalleryItem key={img.id} img={img} />
        ))}
      </div>
    </div>
  );
}
