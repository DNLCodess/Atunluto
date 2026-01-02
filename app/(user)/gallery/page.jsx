// app/gallery/page.jsx
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/supabase/client";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Search, Grid3x3 } from "lucide-react";
import FullscreenViewer from "@/components/shared/gallery/FullScreenViewer";
import InfiniteRow from "@/components/shared/gallery/InfiniteRow";

export default function GalleryPage() {
  const supabase = createClient();

  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const shouldReduceMotion = useReducedMotion();

  // Fetch gallery images
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

  // Filter images based on category and search
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

  // Split images into rows with exactly 6 images per row (no duplication)
  const imageRows = useMemo(() => {
    if (filteredImages.length === 0) return [];

    const rows = [];
    const imagesPerRow = 6;

    // Split images into chunks of 6
    for (let i = 0; i < filteredImages.length; i += imagesPerRow) {
      const row = filteredImages.slice(i, i + imagesPerRow);

      // Only add rows that have at least 1 image
      if (row.length > 0) {
        rows.push(row);
      }
    }

    return rows;
  }, [filteredImages]);

  // Handle image click for fullscreen
  const openFullscreen = useCallback(
    (image) => {
      const index = filteredImages.findIndex((img) => img.id === image.id);
      setSelectedImage(image);
      setSelectedIndex(index);
      document.body.style.overflow = "hidden";
    },
    [filteredImages]
  );

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

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-b from-gray-50 to-white flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 spinner mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading gallery...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-linear-to-br from-green-900 via-green-800 to-green-900 text-white">
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
              className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full mb-6"
            >
              <Grid3x3 className="w-4 h-4" />
              <span className="text-sm font-medium">Photo Gallery</span>
            </motion.div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
              Our Journey in{" "}
              <span className="gradient-text-green">Pictures</span>
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
                <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse-subtle"></div>
                <span>{images.length} Photos</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse-subtle"></div>
                <span>{categories.length - 1} Categories</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse-subtle"></div>
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
      <section className="sticky top-0 z-30 bg-white/80 backdrop-blur-custom border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search photos..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-smooth text-sm"
                aria-label="Search photos"
              />
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto scrollbar-hide">
              {categories.map((category) => (
                <motion.button
                  key={category}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCategoryFilter(category)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-smooth touch-target ${
                    categoryFilter === category
                      ? "bg-green-700 text-white shadow-lg shadow-green-700/30"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  aria-label={`Filter by ${category}`}
                  aria-pressed={categoryFilter === category}
                >
                  {category === "all" ? "All" : category}
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Infinite Scrolling Gallery */}
      <section className="py-12 sm:py-16 overflow-hidden no-overscroll md:pl-10">
        {filteredImages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 max-w-7xl mx-auto px-4"
          >
            <Grid3x3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No photos found
            </h3>
            <p className="text-gray-600">
              Try adjusting your filters or search terms
            </p>
          </motion.div>
        ) : (
          <div className="space-y-8">
            {imageRows.map((row, index) => (
              <InfiniteRow
                key={index}
                images={row}
                rowIndex={index}
                onImageClick={openFullscreen}
              />
            ))}
          </div>
        )}
      </section>

      {/* Fullscreen Viewer */}
      <AnimatePresence>
        {selectedImage && (
          <FullscreenViewer
            image={selectedImage}
            images={filteredImages}
            currentIndex={selectedIndex}
            onClose={closeFullscreen}
            onNavigate={navigateImage}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
