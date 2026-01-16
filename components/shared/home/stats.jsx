"use client";
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import Link from "next/link";

const stats = [
  {
    value: 800,
    suffix: "+",
    label: "Members",
    description: "Committed to grassroots transformation",
  },
  {
    value: 5,
    suffix: "",
    label: "LGAs",
    description: "Active presence across Oyo South",
  },
  {
    value: 100,
    suffix: "+",
    label: "Businesses",
    description: "Supported with interest-free loans",
  },
  {
    value: 50,
    suffix: "+",
    label: "Students",
    description: "WAEC fees paid and schools supported",
  },
];

function Counter({ value, duration = 2 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;

    let startTime;
    let animationFrame;

    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = (currentTime - startTime) / (duration * 1000);

      if (progress < 1) {
        setCount(Math.floor(value * progress));
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(value);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [isInView, value, duration]);

  return <span ref={ref}>{count.toLocaleString()}</span>;
}

export default function Stats() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      ref={ref}
      className="py-20 md:py-32"
      style={{ backgroundColor: "#1b5e20" }}
    >
      <div className="mx-auto max-w-6xl px-6 sm:px-8 lg:px-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <h2
            className="font-montserrat text-4xl font-bold mb-4 md:text-5xl"
            style={{ color: "#ffffff" }}
          >
            Our Impact in Numbers
          </h2>
          <p
            className="font-poppins text-lg max-w-2xl mx-auto"
            style={{ color: "rgba(255, 255, 255, 0.8)" }}
          >
            Since March 2024, we have been building a movement for real change
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-8 mb-16">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="text-center"
            >
              {/* Value */}
              <div
                className="font-montserrat text-5xl md:text-6xl font-bold mb-2"
                style={{ color: "#4caf50" }}
              >
                <Counter value={stat.value} />
                {stat.suffix}
              </div>

              {/* Label */}
              <div
                className="font-montserrat text-lg font-bold mb-2"
                style={{ color: "#ffffff" }}
              >
                {stat.label}
              </div>

              {/* Description */}
              <p
                className="font-poppins text-sm"
                style={{ color: "rgba(255, 255, 255, 0.7)" }}
              >
                {stat.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Bottom Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="pt-12 text-center"
          style={{ borderTop: "1px solid rgba(255, 255, 255, 0.2)" }}
        >
          <p
            className="font-poppins text-xl font-semibold mb-6"
            style={{ color: "#ffffff" }}
          >
            Be part of the movement transforming Oyo South
          </p>
          <Link href="/join-us">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="font-poppins text-base font-semibold px-10 py-4 transition-all rounded-lg"
              style={{
                backgroundColor: "#ffffff",
                color: "#1b5e20",
              }}
            >
              Join Atunluto Group
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
