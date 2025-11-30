// app/gallery/page.jsx
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/supabase/client";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import Image from "next/image";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Grid3x3,
  Search,
} from "lucide-react";

const supabase = createClient();

// Optimized Bento patterns - mobile first
const BENTO_PATTERNS = [
  // Pattern 1: Large feature with grid
  [
    { span: "col-span-2 row-span-2" }, // Large featured
    { span: "col-span-1 row-span-1" },
    { span: "col-span-1 row-span-1" },
    { span: "col-span-1 row-span-1" },
    { span: "col-span-1 row-span-1" },
  ],
  // Pattern 2: Vertical emphasis
  [
    { span: "col-span-1 row-span-2" }, // Tall
    { span: "col-span-2 row-span-1" }, // Wide
    { span: "col-span-1 row-span-1" },
    { span: "col-span-1 row-span-1" },
    { span: "col-span-1 row-span-1" },
  ],
  // Pattern 3: Horizontal feature
  [
    { span: "col-span-3 row-span-1" }, // Extra wide
    { span: "col-span-1 row-span-1" },
    { span: "col-span-1 row-span-1" },
    { span: "col-span-1 row-span-1" },
  ],
  // Pattern 4: Balanced grid
  [
    { span: "col-span-1 row-span-1" },
    { span: "col-span-1 row-span-1" },
    { span: "col-span-1 row-span-1" },
    { span: "col-span-2 row-span-1" }, // Wide
    { span: "col-span-1 row-span-1" },
  ],
];

