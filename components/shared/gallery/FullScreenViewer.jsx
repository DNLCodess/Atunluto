// app/gallery/components/FullscreenViewer.jsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Share2,
  Calendar,
  Tag,
} from "lucide-react";

export default function FullscreenViewer({
  image,
  images,
  currentIndex,
  onClose,
  onNavigate,
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  // Request fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNavigate("next");
      if (e.key === "ArrowLeft") onNavigate("prev");
      if (e.key === "f" || e.key === "F") toggleFullscreen();
      if (e.key === "+" || e.key === "=") handleZoom("in");
      if (e.key === "-" || e.key === "_") handleZoom("out");
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, onNavigate, toggleFullscreen]);

  // Zoom handlers
  const handleZoom = (direction) => {
    setZoomLevel((prev) => {
      const newZoom =
        direction === "in" ? Math.min(prev + 0.5, 3) : Math.max(prev - 0.5, 1);
      if (newZoom === 1) {
        setPosition({ x: 0, y: 0 });
      }
      return newZoom;
    });
  };

  // Reset zoom on image change
  useEffect(() => {
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });
  }, [currentIndex]);

  // Format date
  const formattedDate = image.created_at
    ? new Date(image.created_at).toLocaleDateString("en-NG", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  // Share functionality (Web Share API)
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: image.title,
          text: image.description || "Check out this photo from Atunluto Group",
          url: window.location.href,
        });
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      // Fallback: copy link to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 lightbox-backdrop"
      onClick={onClose}
    >
      {/* Top toolbar */}
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        exit={{ y: -100 }}
        className="absolute top-0 left-0 right-0 z-50 gradient-overlay-top p-4 safe-top no-print"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Title */}
          <div className="flex-1 min-w-0 mr-4">
            <h2 className="text-white text-lg font-bold truncate-text text-shadow">
              {image.title}
            </h2>
            <p className="text-gray-300 text-sm">
              {currentIndex + 1} / {images.length}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Zoom controls */}
            <div className="hidden sm:flex items-center gap-1 px-3 py-2 glass-dark rounded-lg">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleZoom("out")}
                disabled={zoomLevel <= 1}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-smooth disabled:opacity-50 touch-target focus-ring-green"
                aria-label="Zoom out"
              >
                <ZoomOut className="w-5 h-5 text-white" />
              </motion.button>
              <span className="text-white text-sm font-medium min-w-[3rem] text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleZoom("in")}
                disabled={zoomLevel >= 3}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-smooth disabled:opacity-50 touch-target focus-ring-green"
                aria-label="Zoom in"
              >
                <ZoomIn className="w-5 h-5 text-white" />
              </motion.button>
            </div>

            {/* Share button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleShare}
              className="p-3 glass-dark hover:bg-white/20 text-white rounded-lg transition-smooth touch-target focus-ring-green"
              title="Share"
              aria-label="Share photo"
            >
              <Share2 className="w-5 h-5" />
            </motion.button>

            {/* Fullscreen toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleFullscreen}
              className="hidden sm:block p-3 glass-dark hover:bg-white/20 text-white rounded-lg transition-smooth touch-target focus-ring-green"
              title="Fullscreen (F)"
              aria-label="Toggle fullscreen"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                />
              </svg>
            </motion.button>

            {/* Close button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-3 glass-dark hover:bg-white/20 text-white rounded-lg transition-smooth touch-target focus-ring-green"
              title="Close (Esc)"
              aria-label="Close viewer"
            >
              <X className="w-6 h-6" />
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Navigation Buttons */}
      {images.length > 1 && (
        <>
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            whileHover={{ scale: 1.1, x: -5 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              onNavigate("prev");
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-4 glass-dark hover:bg-white/20 text-white rounded-full transition-smooth no-print touch-target focus-ring-green"
            title="Previous (←)"
            aria-label="Previous photo"
          >
            <ChevronLeft className="w-6 h-6" />
          </motion.button>

          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            whileHover={{ scale: 1.1, x: 5 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              onNavigate("next");
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-4 glass-dark hover:bg-white/20 text-white rounded-full transition-smooth no-print touch-target focus-ring-green"
            title="Next (→)"
            aria-label="Next photo"
          >
            <ChevronRight className="w-6 h-6" />
          </motion.button>
        </>
      )}

      {/* Image Container with Pan/Zoom */}
      <div
        className="absolute inset-0 flex items-center justify-center p-4 sm:p-12 pt-24 pb-32 safe-top safe-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <motion.div
          key={image.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{
            opacity: 1,
            scale: zoomLevel,
            x: position.x,
            y: position.y,
          }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3 }}
          drag={zoomLevel > 1}
          dragElastic={0.1}
          dragConstraints={{
            left: -500,
            right: 500,
            top: -500,
            bottom: 500,
          }}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={() => setIsDragging(false)}
          className={`relative w-full h-full gpu-accelerated ${
            zoomLevel > 1 ? "pan-cursor" : "zoom-in-cursor"
          }`}
        >
          <Image
            src={image.full_image_url || image.image_url}
            alt={image.title}
            fill
            className="object-contain image-protected"
            quality={100}
            priority
            sizes="100vw"
            draggable={false}
          />
          {/* Protection overlay */}
          <div
            className="absolute inset-0 bg-transparent"
            onContextMenu={(e) => e.preventDefault()}
          />
        </motion.div>
      </div>

      {/* Bottom Info Panel */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        exit={{ y: 100 }}
        onClick={(e) => e.stopPropagation()}
        className="absolute bottom-0 left-0 right-0 gradient-overlay-bottom p-6 sm:p-8 safe-bottom no-print"
      >
        <div className="max-w-4xl mx-auto">
          {/* Description */}
          {image.description && (
            <p className="text-gray-200 text-base sm:text-lg leading-relaxed mb-4 text-shadow">
              {image.description}
            </p>
          )}

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
            {image.category && (
              <div className="flex items-center gap-2 px-4 py-2 glass-dark rounded-lg">
                <Tag className="w-4 h-4" />
                <span>{image.category}</span>
              </div>
            )}
            {formattedDate && (
              <div className="flex items-center gap-2 px-4 py-2 glass-dark rounded-lg">
                <Calendar className="w-4 h-4" />
                <span>{formattedDate}</span>
              </div>
            )}
          </div>

          {/* Keyboard shortcuts hint */}
          <div className="hidden sm:block mt-4 pt-4 border-t border-white/10">
            <p className="text-gray-500 text-xs">
              <span className="font-semibold">Keyboard shortcuts:</span> ← → to
              navigate • F for fullscreen • + - to zoom • Esc to close
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
