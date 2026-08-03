// components/shared/gallery/FullScreenVideoViewer.jsx
"use client";

import { useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Share2,
  Calendar,
  Tag,
} from "lucide-react";

export default function FullScreenVideoViewer({
  image,
  images,
  currentIndex,
  onClose,
  onNavigate,
}) {
  const videoRef = useRef(null);

  const pauseVideo = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
  }, []);

  // Pause whenever the displayed video changes (prev/next navigation).
  // The <video> is keyed by image.id, so it remounts on navigation — by the
  // time an effect body runs after that, videoRef.current already points at
  // the *new* element. Capturing the element here and pausing it in the
  // cleanup (which React runs before the next render commits) ensures the
  // *outgoing* video — the one that may still be mid-playback — is the one
  // that actually gets paused.
  useEffect(() => {
    const el = videoRef.current;
    return () => el?.pause();
  }, [currentIndex]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        pauseVideo();
        onClose();
      }
      if (e.key === "ArrowRight") onNavigate("next");
      if (e.key === "ArrowLeft") onNavigate("prev");
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, onNavigate, pauseVideo]);

  const formattedDate = image.created_at
    ? new Date(image.created_at).toLocaleDateString("en-NG", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: image.title,
          text: image.description || "Check out this video from Atunluto Group",
          url: window.location.href,
        });
      } catch {
        // user cancelled the share sheet — nothing to do
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  const handleClose = () => {
    pauseVideo();
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 lightbox-backdrop"
      onClick={handleClose}
    >
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        exit={{ y: -100 }}
        className="absolute top-0 left-0 right-0 z-50 gradient-overlay-top p-4 safe-top no-print"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex-1 min-w-0 mr-4">
            <h2 className="text-white text-lg font-bold truncate-text text-shadow">
              {image.title}
            </h2>
            <p className="text-gray-300 text-sm">
              {currentIndex + 1} / {images.length}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleShare}
              className="p-3 glass-dark hover:bg-white/20 text-white rounded-lg transition-smooth touch-target focus-ring-green"
              title="Share"
              aria-label="Share video"
            >
              <Share2 className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleClose}
              className="p-3 glass-dark hover:bg-white/20 text-white rounded-lg transition-smooth touch-target focus-ring-green"
              title="Close (Esc)"
              aria-label="Close viewer"
            >
              <X className="w-6 h-6" />
            </motion.button>
          </div>
        </div>
      </motion.div>

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
            aria-label="Previous video"
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
            aria-label="Next video"
          >
            <ChevronRight className="w-6 h-6" />
          </motion.button>
        </>
      )}

      <div
        className="absolute inset-0 flex items-center justify-center p-4 sm:p-12 pt-24 pb-32 safe-top safe-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <motion.video
          key={image.id}
          ref={videoRef}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3 }}
          src={image.video_url}
          poster={image.poster_url}
          controls
          playsInline
          preload="metadata"
          className="max-w-full max-h-full rounded-xl"
        />
      </div>

      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        exit={{ y: 100 }}
        onClick={(e) => e.stopPropagation()}
        className="absolute bottom-0 left-0 right-0 gradient-overlay-bottom p-6 sm:p-8 safe-bottom no-print"
      >
        <div className="max-w-4xl mx-auto">
          {image.description && (
            <p className="text-gray-200 text-base sm:text-lg leading-relaxed mb-4 text-shadow">
              {image.description}
            </p>
          )}
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
        </div>
      </motion.div>
    </motion.div>
  );
}
