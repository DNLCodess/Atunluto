// app/admin/gallery/page.jsx
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/supabase/client";
import useAuthStore from "@/lib/store";
import {
  Upload,
  Image as ImageIcon,
  Trash2,
  Edit2,
  X,
  Search,
  Filter,
  Grid,
  List,
  Eye,
  Download,
  Calendar,
  User,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

const supabase = createClient();

const CATEGORIES = [
  "Events",
  "Meetings",
  "Community Projects",
  "Education",
  "Healthcare",
  "Agriculture",
  "Entrepreneurship",
  "Tourism",
  "Other",
];

// Image compression utility
const compressImage = async (file, maxWidth = 1920, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(
                new File([blob], file.name, {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                })
              );
            } else {
              reject(new Error("Canvas to Blob conversion failed"));
            }
          },
          "image/jpeg",
          quality
        );
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

export default function AdminGalleryPage() {
  const { user, role } = useAuthStore();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [viewImage, setViewImage] = useState(null);
  const [editImage, setEditImage] = useState(null);
  const [deleteImage, setDeleteImage] = useState(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [viewMode, setViewMode] = useState("grid");

  const [uploadForm, setUploadForm] = useState({
    file: null,
    title: "",
    description: "",
    category: "Events",
  });
  const [previewUrl, setPreviewUrl] = useState(null);
  const [originalSize, setOriginalSize] = useState(0);
  const [compressedSize, setCompressedSize] = useState(0);

  useEffect(() => {
    fetchGallery();
  }, []);

  const fetchGallery = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("gallery")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching gallery:", error);
    } else {
      setImages(data || []);
    }
    setLoading(false);
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Validate file size (max 10MB before compression)
    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB");
      return;
    }

    setOriginalSize(file.size);
    setUploadProgress(10); // Show initial progress

    try {
      // Compress image
      const compressed = await compressImage(file);
      setCompressedSize(compressed.size);
      setUploadProgress(30);

      setUploadForm({ ...uploadForm, file: compressed });

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
        setUploadProgress(0); // Reset progress
      };
      reader.readAsDataURL(compressed);
    } catch (error) {
      console.error("Compression error:", error);
      alert("Failed to process image. Please try another file.");
      setUploadProgress(0);
    }
  };

  // app/admin/gallery/page.jsx - Update the upload section

  // Add thumbnail generation function
  const generateThumbnail = async (file, maxWidth = 800, quality = 0.7) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new window.Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions for thumbnail
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(
                  new File([blob], `thumb_${file.name}`, {
                    type: "image/jpeg",
                    lastModified: Date.now(),
                  })
                );
              } else {
                reject(new Error("Thumbnail generation failed"));
              }
            },
            "image/jpeg",
            quality
          );
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  // Update handleUpload function
  const handleUpload = async (e) => {
    e.preventDefault();

    if (!uploadForm.file || !uploadForm.title) {
      alert("Please provide both an image and a title");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const fileExt = uploadForm.file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}`;

      setUploadProgress(10);

      // Generate thumbnail (800px max width)
      const thumbnail = await generateThumbnail(uploadForm.file, 800, 0.7);

      setUploadProgress(20);

      // Upload thumbnail (this is what we'll use in the gallery)
      const thumbnailPath = `${fileName}_thumb.jpg`;
      const { error: thumbError } = await supabase.storage
        .from("gallery")
        .upload(thumbnailPath, thumbnail, {
          cacheControl: "3600",
          upsert: false,
        });

      if (thumbError) throw thumbError;

      setUploadProgress(50);

      // Upload full resolution (for lightbox view)
      const fullPath = `${fileName}.${fileExt}`;
      const { error: fullError } = await supabase.storage
        .from("gallery")
        .upload(fullPath, uploadForm.file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (fullError) throw fullError;

      setUploadProgress(70);

      // Get public URLs
      const {
        data: { publicUrl: thumbUrl },
      } = supabase.storage.from("gallery").getPublicUrl(thumbnailPath);

      const {
        data: { publicUrl: fullUrl },
      } = supabase.storage.from("gallery").getPublicUrl(fullPath);

      setUploadProgress(85);

      // Save metadata with both URLs
      const { data: dbData, error: dbError } = await supabase
        .from("gallery")
        .insert({
          title: uploadForm.title,
          description: uploadForm.description,
          category: uploadForm.category,
          image_url: thumbUrl, // Thumbnail for gallery
          full_image_url: fullUrl, // Full res for lightbox
          storage_path: thumbnailPath,
          full_storage_path: fullPath,
          uploaded_by: user.id,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setUploadProgress(100);

      setImages([dbData, ...images]);

      // Reset form
      setUploadForm({
        file: null,
        title: "",
        description: "",
        category: "Events",
      });
      setPreviewUrl(null);
      setOriginalSize(0);
      setCompressedSize(0);
      setShowUploadModal(false);
      setUploadProgress(0);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload image. Please try again.");
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteImage) return;

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("gallery")
        .remove([deleteImage.storage_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from("gallery")
        .delete()
        .eq("id", deleteImage.id);

      if (dbError) throw dbError;

      // Update local state
      setImages(images.filter((img) => img.id !== deleteImage.id));
      setDeleteImage(null);
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete image. Please try again.");
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();

    try {
      const { error } = await supabase
        .from("gallery")
        .update({
          title: editImage.title,
          description: editImage.description,
          category: editImage.category,
        })
        .eq("id", editImage.id);

      if (error) throw error;

      // Update local state
      setImages(
        images.map((img) =>
          img.id === editImage.id
            ? {
                ...img,
                title: editImage.title,
                description: editImage.description,
                category: editImage.category,
              }
            : img
        )
      );

      setEditImage(null);
    } catch (error) {
      console.error("Update error:", error);
      alert("Failed to update image. Please try again.");
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  // Filter images
  const filteredImages = images.filter((img) => {
    const matchesSearch =
      img.title.toLowerCase().includes(search.toLowerCase()) ||
      img.description?.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      categoryFilter === "all" || img.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading Gallery...</p>
        </div>
      </div>
    );
  }

  // Check permissions
  const canUpload = role === "super_user" || role === "manager";
  const canEdit = role === "super_user" || role === "manager";
  const canDelete = role === "super_user" || role === "manager";

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gallery</h1>
          <p className="text-gray-600 mt-1">
            Manage organization photos and media
          </p>
        </div>

        {canUpload && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-700 hover:bg-green-800 text-white font-semibold rounded-xl shadow-lg shadow-green-700/30 transition"
          >
            <Upload className="w-5 h-5" />
            Upload Image
          </motion.button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-600 font-medium">Total Images</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {images.length}
          </p>
        </div>
        {CATEGORIES.slice(0, 3).map((cat) => (
          <div
            key={cat}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
          >
            <p className="text-sm text-gray-600 font-medium">{cat}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {images.filter((img) => img.category === cat).length}
            </p>
          </div>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title or description..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-lg transition ${
              viewMode === "grid"
                ? "bg-green-100 text-green-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Grid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-lg transition ${
              viewMode === "list"
                ? "bg-green-100 text-green-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Gallery Grid/List */}
      {filteredImages.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
          <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No Images Found
          </h3>
          <p className="text-gray-600">
            {search || categoryFilter !== "all"
              ? "Try adjusting your filters"
              : "Upload your first image to get started"}
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredImages.map((image) => (
            <motion.div
              key={image.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all overflow-hidden group"
            >
              {/* Image */}
              <div className="relative aspect-square overflow-hidden bg-gray-100">
                <Image
                  src={image.image_url}
                  alt={image.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 left-0 right-0 p-4 flex gap-2">
                    <button
                      onClick={() => setViewImage(image)}
                      className="flex-1 py-2 bg-white/90 hover:bg-white rounded-lg text-sm font-medium transition flex items-center justify-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                    {canEdit && (
                      <button
                        onClick={() => setEditImage(image)}
                        className="p-2 bg-white/90 hover:bg-white rounded-lg transition"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => setDeleteImage(image)}
                        className="p-2 bg-red-500/90 hover:bg-red-500 text-white rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-gray-900 line-clamp-1">
                    {image.title}
                  </h3>
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-lg whitespace-nowrap">
                    {image.category}
                  </span>
                </div>
                {image.description && (
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                    {image.description}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  {format(new Date(image.created_at), "MMM dd, yyyy")}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Image
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Title
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Date
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredImages.map((image) => (
                  <tr key={image.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                        <Image
                          src={image.image_url}
                          alt={image.title}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{image.title}</p>
                      {image.description && (
                        <p className="text-sm text-gray-600 line-clamp-1">
                          {image.description}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-lg">
                        {image.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {format(new Date(image.created_at), "MMM dd, yyyy")}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setViewImage(image)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canEdit && (
                          <button
                            onClick={() => setEditImage(image)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => setDeleteImage(image)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gradient-to-br from-gray-900/60 via-gray-800/40 to-gray-900/60 backdrop-blur-md"
              onClick={() => !uploading && setShowUploadModal(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Upload Image
                  </h2>
                  <button
                    onClick={() => !uploading && setShowUploadModal(false)}
                    disabled={uploading}
                    className="p-2 hover:bg-gray-100 rounded-full transition disabled:opacity-50"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleUpload} className="space-y-6">
                  {/* File Upload */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Select Image
                    </label>
                    <div
                      className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition ${
                        previewUrl
                          ? "border-green-500 bg-green-50"
                          : "border-gray-300 hover:border-green-500 hover:bg-gray-50"
                      } ${uploading ? "pointer-events-none opacity-50" : ""}`}
                      onClick={() =>
                        !uploading &&
                        document.getElementById("fileInput").click()
                      }
                    >
                      {previewUrl ? (
                        <div className="space-y-4">
                          <div className="relative w-full h-64 rounded-xl overflow-hidden">
                            <Image
                              src={previewUrl}
                              alt="Preview"
                              fill
                              className="object-contain"
                            />
                          </div>
                          {originalSize > 0 && (
                            <div className="text-sm text-gray-600">
                              <p>
                                Original: {formatFileSize(originalSize)} →
                                Optimized: {formatFileSize(compressedSize)}
                              </p>
                              <p className="text-green-600 font-medium">
                                {Math.round(
                                  ((originalSize - compressedSize) /
                                    originalSize) *
                                    100
                                )}
                                % smaller
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <>
                          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600 font-medium">
                            Click to select an image
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            PNG, JPG, WEBP up to 10MB (auto-optimized)
                          </p>
                        </>
                      )}
                    </div>
                    <input
                      id="fileInput"
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      disabled={uploading}
                      className="hidden"
                    />
                  </div>

                  {/* Upload Progress */}
                  {uploadProgress > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Uploading...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${uploadProgress}%` }}
                          className="h-full bg-green-600 rounded-full"
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={uploadForm.title}
                      onChange={(e) =>
                        setUploadForm({ ...uploadForm, title: e.target.value })
                      }
                      required
                      disabled={uploading}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none disabled:opacity-50"
                      placeholder="Enter image title"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={uploadForm.description}
                      onChange={(e) =>
                        setUploadForm({
                          ...uploadForm,
                          description: e.target.value,
                        })
                      }
                      rows={3}
                      disabled={uploading}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none resize-none disabled:opacity-50"
                      placeholder="Enter image description (optional)"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={uploadForm.category}
                      onChange={(e) =>
                        setUploadForm({
                          ...uploadForm,
                          category: e.target.value,
                        })
                      }
                      disabled={uploading}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none disabled:opacity-50"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowUploadModal(false)}
                      disabled={uploading}
                      className="flex-1 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-semibold transition disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={uploading || !uploadForm.file}
                      className="flex-1 py-3 bg-green-700 hover:bg-green-800 text-white rounded-xl font-semibold shadow-lg shadow-green-700/30 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-5 h-5" />
                          Upload Image
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-sm"
              onClick={() => setViewImage(null)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            >
              <div className="relative h-[60vh] bg-gray-900">
                <Image
                  src={viewImage.image_url}
                  alt={viewImage.title}
                  fill
                  className="object-contain"
                />
                <button
                  onClick={() => setViewImage(null)}
                  className="absolute top-4 right-4 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-sm transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {viewImage.title}
                    </h3>
                    <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-lg">
                      {viewImage.category}
                    </span>
                  </div>
                  <a
                    href={viewImage.image_url}
                    download
                    className="p-3 bg-green-100 hover:bg-green-200 text-green-700 rounded-xl transition"
                  >
                    <Download className="w-5 h-5" />
                  </a>
                </div>

                {viewImage.description && (
                  <p className="text-gray-600 mb-4">{viewImage.description}</p>
                )}

                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(viewImage.created_at), "PPP")}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gradient-to-br from-gray-900/60 via-gray-800/40 to-gray-900/60 backdrop-blur-md"
              onClick={() => setEditImage(null)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Edit Image Details
                  </h2>
                  <button
                    onClick={() => setEditImage(null)}
                    className="p-2 hover:bg-gray-100 rounded-full transition"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleEdit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      value={editImage.title}
                      onChange={(e) =>
                        setEditImage({ ...editImage, title: e.target.value })
                      }
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={editImage.description || ""}
                      onChange={(e) =>
                        setEditImage({
                          ...editImage,
                          description: e.target.value,
                        })
                      }
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={editImage.category}
                      onChange={(e) =>
                        setEditImage({
                          ...editImage,
                          category: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setEditImage(null)}
                      className="flex-1 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-semibold transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-green-700 hover:bg-green-800 text-white rounded-xl font-semibold shadow-lg shadow-green-700/30 transition"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {deleteImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gradient-to-br from-red-900/40 via-gray-900/60 to-red-900/40 backdrop-blur-md"
              onClick={() => setDeleteImage(null)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full p-8"
            >
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-100">
                  <Trash2 className="w-10 h-10 text-red-600" />
                </div>

                <h3 className="text-2xl font-bold text-gray-900">
                  Delete Image?
                </h3>

                <p className="text-gray-600 mt-4 leading-relaxed">
                  Are you sure you want to permanently delete{" "}
                  <span className="font-bold text-gray-900">
                    {deleteImage.title}
                  </span>
                  ?
                </p>

                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-800 font-semibold">
                    ⚠️ This action cannot be undone
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setDeleteImage(null)}
                  className="flex-1 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl font-semibold shadow-lg shadow-red-600/30 transition"
                >
                  Delete Permanently
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