export default function GalleryPage() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [imagesLoaded, setImagesLoaded] = useState(new Set());

  const shouldReduceMotion = useReducedMotion();

  const fetchGallery = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("gallery")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setImages(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchGallery();
  }, [fetchGallery]);

  // Filter images
  const filteredImages = useMemo(() => {
    return images.filter((img) => {
      const matchesCategory =
        categoryFilter === "all" || img.category === categoryFilter;
      const matchesSearch =
        searchQuery === "" ||
        img.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        img.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [images, categoryFilter, searchQuery]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(images.map((img) => img.category));
    return ["all", ...Array.from(cats)];
  }, [images]);

  // Group images into bento sections
  const bentoSections = useMemo(() => {
    const sections = [];
    let currentIndex = 0;

    while (currentIndex < filteredImages.length) {
      const pattern = BENTO_PATTERNS[sections.length % BENTO_PATTERNS.length];
      const sectionImages = filteredImages.slice(
        currentIndex,
        currentIndex + pattern.length
      );
      sections.push({ pattern, images: sectionImages });
      currentIndex += pattern.length;
    }

    return sections;
  }, [filteredImages]);

  // Fullscreen navigation
  const openFullscreen = useCallback((image, index) => {
    setSelectedImage(image);
    setSelectedIndex(index);
    document.body.style.overflow = "hidden";
  }, []);

  const closeFullscreen = useCallback(() => {
    setSelectedImage(null);
    document.body.style.overflow = "";
  }, []);

  const navigateImage = useCallback(
    (direction) => {
      const newIndex =
        direction === "next"
          ? (selectedIndex + 1) % filteredImages.length
          : (selectedIndex - 1 + filteredImages.length) % filteredImages.length;
      setSelectedIndex(newIndex);
      setSelectedImage(filteredImages[newIndex]);
    },
    [selectedIndex, filteredImages]
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedImage) return;
      if (e.key === "Escape") closeFullscreen();
      if (e.key === "ArrowRight") navigateImage("next");
      if (e.key === "ArrowLeft") navigateImage("prev");
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedImage, closeFullscreen, navigateImage]);

  // Handle image load
  const handleImageLoad = useCallback((imageId) => {
    setImagesLoaded((prev) => new Set([...prev, imageId]));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading gallery...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-900 via-green-800 to-green-900 text-white">
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-blob"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-center max-w-3xl mx-auto"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mb-6"
            >
              <Grid3x3 className="w-4 h-4" />
              <span className="text-sm font-medium">Photo Gallery</span>
            </motion.div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
              Our Journey in{" "}
              <span className="bg-gradient-to-r from-green-200 to-green-100 bg-clip-text text-transparent">
                Pictures
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-green-100 leading-relaxed max-w-2xl mx-auto">
              Explore moments that capture our commitment to community
              development, grassroots empowerment, and transforming Oyo South
              Senatorial District through collective action.
            </p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm text-green-100"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-300 rounded-full"></div>
                <span>{images.length} Photos</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-300 rounded-full"></div>
                <span>{categories.length - 1} Categories</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-300 rounded-full"></div>
                <span>Updated Regularly</span>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Decorative bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-auto"
          >
            <path
              d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
              fill="rgb(249, 250, 251)"
            />
          </svg>
        </div>
      </section>

      {/* Filters Section */}
      <section className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search photos..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition text-sm"
              />
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto">
              {categories.map((category) => (
                <motion.button
                  key={category}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCategoryFilter(category)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition ${
                    categoryFilter === category
                      ? "bg-green-700 text-white shadow-lg shadow-green-700/30"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {category === "all" ? "All" : category}
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Bento Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {filteredImages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <Grid3x3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No photos found
            </h3>
            <p className="text-gray-600">Try adjusting your filters</p>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {bentoSections.map((section, sectionIndex) => (
              <motion.div
                key={sectionIndex}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{
                  duration: 0.6,
                  delay: shouldReduceMotion ? 0 : sectionIndex * 0.1,
                }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
                style={{
                  gridAutoRows: "minmax(200px, auto)",
                }}
              >
                {section.images.map((image, imageIndex) => {
                  const pattern =
                    section.pattern[imageIndex] || section.pattern[0];
                  const globalIndex =
                    sectionIndex * section.pattern.length + imageIndex;

                  return (
                    <GalleryItem
                      key={image.id}
                      image={image}
                      pattern={pattern}
                      onClick={() => openFullscreen(image, globalIndex)}
                      onLoad={() => handleImageLoad(image.id)}
                      isLoaded={imagesLoaded.has(image.id)}
                    />
                  );
                })}
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Fullscreen Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black"
            onClick={closeFullscreen}
          >
            {/* Close Button */}
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={closeFullscreen}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-full transition"
            >
              <X className="w-6 h-6" />
            </motion.button>

            {/* Navigation Buttons */}
            {filteredImages.length > 1 && (
              <>
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  whileHover={{ scale: 1.1, x: -5 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateImage("prev");
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-full transition"
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
                    navigateImage("next");
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-full transition"
                >
                  <ChevronRight className="w-6 h-6" />
                </motion.button>
              </>
            )}

            {/* Image Container */}
            <div
              className="absolute inset-0 flex items-center justify-center p-4 sm:p-12"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                key={selectedImage.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="relative w-full h-full"
              >
                {/* Protected Image with proper sizing */}
                <div className="relative w-full h-full">
                  <Image
                    src={
                      selectedImage.full_image_url || selectedImage.image_url
                    }
                    alt={selectedImage.title}
                    fill
                    className="object-contain select-none pointer-events-none"
                    quality={95}
                    priority
                    sizes="100vw"
                    draggable={false}
                  />
                  {/* Protection overlay */}
                  <div
                    className="absolute inset-0 bg-transparent cursor-default"
                    onContextMenu={(e) => e.preventDefault()}
                  />
                </div>
              </motion.div>
            </div>

            {/* Image Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-6 sm:p-8 pointer-events-none"
            >
              <div className="max-w-4xl mx-auto">
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                  {selectedImage.title}
                </h3>
                {selectedImage.description && (
                  <p className="text-gray-300 text-sm sm:text-base line-clamp-2">
                    {selectedImage.description}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-4 text-sm text-gray-400">
                  <span className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-lg">
                    {selectedImage.category}
                  </span>
                  <span>
                    {selectedIndex + 1} / {filteredImages.length}
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Gallery Item Component
function GalleryItem({ image, pattern, onClick, onLoad, isLoaded }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      whileHover={{ scale: 1.02, zIndex: 10 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`${pattern.span} relative overflow-hidden rounded-2xl bg-gray-100 cursor-pointer group shadow-md hover:shadow-2xl transition-all duration-300`}
      style={{ minHeight: "200px" }}
      onClick={onClick}
    >
      {/* Image with proper object-fit */}
      <div className="absolute inset-0">
        <Image
          src={image.image_url}
          alt={image.title}
          fill
          className={`transition-all duration-700 group-hover:scale-110 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
          style={{ objectFit: "cover" }}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
          quality={75}
          onLoad={onLoad}
        />
      </div>

      {/* Loading skeleton */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse" />
      )}

      {/* Protection overlay */}
      <div
        className="absolute inset-0 bg-transparent select-none z-10"
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20" />

      {/* Content overlay */}
      <motion.div
        initial={false}
        animate={{
          opacity: isHovered ? 1 : 0,
          y: isHovered ? 0 : 20,
        }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 p-4 sm:p-6 flex flex-col justify-end text-white z-30"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base sm:text-lg mb-1 line-clamp-2">
              {image.title}
            </h3>
            {image.description && (
              <p className="text-xs sm:text-sm text-gray-200 line-clamp-2">
                {image.description}
              </p>
            )}
            <span className="inline-block mt-2 px-2 py-1 bg-white/20 backdrop-blur-sm rounded-md text-xs font-medium">
              {image.category}
            </span>
          </div>

          <motion.div
            whileHover={{ scale: 1.2, rotate: 90 }}
            className="flex-shrink-0 p-2 bg-white/20 backdrop-blur-sm rounded-full"
          >
            <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
