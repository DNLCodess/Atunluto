// components/shared/gallery/InfiniteRow.jsx
"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useAnimation } from "framer-motion";
import ImageCard from "./ImageCard";

export default function InfiniteRow({ images, rowIndex, onImageClick }) {
  const [isPaused, setIsPaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);
  const controls = useAnimation();

  // Different speeds for each row to create parallax effect
  const speeds = [40, 50, 45, 55]; // seconds per full scroll
  const duration = speeds[rowIndex % speeds.length];

  // Alternate direction for visual interest
  const direction = rowIndex % 2 === 0 ? "normal" : "reverse";

  // Triple images for seamless infinite scroll (only if we have enough images)
  const shouldEnableInfiniteScroll = images.length >= 3;
  const displayImages = shouldEnableInfiniteScroll
    ? [...images, ...images, ...images]
    : images;

  useEffect(() => {
    if (!isPaused && !isDragging && shouldEnableInfiniteScroll) {
      // Start infinite animation
      controls.start({
        x: direction === "normal" ? [0, "-33.333%"] : ["-33.333%", 0],
        transition: {
          x: {
            duration: duration,
            repeat: Infinity,
            ease: "linear",
            repeatType: "loop",
          },
        },
      });
    } else {
      controls.stop();
    }
  }, [
    isPaused,
    isDragging,
    controls,
    duration,
    direction,
    shouldEnableInfiniteScroll,
  ]);

  // Drag constraints
  const dragConstraints = { left: -1000, right: 1000 };

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <motion.div
        drag="x"
        dragConstraints={dragConstraints}
        dragElastic={0.1}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={() => {
          setIsDragging(false);
          setIsPaused(false);
        }}
        animate={controls}
        className="flex gap-4 drag-cursor no-select"
        style={{
          width: "fit-content",
          justifyContent: images.length < 6 ? "center" : "flex-start",
        }}
      >
        {displayImages.map((image, index) => (
          <ImageCard
            key={`${image.id}-${index}`}
            image={image}
            onClick={() => onImageClick(image)}
            index={index}
          />
        ))}
      </motion.div>

      {/* Gradient overlays for edge fade effect (only show if infinite scroll is enabled) */}
      {shouldEnableInfiniteScroll && (
        <>
          <div className="absolute left-0 top-0 bottom-0 w-32 gradient-overlay-left pointer-events-none z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-32 gradient-overlay-right pointer-events-none z-10" />
        </>
      )}
    </div>
  );
}
