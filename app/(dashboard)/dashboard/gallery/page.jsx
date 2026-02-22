// app/dashboard/gallery/page.jsx
"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { useGallery } from "@/hooks/use-gallery";
import { useAuth } from "@/hooks/useAuth";
import {
  compressImage,
  generateThumbnail,
  formatFileSize,
  compressionSaving,
} from "@/utils/image-processing";
import {
  Upload,
  Image as ImageIcon,
  Trash2,
  Edit2,
  X,
  Search,
  Grid,
  List,
  Eye,
  Download,
  Calendar,
  Loader2,
} from "lucide-react";
import { format as dateFmt } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export const CATEGORIES = [
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

// ─── Role helpers ─────────────────────────────────────────────────────────────
const canManageGallery = (role) => ["super_user", "manager"].includes(role);

// ─── Inline error banner ──────────────────────────────────────────────────────
function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="p-4 rounded-xl border flex items-center gap-3 font-poppins text-sm"
      style={{
        backgroundColor: "#FFEBEE",
        borderColor: "#e53935",
        color: "#c62828",
      }}
      role="alert"
    >
      <svg
        className="w-5 h-5 flex-shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      {message}
    </motion.div>
  );
}

// ─── Skeletons ────────────────────────────────────────────────────────────────
function GalleryCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
      <div className="aspect-square bg-gray-200" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
      </div>
    </div>
  );
}

