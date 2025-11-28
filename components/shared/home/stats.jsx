"use client";
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Users, MapPin, Calendar, TrendingUp } from "lucide-react";

const stats = [
  {
    icon: Users,
    value: 800,
    suffix: "+",
    label: "Change Makers",
    description: "Active members committed to transformation",
    color: "#4CAF50",
  },
  {
    icon: MapPin,
    value: 5,
    suffix: " LGAs",
    label: "Active Presence",
    description: "Growing across Oyo South District",
    color: "#2E7D32",
  },
  {
    icon: TrendingUp,
    value: 100,
    suffix: "+",
    label: "Businesses Supported",
    description: "Through our interest-free loan scheme",
    color: "#1B5E20",
  },
  {
    icon: Calendar,
    value: 2024,
    suffix: "",
    label: "Founded",
    description: "March 1st, building momentum daily",
    color: "#66BB6A",
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

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <section ref={ref} className="bg-white py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={fadeInUp}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <h2 className="font-montserrat text-3xl font-extrabold text-primary sm:text-4xl md:text-5xl">
            Our Growing Impact
          </h2>
          <p className="mt-4 font-poppins text-lg text-gray-600 md:text-xl">
            Real numbers from our grassroots movement
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="mt-12 grid gap-6 md:mt-16 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              variants={fadeInUp}
              transition={{ duration: 0.6, delay: 0.1 + index * 0.1 }}
              whileHover={{ y: -8 }}
              className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-gray-50 p-6 shadow-sm transition-all hover:shadow-xl"
            >
              {/* Background Effect */}
              <div
                className="absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-0 blur-3xl transition-opacity group-hover:opacity-100"
                style={{ backgroundColor: `${stat.color}20` }}
              />

              {/* Content */}
              <div className="relative">
                {/* Icon */}
                <div
                  className="mb-4 inline-flex rounded-xl p-3 transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${stat.color}15` }}
                >
                  <stat.icon
                    className="h-6 w-6"
                    style={{ color: stat.color }}
                  />
                </div>

                {/* Value */}
                <div className="font-montserrat text-4xl font-extrabold text-gray-900 md:text-5xl">
                  <Counter value={stat.value} />
                  {stat.suffix}
                </div>

                {/* Label */}
                <div
                  className="mt-2 font-montserrat text-sm font-bold uppercase tracking-wide"
                  style={{ color: stat.color }}
                >
                  {stat.label}
                </div>

                {/* Description */}
                <p className="mt-3 font-poppins text-sm text-gray-600">
                  {stat.description}
                </p>
              </div>

              {/* Decorative Border */}
              <div
                className="absolute bottom-0 left-0 h-1 w-0 transition-all duration-500 group-hover:w-full"
                style={{ backgroundColor: stat.color }}
              />
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={fadeInUp}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-12 text-center"
        >
          <p className="font-poppins text-lg text-gray-700 md:text-xl">
            Want to be part of these numbers?
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="mt-4 rounded-full bg-gradient-to-r from-primary to-secondary px-8 py-4 font-poppins text-base font-bold text-white shadow-lg transition-all hover:shadow-xl"
          >
            Join Atunluto Today
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}
