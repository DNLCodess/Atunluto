"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "About Us", href: "/about" },
    { name: "Mission", href: "/mission" },
    { name: "Vision", href: "/vision" },
    { name: "Manifesto", href: "/manifesto" },
    { name: "Gallery", href: "/gallery" },
    { name: "Join Us", href: "/join" },
  ];

  return (
    <>
      {/* Desktop / Main Navbar */}
      <motion.nav
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45 }}
        className="fixed top-0 left-0 w-full z-50 bg-white/80 backdrop-blur-lg border-b border-green-100 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
          {/* LOGO */}
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/logo.png" // 👈 replace with your actual file
              alt="Atunluto Group Logo"
              width={42}
              height={42}
              className="object-contain"
              priority
            />
            <span className="font-bold text-green-700 text-xl tracking-wide hidden sm:block">
              ATUNLUTO
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-green-900 hover:text-green-600 font-medium transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:block">
            <Link
              href="/join"
              className="px-5 py-2 bg-green-700 text-white font-semibold rounded-full hover:bg-green-600 transition-all"
            >
              Join Us
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setOpen(true)}
            className="md:hidden text-green-800"
          >
            <Menu size={28} />
          </button>
        </div>
      </motion.nav>

      {/* MOBILE DRAWER MENU */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.35 }}
            className="fixed inset-0 bg-white z-50 md:hidden shadow-xl"
          >
            <div className="flex justify-between items-center p-6 border-b">
              <div className="flex items-center gap-3">
                <Image
                  src="/logo.png"
                  alt="Atunluto Mobile Logo"
                  width={40}
                  height={40}
                  className="object-contain"
                />
                <span className="font-bold text-green-700 text-xl">
                  ATUNLUTO
                </span>
              </div>

              <button onClick={() => setOpen(false)}>
                <X size={30} className="text-green-800" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {navLinks.map((link) => (
                <motion.div
                  key={link.name}
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="block text-green-900 text-lg font-medium"
                  >
                    {link.name}
                  </Link>
                </motion.div>
              ))}

              <div className="pt-8">
                <Link
                  href="/join"
                  onClick={() => setOpen(false)}
                  className="block text-center px-5 py-3 bg-green-700 text-white rounded-full font-semibold"
                >
                  Join Us
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