// ─── Upload Modal ─────────────────────────────────────────────────────────────
function UploadModal({ onClose, onUpload, isUploading, uploadError, userId }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Events",
  });
  const [file, setFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [originalSize, setOriginalSize] = useState(0);
  const [compressedSize, setCompressedSize] = useState(0);
  const [processingFile, setProcessingFile] = useState(false);
  const [fileError, setFileError] = useState(null);

  const handleFileSelect = async (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    if (!selected.type.startsWith("image/")) {
      setFileError("Please select an image file.");
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      setFileError("File must be less than 10MB.");
      return;
    }

    setFileError(null);
    setProcessingFile(true);
    setOriginalSize(selected.size);

    try {
      const [compressed, thumb] = await Promise.all([
        compressImage(selected),
        generateThumbnail(selected),
      ]);

      setFile(compressed);
      setThumbnailFile(thumb);
      setCompressedSize(compressed.size);

      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result);
      reader.readAsDataURL(thumb);
    } catch {
      setFileError("Failed to process image. Please try another file.");
    } finally {
      setProcessingFile(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file || !form.title) return;
    onUpload({ file, thumbnailFile, ...form, userId }, { onSuccess: onClose });
  };

  const saving = compressionSaving(originalSize, compressedSize);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 backdrop-blur-md"
        style={{ background: "rgba(17,24,39,0.6)" }}
        onClick={() => !isUploading && onClose()}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-extrabold text-gray-900 font-montserrat">
              Upload Image
            </h2>
            <button
              onClick={() => !isUploading && onClose()}
              disabled={isUploading}
              className="p-2 hover:bg-gray-100 rounded-full transition disabled:opacity-50"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <AnimatePresence>
            {(uploadError || fileError) && (
              <ErrorBanner message={uploadError || fileError} />
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            {/* Drop zone */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 font-poppins">
                Select Image *
              </label>
              <div
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition ${
                  previewUrl
                    ? "border-green-500 bg-green-50"
                    : "border-gray-300 hover:border-green-500 hover:bg-gray-50"
                } ${isUploading || processingFile ? "pointer-events-none opacity-50" : ""}`}
                onClick={() =>
                  document.getElementById("galleryFileInput").click()
                }
              >
                {processingFile ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-10 h-10 text-green-600 animate-spin" />
                    <p className="text-sm text-gray-500 font-poppins">
                      Optimising image...
                    </p>
                  </div>
                ) : previewUrl ? (
                  <div className="space-y-3">
                    <div className="relative w-full h-56 rounded-xl overflow-hidden">
                      <Image
                        src={previewUrl}
                        alt="Preview"
                        fill
                        className="object-contain"
                      />
                    </div>
                    {saving !== null && (
                      <div className="text-sm font-poppins text-gray-600">
                        <span>
                          {formatFileSize(originalSize)} →{" "}
                          {formatFileSize(compressedSize)}{" "}
                        </span>
                        <span className="text-green-600 font-semibold">
                          ({saving}% smaller)
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium font-poppins">
                      Click to select an image
                    </p>
                    <p className="text-sm text-gray-500 mt-1 font-poppins">
                      PNG, JPG, WEBP up to 10MB (auto-optimised)
                    </p>
                  </>
                )}
              </div>
              <input
                id="galleryFileInput"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                disabled={isUploading}
                className="hidden"
              />
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 font-poppins">
                Title *
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                required
                disabled={isUploading}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 outline-none disabled:opacity-50 font-poppins text-sm"
                placeholder="Enter image title"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 font-poppins">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                rows={3}
                disabled={isUploading}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 outline-none resize-none disabled:opacity-50 font-poppins text-sm"
                placeholder="Optional description"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 font-poppins">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category: e.target.value }))
                }
                disabled={isUploading}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 outline-none disabled:opacity-50 font-poppins text-sm"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isUploading}
                className="flex-1 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-semibold font-poppins transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUploading || !file || !form.title}
                className="flex-1 py-3 text-white rounded-xl font-semibold font-poppins shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ backgroundColor: "#1B5E20" }}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" /> Upload Image
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────
function EditModal({ image, onClose, onUpdate, isUpdating, updateError }) {
  const [form, setForm] = useState({
    id: image.id,
    title: image.title,
    description: image.description || "",
    category: image.category,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(form, { onSuccess: onClose });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 backdrop-blur-md"
        style={{ background: "rgba(17,24,39,0.6)" }}
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full"
      >
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-extrabold text-gray-900 font-montserrat">
              Edit Image
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <AnimatePresence>
            {updateError && <ErrorBanner message={updateError} />}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-5 mt-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 font-poppins">
                Title *
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 outline-none font-poppins text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 font-poppins">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 outline-none resize-none font-poppins text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 font-poppins">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category: e.target.value }))
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 outline-none font-poppins text-sm"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-4 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-semibold font-poppins transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdating}
                className="flex-1 py-3 text-white rounded-xl font-semibold font-poppins shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ backgroundColor: "#1B5E20" }}
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

// ─── View Modal ───────────────────────────────────────────────────────────────
function ViewModal({ image, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/90 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="relative bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        <div className="relative h-[60vh] bg-gray-900">
          <Image
            src={image.full_image_url || image.image_url}
            alt={image.title}
            fill
            className="object-contain"
            sizes="(max-width: 896px) 100vw, 896px"
          />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-sm transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-8">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h3 className="text-2xl font-extrabold text-gray-900 font-montserrat">
                {image.title}
              </h3>
              <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-lg font-poppins">
                {image.category}
              </span>
            </div>
            <a
              href={image.full_image_url || image.image_url}
              download
              className="p-3 bg-green-100 hover:bg-green-200 text-green-700 rounded-xl transition"
              title="Download"
            >
              <Download className="w-5 h-5" />
            </a>
          </div>
          {image.description && (
            <p className="text-gray-600 mb-4 font-poppins text-sm">
              {image.description}
            </p>
          )}
          <div className="flex items-center gap-2 text-sm text-gray-500 font-poppins">
            <Calendar className="w-4 h-4" />
            {format(new Date(image.created_at), "PPP")}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Delete Modal ─────────────────────────────────────────────────────────────
function DeleteModal({ image, isDeleting, deleteError, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 backdrop-blur-md"
        style={{ background: "rgba(127,29,29,0.4)" }}
        onClick={() => !isDeleting && onCancel()}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full p-8"
      >
        <AnimatePresence>
          {deleteError && <ErrorBanner message={deleteError} />}
        </AnimatePresence>
        <div className="text-center mb-8 mt-2">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-100">
            <Trash2 className="w-10 h-10 text-red-600" />
          </div>
          <h3 className="text-2xl font-extrabold text-gray-900 font-montserrat">
            Delete Image?
          </h3>
          <p className="text-gray-600 mt-4 leading-relaxed font-poppins text-sm">
            Permanently delete{" "}
            <span className="font-bold text-gray-900">{image.title}</span>? Both
            the thumbnail and full-resolution files will be removed.
          </p>
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-800 font-semibold font-poppins">
              ⚠️ This action cannot be undone
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-semibold font-poppins transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-semibold font-poppins shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{" "}
                Deleting...
              </>
            ) : (
              "Delete Permanently"
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AdminGalleryPage() {
  const { user, role } = useAuth();
  const {
    images,
    isLoading,
    fetchError,
    uploadImage,
    isUploading,
    uploadError,
    updateImage,
    isUpdating,
    updateError,
    deleteImage,
    isDeleting,
    deleteError,
  } = useGallery();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [viewMode, setViewMode] = useState("grid");

  const [showUpload, setShowUpload] = useState(false);
  const [viewImageModal, setViewImageModal] = useState(null);
  const [editImageModal, setEditImageModal] = useState(null);
  const [deleteImageModal, setDeleteImageModal] = useState(null);

  const canManage = canManageGallery(role);

  const filteredImages = useMemo(() => {
    const q = search.toLowerCase();
    return images.filter((img) => {
      if (
        q &&
        !(
          img.title.toLowerCase().includes(q) ||
          img.description?.toLowerCase().includes(q)
        )
      )
        return false;
      if (categoryFilter !== "all" && img.category !== categoryFilter)
        return false;
      return true;
    });
  }, [images, search, categoryFilter]);

  // Category stats — top 3 for the stats bar
  const topCategories = useMemo(
    () =>
      CATEGORIES.slice(0, 3).map((cat) => ({
        label: cat,
        count: images.filter((img) => img.category === cat).length,
      })),
    [images],
  );

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 font-montserrat">
            Gallery
          </h1>
          <p className="text-gray-500 mt-1 font-poppins text-sm">
            Manage organisation photos and media
          </p>
        </div>
        {canManage && (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowUpload(true)}
            className="inline-flex items-center gap-2 px-6 py-3 text-white font-semibold font-poppins rounded-xl shadow-lg transition"
            style={{ backgroundColor: "#1B5E20" }}
          >
            <Upload className="w-5 h-5" />
            Upload Image
          </motion.button>
        )}
      </div>

      {/* Fetch error */}
      <AnimatePresence>
        {fetchError && (
          <ErrorBanner message={`Failed to load gallery: ${fetchError}`} />
        )}
      </AnimatePresence>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-500 font-poppins font-medium">
            Total Images
          </p>
          {isLoading ? (
            <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mt-2" />
          ) : (
            <p className="text-3xl font-extrabold text-gray-900 mt-2 font-montserrat">
              {images.length}
            </p>
          )}
        </div>
        {topCategories.map(({ label, count }) => (
          <div
            key={label}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
          >
            <p className="text-sm text-gray-500 font-poppins font-medium">
              {label}
            </p>
            {isLoading ? (
              <div className="h-8 w-12 bg-gray-200 rounded animate-pulse mt-2" />
            ) : (
              <p className="text-3xl font-extrabold text-gray-900 mt-2 font-montserrat">
                {count}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title or description..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 outline-none font-poppins text-sm"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 outline-none font-poppins text-sm"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 mt-4">
          {[
            { mode: "grid", Icon: Grid },
            { mode: "list", Icon: List },
          ].map(({ mode, Icon }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`p-2 rounded-lg transition ${viewMode === mode ? "bg-green-100 text-green-700" : "text-gray-600 hover:bg-gray-100"}`}
            >
              <Icon className="w-5 h-5" />
            </button>
          ))}
          <span className="text-xs text-gray-400 font-poppins ml-2">
            {isLoading
              ? "—"
              : `${filteredImages.length} image${filteredImages.length !== 1 ? "s" : ""}`}
          </span>
        </div>
      </div>

      {/* Gallery content */}
      {isLoading ? (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              : "space-y-3"
          }
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <GalleryCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredImages.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
          <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2 font-montserrat">
            No Images Found
          </h3>
          <p className="text-gray-500 font-poppins text-sm">
            {search || categoryFilter !== "all"
              ? "Try adjusting your filters."
              : "Upload your first image to get started."}
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredImages.map((image) => (
            <motion.div
              key={image.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all overflow-hidden group"
            >
              <div className="relative aspect-square overflow-hidden bg-gray-100">
                <Image
                  src={image.image_url}
                  alt={image.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 left-0 right-0 p-3 flex gap-2">
                    <button
                      onClick={() => setViewImageModal(image)}
                      className="flex-1 py-2 bg-white/90 hover:bg-white rounded-lg text-xs font-medium font-poppins transition flex items-center justify-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                    {canManage && (
                      <>
                        <button
                          onClick={() => setEditImageModal(image)}
                          className="p-2 bg-white/90 hover:bg-white rounded-lg transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteImageModal(image)}
                          className="p-2 bg-red-500/90 hover:bg-red-500 text-white rounded-lg transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900 line-clamp-1 font-poppins text-sm">
                    {image.title}
                  </h3>
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-lg whitespace-nowrap font-poppins flex-shrink-0">
                    {image.category}
                  </span>
                </div>
                {image.description && (
                  <p className="text-xs text-gray-500 line-clamp-2 mb-2 font-poppins">
                    {image.description}
                  </p>
                )}
                <p className="text-xs text-gray-400 font-poppins">
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
                  {["Image", "Title", "Category", "Date", "Actions"].map(
                    (h) => (
                      <th
                        key={h}
                        className={`px-6 py-4 text-sm font-semibold text-gray-900 font-poppins ${h === "Actions" ? "text-right" : "text-left"}`}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredImages.map((image) => (
                  <tr key={image.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        <Image
                          src={image.image_url}
                          alt={image.title}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900 font-poppins text-sm">
                        {image.title}
                      </p>
                      {image.description && (
                        <p className="text-xs text-gray-500 line-clamp-1 font-poppins mt-0.5">
                          {image.description}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-lg font-poppins">
                        {image.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-poppins">
                      {format(new Date(image.created_at), "MMM dd, yyyy")}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setViewImageModal(image)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canManage && (
                          <>
                            <button
                              onClick={() => setEditImageModal(image)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteImageModal(image)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
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

      {/* Modals */}
      <AnimatePresence>
        {showUpload && (
          <UploadModal
            onClose={() => setShowUpload(false)}
            onUpload={uploadImage}
            isUploading={isUploading}
            uploadError={uploadError}
            userId={user?.id}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewImageModal && (
          <ViewModal
            image={viewImageModal}
            onClose={() => setViewImageModal(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editImageModal && (
          <EditModal
            image={editImageModal}
            onClose={() => setEditImageModal(null)}
            onUpdate={updateImage}
            isUpdating={isUpdating}
            updateError={updateError}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteImageModal && (
          <DeleteModal
            image={deleteImageModal}
            isDeleting={isDeleting}
            deleteError={deleteError}
            onConfirm={() =>
              deleteImage(deleteImageModal, {
                onSuccess: () => setDeleteImageModal(null),
              })
            }
            onCancel={() => !isDeleting && setDeleteImageModal(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
