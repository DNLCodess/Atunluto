// lib/utils/imageProcessing.js

/**
 * Resizes and compresses an image file using Canvas API.
 * @param {File} file - Source image file
 * @param {number} maxWidth - Maximum width in pixels
 * @param {number} quality - JPEG quality 0-1
 * @param {string} [namePrefix] - Optional filename prefix
 * @returns {Promise<File>} Compressed image file
 */
export function resizeImage(
  file,
  maxWidth = 1920,
  quality = 0.8,
  namePrefix = "",
) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target.result;

      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob)
              return reject(new Error("Canvas to Blob conversion failed"));
            resolve(
              new File([blob], `${namePrefix}${file.name}`, {
                type: "image/jpeg",
                lastModified: Date.now(),
              }),
            );
          },
          "image/jpeg",
          quality,
        );
      };

      img.onerror = () => reject(new Error("Failed to load image"));
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
  });
}

/** Compress to display quality (1920px max) */
export const compressImage = (file) => resizeImage(file, 1920, 0.8);

/** Generate thumbnail (800px max) */
export const generateThumbnail = (file) =>
  resizeImage(file, 800, 0.7, "thumb_");

/** Format bytes to human-readable string */
export function formatFileSize(bytes) {
  if (!bytes) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

/** Calculate compression saving as a percentage string */
export function compressionSaving(original, compressed) {
  if (!original || !compressed) return null;
  return Math.round(((original - compressed) / original) * 100);
}
