// app/gallery/components/ImageCard.jsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Maximize2, Calendar, Tag } from "lucide-react";

export default function ImageCard({ image, onClick, index }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Format date
  const formattedDate = image.created_at
    ? new Date(image.created_at).toLocaleDateString("en-NG", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.5 }}
      whileHover={{ scale: 1.05, zIndex: 20 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
      className="relative flex-shrink-0 w-80 h-64 rounded-2xl overflow-hidden bg-gray-100 cursor-pointer shadow-lg hover:shadow-2xl transition-smooth group touch-target"
    >
      {/* Image */}
      <div className="absolute inset-0">
        <Image
          src={image.image_url}
          alt={image.title}
          fill
          className={`object-cover transition-smooth-slow group-hover:scale-110 ${
            isLoaded ? "opacity-100 animate-fade-in" : "opacity-0"
          }`}
          sizes="320px"
          quality={85}
          onLoad={() => setIsLoaded(true)}
          draggable={false}
        />
      </div>

      {/* Loading skeleton */}
      {!isLoaded && <div className="absolute inset-0 skeleton-loading" />}

      {/* Protection overlay */}
      <div
        className="absolute inset-0 bg-transparent image-protected z-10"
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 gradient-overlay-bottom opacity-0 group-hover:opacity-100 transition-smooth z-20" />

      {/* Hover content overlay */}
      <motion.div
        initial={false}
        animate={{
          opacity: isHovered ? 1 : 0,
          y: isHovered ? 0 : 20,
        }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="absolute inset-0 p-6 flex flex-col justify-end text-white z-30"
      >
        <div className="space-y-3">
          {/* Title */}
          <h3 className="font-bold text-xl leading-tight line-clamp-2 text-shadow-strong">
            {image.title}
          </h3>

          {/* Description */}
          {image.description && (
            <p className="text-sm text-gray-200 line-clamp-2 leading-relaxed text-shadow">
              {image.description}
            </p>
          )}

          {/* Metadata */}
          <div className="flex items-center gap-4 text-xs text-gray-300">
            {image.category && (
              <div className="flex items-center gap-1.5 px-3 py-1 glass rounded-lg">
                <Tag className="w-3 h-3" />
                <span>{image.category}</span>
              </div>
            )}
            {formattedDate && (
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3 h-3" />
                <span>{formattedDate}</span>
              </div>
            )}
          </div>
        </div>

        {/* Expand icon */}
        <motion.div
          whileHover={{ scale: 1.2, rotate: 90 }}
          className="absolute top-4 right-4 p-2.5 glass rounded-full"
        >
          <Maximize2 className="w-5 h-5" />
        </motion.div>
      </motion.div>

      {/* Quick category badge (always visible) */}
      <div className="absolute top-4 left-4 z-30">
        <span className="category-badge">{image.category}</span>
      </div>
    </motion.div>
  );
}
