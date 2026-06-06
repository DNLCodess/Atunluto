"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useSection } from "@/hooks/use-site-content";

// Inline brand icons keyed by platform name (lowercased). Unknown platforms
// fall back to a generic globe icon, so admins can add any social link.
const SOCIAL_ICONS = {
  tiktok: (
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
  ),
  instagram: (
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  ),
  facebook: (
    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
  ),
  twitter: (
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  ),
  x: (
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  ),
  youtube: (
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  ),
  globe: (
    <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 0c2.5 2.5 3.5 6 3.5 10S14.5 19.5 12 22m0-20C9.5 4.5 8.5 8 8.5 12S9.5 19.5 12 22M2 12h20" />
  ),
};

export default function Footer() {
  const settings = useSection("site.settings");
  const { contact } = settings;
  const navLinks = settings.navLinks || [];
  const social = settings.social || [];

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
                src={settings.logo || "/logo.png"}
                alt="Atunluto Logo"
                width={55}
                height={55}
                className="rounded-lg object-contain"
              />
              <h2 className="text-2xl font-bold tracking-wide">
                {settings.footerBrand}
              </h2>
            </div>

            <p className="text-gray-300 leading-relaxed text-sm">
              {settings.footerBlurb}
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-lg font-semibold text-green-300 mb-5">
              Explore
            </h3>

            <ul className="space-y-3 text-sm text-gray-300">
              {navLinks.map((item, i) => (
                <li key={i}>
                  <Link
                    href={item.href}
                    className="hover:text-white transition underline-offset-4 hover:underline"
                  >
                    {item.name}
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
              {contact?.email && <p>Email: {contact.email}</p>}
              {contact?.whatsapp && <p>Whatsapp: {contact.whatsapp}</p>}
              {contact?.tel && <p>Tel: {contact.tel}</p>}
              {contact?.address && <p>{contact.address}</p>}
            </div>
          </div>

          {/* Social */}
          <div>
            <h3 className="text-lg font-semibold text-green-300 mb-5">
              Follow Us
            </h3>

            <p className="text-sm text-gray-300 mb-4">
              Follow our work, community events and initiatives across social
              media.
            </p>

            {/* Social Media Icons */}
            <div className="flex items-center gap-4">
              {social.map((item, i) => {
                const key = (item.platform || "").toLowerCase().trim();
                const icon = SOCIAL_ICONS[key] || SOCIAL_ICONS.globe;
                return (
                  <Link
                    key={i}
                    href={item.href || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group"
                    aria-label={item.platform}
                  >
                    <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-green-600 hover:border-green-600 transition-all duration-300">
                      <svg
                        className="w-5 h-5 text-white"
                        fill={key === "globe" || !SOCIAL_ICONS[key] ? "none" : "currentColor"}
                        stroke={!SOCIAL_ICONS[key] ? "currentColor" : "none"}
                        strokeWidth={!SOCIAL_ICONS[key] ? 2 : 0}
                        viewBox="0 0 24 24"
                      >
                        {icon}
                      </svg>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="mt-14 border-t border-white/10 pt-8 text-center text-xs text-gray-100">
          © {new Date().getFullYear()} {settings.footerBrand}. All Rights
          Reserved.
        </div>
      </motion.div>
    </footer>
  );
}
