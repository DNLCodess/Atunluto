"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="relative bg-green-950 text-white pt-20 pb-10 overflow-hidden">
      {/* Soft glow background */}
      <div className="absolute inset-0 bg-linear-to-t from-green-900/60 to-transparent pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 45 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="max-w-7xl mx-auto px-6"
      >
        {/* Top Layer */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Branding */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="Atunluto Logo"
                width={55}
                height={55}
                className="rounded-lg object-contain"
              />
              <h2 className="text-2xl font-bold tracking-wide">
                ATUNLUTO GROUP
              </h2>
            </div>

            <p className="text-gray-300 leading-relaxed text-sm">
              Driving a new era of responsible leadership, development-focused
              politics, and community empowerment across Oyo South and beyond.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-lg font-semibold text-green-300 mb-5">
              Explore
            </h3>

            <ul className="space-y-3 text-sm text-gray-300">
              {[
                { label: "About Us", href: "/about" },
                { label: "Mission & Vision", href: "/mission" },
                { label: "Manifesto", href: "/manifesto" },
                { label: "Gallery", href: "/gallery" },
                { label: "Join Us", href: "/register" },
              ].map((item, i) => (
                <li key={i}>
                  <Link
                    href={item.href}
                    className="hover:text-white transition underline-offset-4 hover:underline"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Section */}
          <div>
            <h3 className="text-lg font-semibold text-green-300 mb-5">
              Contact
            </h3>

            <div className="space-y-3 text-sm text-gray-300">
              <p>Email: atunlutogroup@gmail.com</p>
              <p>Whatsapp: +2349157413851</p>
              <p>Tel: +2349121212110</p>
              <p>17B Adeyi Avenue, Bodija estate Ibadan Oyo State Nigeria</p>
            </div>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-lg font-semibold text-green-300 mb-5">
              Stay Connected
            </h3>

            <p className="text-sm text-gray-300 mb-4">
              Get updates about our work, community events and initiatives.
            </p>

            <div className="flex items-center bg-white/10 rounded-lg overflow-hidden border border-white/10">
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 px-3 py-2 bg-transparent text-sm text-white placeholder-gray-400 focus:outline-none"
              />
              <button className="px-1 py-2 w-max bg-green-600 hover:bg-green-500 transition text-sm font-medium">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="mt-14 border-t border-white/10 pt-8 text-center text-xs text-gray-100">
          © {new Date().getFullYear()} ATUNLUTO GROUP. All Rights Reserved.
        </div>
      </motion.div>
    </footer>
  );
}
