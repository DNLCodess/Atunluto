// components/shared/gallery/VideoCard.jsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Play, Calendar, Tag } from "lucide-react";
import { formatDuration } from "@/utils/video-processing";

export default function VideoCard({ image, onClick, index }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

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
      className="relative flex-shrink-0 w-80 aspect-video rounded-2xl overflow-hidden bg-gray-100 cursor-pointer shadow-lg hover:shadow-2xl transition-smooth group touch-target"
    >
      {/* Poster image — the only bytes ever loaded until this card is clicked */}
      <div className="absolute inset-0">
        <Image
          src={image.poster_url}
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

      {!isLoaded && <div className="absolute inset-0 skeleton-loading" />}

      {/* Play button */}
      <div className="absolute inset-0 flex items-center justify-center z-20">
        <motion.div
          animate={{ scale: isHovered ? 1.1 : 1 }}
          className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg"
        >
          <Play className="w-6 h-6 text-gray-900 fill-gray-900 ml-1" />
        </motion.div>
      </div>

      {/* Duration badge */}
      <div className="absolute bottom-3 right-3 z-20 px-2 py-1 bg-black/70 text-white text-xs font-medium rounded-lg">
        {formatDuration(image.duration_seconds)}
      </div>

      <div
        className="absolute inset-0 bg-transparent image-protected z-10"
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
      />

      <div className="absolute inset-0 gradient-overlay-bottom opacity-0 group-hover:opacity-100 transition-smooth z-10" />

      <motion.div
        initial={false}
        animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 20 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="absolute inset-x-0 bottom-0 p-4 z-20 text-white pointer-events-none"
      >
        <h3 className="font-bold text-base leading-tight line-clamp-1 text-shadow-strong">
          {image.title}
        </h3>
        <div className="flex items-center gap-3 text-xs text-gray-300 mt-1">
          {image.category && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 glass rounded-lg">
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
      </motion.div>
    </motion.div>
  );
}
