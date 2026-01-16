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
                { label: "Manifesto", href: "/manifestoes" },
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
          {/* Newsletter & Social */}
          <div>
            <h3 className="text-lg font-semibold text-green-300 mb-5">
              Stay Connected
            </h3>

            <p className="text-sm text-gray-300 mb-4">
              Get updates about our work, community events and initiatives.
            </p>

            <div className="flex items-center bg-white/10 rounded-lg overflow-hidden border border-white/10 mb-6">
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 px-3 py-2 bg-transparent text-sm text-white placeholder-gray-400 focus:outline-none"
              />
              <button className="px-1 py-2 w-max bg-green-600 hover:bg-green-500 transition text-sm font-medium">
                Subscribe
              </button>
            </div>

            {/* Social Media Icons */}
            <div className="flex items-center gap-4">
              <Link
                href="https://www.tiktok.com/@atunluto.group?_r=1&_t=ZS-92kRZVZlGa5"
                target="_blank"
                rel="noopener noreferrer"
                className="group"
                aria-label="TikTok"
              >
                <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-green-600 hover:border-green-600 transition-all duration-300">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
                  </svg>
                </div>
              </Link>

              <Link
                href="https://www.instagram.com/atunlutogroup?igsh=b3pyeTMxdmNvd3Rr"
                target="_blank"
                rel="noopener noreferrer"
                className="group"
                aria-label="Instagram"
              >
                <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-green-600 hover:border-green-600 transition-all duration-300">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </div>
              </Link>
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
