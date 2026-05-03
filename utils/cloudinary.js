/**
 * Inserts Cloudinary transformation parameters into a stored upload URL so
 * Cloudinary's CDN serves a pre-resized, format-optimised image instead of
 * the original full-resolution file.
 *
 * Passes non-Cloudinary URLs through unchanged so components don't need to
 * know whether an image came from Cloudinary or elsewhere.
 */
export function getCldImageUrl(src, { width, height, crop = "fill" } = {}) {
  if (!src?.includes("res.cloudinary.com")) return src ?? "";
  const parts = [
    "f_auto",
    "q_auto",
    width  && `w_${width}`,
    height && `h_${height}`,
    (width || height) && `c_${crop}`,
  ]
    .filter(Boolean)
    .join(",");
  return src.replace("/upload/", `/upload/${parts}/`);
}
