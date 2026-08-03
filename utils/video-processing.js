// lib/utils/videoProcessing.js

const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 100MB
const MAX_VIDEO_DURATION_SECONDS = 180; // 3 minutes

/**
 * Reads a video file's duration (in seconds) without uploading it, by
 * loading it into a detached <video> element and reading its metadata.
 */
function readVideoDuration(file) {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error("Failed to read video metadata."));
    };
    video.src = URL.createObjectURL(file);
  });
}

/**
 * Validates a video file against type/size/duration limits.
 * @param {File} file
 * @returns {Promise<{valid: boolean, error: string|null, duration?: number}>}
 */
export async function validateVideoFile(file) {
  if (!file.type.startsWith("video/")) {
    return { valid: false, error: "Please select a video file." };
  }
  if (file.size >= MAX_VIDEO_BYTES) {
    return { valid: false, error: "Video must be less than 100MB." };
  }

  let duration;
  try {
    duration = await readVideoDuration(file);
  } catch {
    return {
      valid: false,
      error: "Could not read video file. Please try another file.",
    };
  }

  if (duration > MAX_VIDEO_DURATION_SECONDS) {
    return { valid: false, error: "Video must be 3 minutes or shorter." };
  }

  return { valid: true, error: null, duration };
}

/** Format seconds as "M:SS", e.g. 134 -> "2:14" */
export function formatDuration(totalSeconds) {
  const seconds = Math.round(totalSeconds || 0);
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

/** Cloudinary poster-frame URL, derived from the video's public_id — no separate upload. */
export function buildPosterUrl(cloudName, publicId) {
  return `https://res.cloudinary.com/${cloudName}/video/upload/so_0,w_800,c_fill,q_auto,f_jpg/${publicId}.jpg`;
}

/** Cloudinary playback URL with automatic format/quality selection per requesting browser. */
export function buildVideoUrl(cloudName, publicId) {
  return `https://res.cloudinary.com/${cloudName}/video/upload/f_auto,q_auto/${publicId}`;
}
