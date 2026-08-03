# Gallery Video Upload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let content managers upload short video clips to the gallery, and let public visitors browse and watch them in a distinct, performant "Videos" tab, without changing how the app is deployed on Plesk.

**Architecture:** Extend the existing "browser uploads directly to Cloudinary via a signed URL, Supabase stores the resulting URL" pattern (already used for photos) to `resource_type: "video"`. No video bytes ever pass through the Next.js/Plesk process. Poster frames and optimized playback are Cloudinary URL transformations computed on demand (no eager transforms, to protect the free-tier credit budget), not separate uploads.

**Tech Stack:** Next.js 16 (App Router), React 19, Supabase (Postgres + JS client), Cloudinary (signed uploads), TanStack Query, Tailwind CSS, Framer Motion, lucide-react. No new dependencies are introduced by this plan.

**Source spec:** `docs/superpowers/specs/2026-08-03-gallery-video-upload-design.md`

## Global Constraints

- No new npm dependencies (native `<video>` + Cloudinary `f_auto,q_auto` URL flags only — no hls.js/video.js).
- No server-side video transcoding, no ffmpeg — Plesk is not a media-processing host.
- Video cap: 100MB file size, 180 seconds (3 minutes) duration, enforced client-side before upload.
- Video bytes never pass through the Node process on Plesk — browser uploads directly to Cloudinary; playback streams directly from Cloudinary's CDN.
- Cloudinary is on the free tier: do not add eager/upload-time transformations. Poster frames and delivery format are on-demand transformation URLs, computed from `public_id`.
- Existing photo upload/edit/delete behavior must not regress — prefer additive changes over rewriting working photo code paths.
- This repo has **no automated test framework** (no jest/vitest configured, no `test` script in `package.json`). Verification steps in this plan are manual QA via the running dev server, plus `npm run lint` and `npm run build` where applicable — this mirrors the project's existing conventions rather than introducing new test tooling as unrelated scope.

---

### Task 1: Database migration — add video columns to `gallery`

**Files:**
- Create: `supabase/gallery-video-schema.sql`

**Interfaces:**
- Produces: `gallery.media_type` (text, `'image'|'video'`, default `'image'`), `gallery.video_url` (text, nullable), `gallery.poster_url` (text, nullable), `gallery.duration_seconds` (numeric, nullable). All later tasks that read/write the `gallery` table depend on these columns existing.

- [ ] **Step 1: Write the migration SQL**

Create `supabase/gallery-video-schema.sql`:

```sql
-- ═══════════════════════════════════════════════════════════════════════
-- GALLERY VIDEO SUPPORT
-- Adds video columns to the existing `gallery` table so a row can hold
-- either a photo (existing image_url/full_image_url columns) or a video
-- (video_url + poster_url, both Cloudinary URLs). media_type discriminates
-- which shape a row uses. poster_url and video_url are derived Cloudinary
-- transformation URLs computed at upload time from the uploaded asset's
-- public_id — no separate thumbnail upload, no eager transforms.
--
-- Run this once in the Supabase SQL editor.
-- ═══════════════════════════════════════════════════════════════════════

alter table public.gallery
  add column if not exists media_type text not null default 'image',
  add column if not exists video_url text,
  add column if not exists poster_url text,
  add column if not exists duration_seconds numeric;

alter table public.gallery
  drop constraint if exists gallery_media_type_check;

alter table public.gallery
  add constraint gallery_media_type_check
  check (media_type in ('image', 'video'));
```

- [ ] **Step 2: Run the migration**

Open the Supabase SQL editor for this project and run the contents of
`supabase/gallery-video-schema.sql`.

- [ ] **Step 3: Verify the columns exist**

Run this query in the same SQL editor:

```sql
select column_name, data_type, column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'gallery'
order by ordinal_position;
```

Expected: the result includes four new rows — `media_type` (default
`'image'::text`), `video_url`, `poster_url`, `duration_seconds` — alongside
the existing columns (`id`, `title`, `description`, `category`,
`image_url`, `full_image_url`, `storage_path`, `full_storage_path`,
`uploaded_by`, `created_at`). Confirm existing rows all show
`media_type = 'image'`.

- [ ] **Step 4: Commit**

```bash
git add supabase/gallery-video-schema.sql
git commit -m "feat: add video columns to gallery table"
```

---

### Task 2: Fix Cloudinary delete to support per-asset resource type

**Context:** `app/api/cloudinary-delete/route.js` currently calls
`cloudinary.uploader.destroy(id)` with no `resource_type`, which defaults
to `"image"`. Cloudinary's `destroy()` does not throw when the
`resource_type` doesn't match the asset — it silently returns
`{result: "not found"}`. Left unfixed, deleting a video gallery row would
never actually remove the video file from Cloudinary, leaking storage on
the free-tier budget forever. This must be fixed before video upload
exists so deletion is correct from the start.

**Files:**
- Modify: `app/api/cloudinary-delete/route.js`
- Modify: `hooks/use-gallery.js:88-110` (`deleteImageFn`)

**Interfaces:**
- Consumes: `cloudinary` export from `@/lib/cloudinary` (existing).
- Produces: `POST /api/cloudinary-delete` now expects body
  `{ assets: [{ publicId: string, resourceType?: "image" | "video" }] }`
  (was `{ publicIds: string[] }`). `deleteImageFn(image)` in
  `hooks/use-gallery.js` builds this new shape from
  `image.storage_path` / `image.full_storage_path` / `image.media_type`.

- [ ] **Step 1: Update the delete route**

Replace the full contents of `app/api/cloudinary-delete/route.js` with:

```js
import { createClient } from "@/supabase/server";
import { cloudinary } from "@/lib/cloudinary";

export async function POST(request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return Response.json({ error: "Unauthorised." }, { status: 401 });

    const { assets } = await request.json();
    if (!Array.isArray(assets) || assets.length === 0)
      return Response.json(
        { error: "assets array is required." },
        { status: 400 },
      );

    const results = await Promise.allSettled(
      assets.map(({ publicId, resourceType }) =>
        cloudinary.uploader.destroy(publicId, {
          resource_type: resourceType || "image",
        }),
      ),
    );

    const failed = results
      .map((r, i) => (r.status === "rejected" ? assets[i].publicId : null))
      .filter(Boolean);

    if (failed.length > 0) {
      console.error("Cloudinary delete failed for:", failed);
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error("Cloudinary delete error:", err);
    return Response.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 2: Update `deleteImageFn` in the gallery hook**

In `hooks/use-gallery.js`, replace the existing `deleteImageFn` (lines
88-110):

```js
async function deleteImageFn(image) {
  const publicIds = [image.storage_path, image.full_storage_path].filter(Boolean);

  if (publicIds.length > 0) {
    const res = await fetch("/api/cloudinary-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicIds }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to delete images from storage.");
    }
  }

  const { error: dbError } = await supabase
    .from("gallery")
    .delete()
    .eq("id", image.id);

  if (dbError) throw dbError;
  return image.id;
}
```

with:

```js
async function deleteImageFn(image) {
  const isVideo = image.media_type === "video";
  const assets = [
    image.storage_path && {
      publicId: image.storage_path,
      resourceType: isVideo ? "video" : "image",
    },
    image.full_storage_path && {
      publicId: image.full_storage_path,
      resourceType: "image",
    },
  ].filter(Boolean);

  if (assets.length > 0) {
    const res = await fetch("/api/cloudinary-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assets }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to delete media from storage.");
    }
  }

  const { error: dbError } = await supabase
    .from("gallery")
    .delete()
    .eq("id", image.id);

  if (dbError) throw dbError;
  return image.id;
}
```

Note: a video row only ever populates `storage_path` (its single asset),
so `full_storage_path` is `undefined`/`null` for video rows and gets
filtered out — `assets` ends up with exactly one entry for videos.

- [ ] **Step 3: Verify the route accepts the new shape**

Start the dev server (`npm run dev`), log into `/dashboard/gallery` as a
`super_user` or `manager`, open the browser devtools console on that page,
and run:

```js
fetch("/api/cloudinary-delete", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    assets: [{ publicId: "nonexistent/test-id", resourceType: "video" }],
  }),
})
  .then((r) => r.json())
  .then(console.log);
```

Expected: logs `{success: true}` with no 401/400/500 — this exercises the
authenticated route and confirms `resourceType` is accepted without
throwing (Cloudinary reports "not found" for the fake ID internally, which
the route treats as success, matching current behavior for real IDs too).

- [ ] **Step 4: Regression-check existing photo delete still works**

In the same dashboard gallery page, delete an existing test photo through
the UI (Delete button → confirm). Expected: the photo disappears from the
grid and the request succeeds — confirms the new `assets` shape didn't
break the existing image path (which now sends
`resourceType: "image"` explicitly for both its `storage_path` and
`full_storage_path` entries).

- [ ] **Step 5: Commit**

```bash
git add app/api/cloudinary-delete/route.js hooks/use-gallery.js
git commit -m "fix: pass resource_type through Cloudinary delete so videos actually get removed"
```

---

### Task 3: Video utility helpers + video upload data layer

**Files:**
- Create: `utils/video-processing.js`
- Modify: `hooks/use-gallery.js`

**Interfaces:**
- Consumes: nothing new (browser `File`/`HTMLVideoElement` APIs only).
- Produces:
  - `utils/video-processing.js` exports:
    - `validateVideoFile(file): Promise<{valid: boolean, error: string|null, duration?: number}>`
    - `formatDuration(totalSeconds: number): string` — e.g. `134` → `"2:14"`
    - `buildPosterUrl(cloudName: string, publicId: string): string`
    - `buildVideoUrl(cloudName: string, publicId: string): string`
  - `hooks/use-gallery.js` exposes from `useGallery()`: `uploadVideo`
    (mutate fn, same call shape as `uploadImage`:
    `uploadVideo({file, title, description, category, userId}, {onSuccess})`),
    `isUploadingVideo` (boolean), `uploadVideoError` (string|null).

- [ ] **Step 1: Create the video utility module**

Create `utils/video-processing.js`:

```js
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
  if (file.size > MAX_VIDEO_BYTES) {
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
```

- [ ] **Step 2: Add the video Cloudinary upload function to the hook**

In `hooks/use-gallery.js`, add this import at the top (after the existing
`createClient` import):

```js
import { buildPosterUrl, buildVideoUrl } from "@/utils/video-processing";
```

Then add a new function right after the existing `cloudinaryUpload`
function (after line 20):

```js
async function cloudinaryVideoUpload(file, { signature, timestamp, folder, cloudName, apiKey }) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("api_key", apiKey);
  fd.append("timestamp", String(timestamp));
  fd.append("signature", signature);
  fd.append("folder", folder);
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
    { method: "POST", body: fd },
  );
  if (!res.ok) throw new Error("Video upload failed.");
  return res.json();
}
```

- [ ] **Step 3: Add the new columns to `GALLERY_FIELDS`**

Replace the existing `GALLERY_FIELDS` (lines 24-35):

```js
const GALLERY_FIELDS = [
  "id",
  "title",
  "description",
  "category",
  "image_url",
  "full_image_url",
  "storage_path",
  "full_storage_path",
  "uploaded_by",
  "created_at",
].join(", ");
```

with:

```js
const GALLERY_FIELDS = [
  "id",
  "title",
  "description",
  "category",
  "media_type",
  "image_url",
  "full_image_url",
  "video_url",
  "poster_url",
  "duration_seconds",
  "storage_path",
  "full_storage_path",
  "uploaded_by",
  "created_at",
].join(", ");
```

- [ ] **Step 4: Add `uploadVideoFn`**

Add this function right after the existing `uploadImageFn` (after line
74):

```js
async function uploadVideoFn({ file, title, description, category, userId }) {
  const signRes = await fetch("/api/cloudinary-sign?folder=gallery/videos");
  if (!signRes.ok) throw new Error("Failed to get upload credentials.");
  const signParams = await signRes.json();

  const result = await cloudinaryVideoUpload(file, signParams);

  const { data, error: dbError } = await supabase
    .from("gallery")
    .insert({
      title,
      description,
      category,
      media_type: "video",
      video_url: buildVideoUrl(signParams.cloudName, result.public_id),
      poster_url: buildPosterUrl(signParams.cloudName, result.public_id),
      duration_seconds: result.duration ?? null,
      storage_path: result.public_id,
      uploaded_by: userId,
    })
    .select(GALLERY_FIELDS)
    .single();

  if (dbError) throw dbError;
  return data;
}
```

- [ ] **Step 5: Add the video upload mutation and expose it from `useGallery()`**

In the `useGallery()` function body, add this new mutation right after
`uploadMutation` (after line 126):

```js
  const uploadVideoMutation = useMutation({
    mutationFn: uploadVideoFn,
    onSuccess: (newVideo) => {
      queryClient.setQueryData(GALLERY_QUERY_KEY, (old = []) => [newVideo, ...old]);
    },
  });
```

And add these three lines to the object returned by `useGallery()`,
right after the existing `uploadReset: uploadMutation.reset,` line:

```js
    uploadVideo: uploadVideoMutation.mutate,
    isUploadingVideo: uploadVideoMutation.isPending,
    uploadVideoError: uploadVideoMutation.error?.message ?? null,
```

- [ ] **Step 6: Lint**

Run: `npm run lint`
Expected: no errors in `utils/video-processing.js` or `hooks/use-gallery.js`.

- [ ] **Step 7: Commit**

```bash
git add utils/video-processing.js hooks/use-gallery.js
git commit -m "feat: add video upload data layer (Cloudinary + Supabase)"
```

---

### Task 4: Admin upload modal — Photo/Video toggle and video dropzone

**Files:**
- Modify: `app/(dashboard)/dashboard/gallery/page.jsx`

**Interfaces:**
- Consumes: `validateVideoFile`, `formatDuration` from `@/utils/video-processing` (Task 3); `uploadVideo`, `isUploadingVideo`, `uploadVideoError` from `useGallery()` (Task 3).
- Produces: `UploadModal` now accepts additional props `onUploadVideo`,
  `isUploadingVideo`, `uploadVideoError` (all optional-safe — existing
  photo behavior is unchanged when unused).

- [ ] **Step 1: Add new icon and utility imports**

In `app/(dashboard)/dashboard/gallery/page.jsx`, update the lucide-react
import (lines 14-27):

```js
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
```

to:

```js
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
  Video,
} from "lucide-react";
```

Then add this import after the existing `image-processing` import block
(after line 13):

```js
import { validateVideoFile, formatDuration } from "@/utils/video-processing";
```

- [ ] **Step 2: Replace the `UploadModal` function**

Replace the entire `UploadModal` function (currently lines 95-345, from
`function UploadModal({ onClose, onUpload, isUploading, uploadError, userId }) {`
through its closing `}`) with:

```jsx
// ─── Upload Modal ─────────────────────────────────────────────────────────────
function UploadModal({
  onClose,
  onUpload,
  isUploading,
  uploadError,
  onUploadVideo,
  isUploadingVideo,
  uploadVideoError,
  userId,
}) {
  const [mediaType, setMediaType] = useState("image");
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Events",
  });

  // Photo state
  const [file, setFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [originalSize, setOriginalSize] = useState(0);
  const [compressedSize, setCompressedSize] = useState(0);
  const [processingFile, setProcessingFile] = useState(false);
  const [fileError, setFileError] = useState(null);

  // Video state
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [processingVideo, setProcessingVideo] = useState(false);
  const [videoError, setVideoError] = useState(null);

  const isSubmitting = isUploading || isUploadingVideo;

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

  const handleVideoSelect = async (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    setVideoError(null);
    setProcessingVideo(true);

    const result = await validateVideoFile(selected);

    if (!result.valid) {
      setVideoError(result.error);
      setProcessingVideo(false);
      return;
    }

    setVideoFile(selected);
    setVideoDuration(result.duration);
    setVideoPreviewUrl(URL.createObjectURL(selected));
    setProcessingVideo(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mediaType === "video") {
      if (!videoFile || !form.title) return;
      onUploadVideo({ file: videoFile, ...form, userId }, { onSuccess: onClose });
    } else {
      if (!file || !form.title) return;
      onUpload({ file, thumbnailFile, ...form, userId }, { onSuccess: onClose });
    }
  };

  const saving = compressionSaving(originalSize, compressedSize);
  const currentError =
    mediaType === "video" ? uploadVideoError || videoError : uploadError || fileError;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 backdrop-blur-md"
        style={{ background: "rgba(17,24,39,0.6)" }}
        onClick={() => !isSubmitting && onClose()}
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
              Upload Media
            </h2>
            <button
              onClick={() => !isSubmitting && onClose()}
              disabled={isSubmitting}
              className="p-2 hover:bg-gray-100 rounded-full transition disabled:opacity-50"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Photo / Video toggle */}
          <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-xl mb-6 w-fit">
            {[
              { type: "image", label: "Photo", Icon: ImageIcon },
              { type: "video", label: "Video", Icon: Video },
            ].map(({ type, label, Icon }) => (
              <button
                key={type}
                type="button"
                onClick={() => setMediaType(type)}
                disabled={isSubmitting}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold font-poppins transition disabled:opacity-50 ${
                  mediaType === type
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          <AnimatePresence>
            {currentError && <ErrorBanner message={currentError} />}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            {mediaType === "image" ? (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-poppins">
                  Select Image *
                </label>
                <div
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition ${
                    previewUrl
                      ? "border-green-500 bg-green-50"
                      : "border-gray-300 hover:border-green-500 hover:bg-gray-50"
                  } ${isSubmitting || processingFile ? "pointer-events-none opacity-50" : ""}`}
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
                  disabled={isSubmitting}
                  className="hidden"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-poppins">
                  Select Video *
                </label>
                <div
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition ${
                    videoPreviewUrl
                      ? "border-green-500 bg-green-50"
                      : "border-gray-300 hover:border-green-500 hover:bg-gray-50"
                  } ${isSubmitting || processingVideo ? "pointer-events-none opacity-50" : ""}`}
                  onClick={() =>
                    document.getElementById("galleryVideoInput").click()
                  }
                >
                  {processingVideo ? (
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-10 h-10 text-green-600 animate-spin" />
                      <p className="text-sm text-gray-500 font-poppins">
                        Checking video...
                      </p>
                    </div>
                  ) : videoPreviewUrl ? (
                    <div className="space-y-3">
                      <video
                        src={videoPreviewUrl}
                        controls
                        className="w-full h-56 rounded-xl bg-black"
                      />
                      <div className="text-sm font-poppins text-gray-600">
                        <span>{formatFileSize(videoFile.size)}</span>
                        <span className="mx-2">•</span>
                        <span>{formatDuration(videoDuration)}</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 font-medium font-poppins">
                        Click to select a video
                      </p>
                      <p className="text-sm text-gray-500 mt-1 font-poppins">
                        MP4, MOV, WEBM up to 100MB, 3 minutes max
                      </p>
                    </>
                  )}
                </div>
                <input
                  id="galleryVideoInput"
                  type="file"
                  accept="video/*"
                  onChange={handleVideoSelect}
                  disabled={isSubmitting}
                  className="hidden"
                />
              </div>
            )}

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
                disabled={isSubmitting}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 outline-none disabled:opacity-50 font-poppins text-sm"
                placeholder="Enter a title"
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
                disabled={isSubmitting}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 outline-none resize-none disabled:opacity-50 font-poppins text-sm"
                placeholder="Optional description"
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
                disabled={isSubmitting}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 outline-none disabled:opacity-50 font-poppins text-sm"
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
                disabled={isSubmitting}
                className="flex-1 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-semibold font-poppins transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  (mediaType === "video" ? !videoFile : !file) ||
                  !form.title
                }
                className="flex-1 py-3 text-white rounded-xl font-semibold font-poppins shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ backgroundColor: "#1B5E20" }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" /> Upload{" "}
                    {mediaType === "video" ? "Video" : "Image"}
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
```

- [ ] **Step 3: Wire the new hook exports into the page component**

In the `AdminGalleryPage` component, replace the `useGallery()`
destructure (currently lines 606-620):

```js
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
```

with:

```js
  const {
    images,
    isLoading,
    fetchError,
    uploadImage,
    isUploading,
    uploadError,
    uploadVideo,
    isUploadingVideo,
    uploadVideoError,
    updateImage,
    isUpdating,
    updateError,
    deleteImage,
    isDeleting,
    deleteError,
  } = useGallery();
```

- [ ] **Step 4: Update the header button label**

Replace the "Upload Image" button text (in the header, currently around
line 681):

```jsx
            <Upload className="w-5 h-5" />
            Upload Image
```

with:

```jsx
            <Upload className="w-5 h-5" />
            Upload Media
```

- [ ] **Step 5: Pass the new props to `UploadModal`**

Replace the `UploadModal` render call at the bottom of the page (currently
lines 949-957):

```jsx
        {showUpload && (
          <UploadModal
            onClose={() => setShowUpload(false)}
            onUpload={uploadImage}
            isUploading={isUploading}
            uploadError={uploadError}
            userId={user?.id}
          />
        )}
```

with:

```jsx
        {showUpload && (
          <UploadModal
            onClose={() => setShowUpload(false)}
            onUpload={uploadImage}
            isUploading={isUploading}
            uploadError={uploadError}
            onUploadVideo={uploadVideo}
            isUploadingVideo={isUploadingVideo}
            uploadVideoError={uploadVideoError}
            userId={user?.id}
          />
        )}
```

- [ ] **Step 6: Manual QA**

Run `npm run dev`, log in as a `super_user` or `manager`, go to
`/dashboard/gallery`, click "Upload Media":
- Confirm the Photo/Video toggle appears and switches the dropzone.
- On the Video tab, select a file over 100MB (or fake it by picking any
  large video you have) — expect the "less than 100MB" error banner.
- Select a valid short video clip — expect an inline playable preview plus
  file size and duration text.
- Fill in a title, submit — expect the modal to close and a new video item
  to appear at the top of the admin grid.
- Confirm the existing photo upload path (Photo tab) still works
  unchanged.

- [ ] **Step 7: Commit**

```bash
git add app/\(dashboard\)/dashboard/gallery/page.jsx
git commit -m "feat: add video upload UI to admin gallery upload modal"
```

---

### Task 5: Admin grid/list/view/delete — render video items distinctly

**Files:**
- Modify: `app/(dashboard)/dashboard/gallery/page.jsx`

**Interfaces:**
- Consumes: `formatDuration` from `@/utils/video-processing` (Task 3, already imported in Task 4); `Play` icon from `lucide-react`.
- Produces: no new exports — purely presentational changes to existing components in this file.

- [ ] **Step 1: Add the `Play` icon import**

Update the lucide-react import (touched in Task 4) to add `Play`:

```js
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
  Video,
  Play,
} from "lucide-react";
```

- [ ] **Step 2: Show poster + duration badge in the grid card**

In the grid rendering block, replace:

```jsx
              <div className="relative aspect-square overflow-hidden bg-gray-100">
                <Image
                  src={image.image_url}
                  alt={image.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                />
```

with:

```jsx
              <div className="relative aspect-square overflow-hidden bg-gray-100">
                <Image
                  src={image.media_type === "video" ? image.poster_url : image.image_url}
                  alt={image.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                />
                {image.media_type === "video" && (
                  <div className="absolute top-3 left-3 z-10 flex items-center gap-1 px-2 py-1 bg-black/60 text-white text-xs font-medium rounded-lg font-poppins">
                    <Play className="w-3 h-3 fill-white" />
                    {formatDuration(image.duration_seconds)}
                  </div>
                )}
```

- [ ] **Step 3: Show poster + play badge in the list row**

In the list-view table row, replace:

```jsx
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
```

with:

```jsx
                    <td className="px-6 py-4">
                      <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        <Image
                          src={image.media_type === "video" ? image.poster_url : image.image_url}
                          alt={image.title}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                        {image.media_type === "video" && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <Play className="w-4 h-4 text-white fill-white" />
                          </div>
                        )}
                      </div>
                    </td>
```

- [ ] **Step 4: Render video playback in the View modal**

In the `ViewModal` function, replace the media block:

```jsx
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
```

with:

```jsx
        <div className="relative h-[60vh] bg-gray-900">
          {image.media_type === "video" ? (
            <video
              src={image.video_url}
              poster={image.poster_url}
              controls
              className="w-full h-full object-contain"
            />
          ) : (
            <Image
              src={image.full_image_url || image.image_url}
              alt={image.title}
              fill
              className="object-contain"
              sizes="(max-width: 896px) 100vw, 896px"
            />
          )}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-sm transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
```

And replace the download link:

```jsx
            <a
              href={image.full_image_url || image.image_url}
              download
              className="p-3 bg-green-100 hover:bg-green-200 text-green-700 rounded-xl transition"
              title="Download"
            >
              <Download className="w-5 h-5" />
            </a>
```

with:

```jsx
            <a
              href={
                image.media_type === "video"
                  ? image.video_url
                  : image.full_image_url || image.image_url
              }
              download
              className="p-3 bg-green-100 hover:bg-green-200 text-green-700 rounded-xl transition"
              title="Download"
            >
              <Download className="w-5 h-5" />
            </a>
```

- [ ] **Step 5: Adjust Delete modal copy for video rows**

In `DeleteModal`, replace:

```jsx
          <h3 className="text-2xl font-extrabold text-gray-900 font-montserrat">
            Delete Image?
          </h3>
          <p className="text-gray-600 mt-4 leading-relaxed font-poppins text-sm">
            Permanently delete{" "}
            <span className="font-bold text-gray-900">{image.title}</span>? Both
            the thumbnail and full-resolution files will be removed.
          </p>
```

with:

```jsx
          <h3 className="text-2xl font-extrabold text-gray-900 font-montserrat">
            Delete {image.media_type === "video" ? "Video" : "Image"}?
          </h3>
          <p className="text-gray-600 mt-4 leading-relaxed font-poppins text-sm">
            Permanently delete{" "}
            <span className="font-bold text-gray-900">{image.title}</span>?{" "}
            {image.media_type === "video"
              ? "The video file will be removed from storage."
              : "Both the thumbnail and full-resolution files will be removed."}
          </p>
```

- [ ] **Step 6: Manual QA**

With the video uploaded in Task 4's QA still present, in
`/dashboard/gallery`:
- Confirm the grid card shows the poster image with a play-icon + duration
  badge in the corner.
- Switch to list view, confirm the thumbnail shows a centered play icon.
- Click "View" on the video row — confirm the video plays with controls
  and the poster shows before pressing play.
- Click "Delete" on the video row — confirm the confirmation copy says
  "Delete Video?" / "The video file will be removed from storage.", then
  confirm and verify the row disappears from the grid.
- Confirm an existing photo row still renders/views/deletes exactly as
  before (regression check).

- [ ] **Step 7: Commit**

```bash
git add app/\(dashboard\)/dashboard/gallery/page.jsx
git commit -m "feat: render video items distinctly in admin gallery grid, list, view, and delete"
```

---

### Task 6: Generalize `InfiniteRow` to support a custom card component

**Files:**
- Modify: `components/shared/gallery/InfiniteRow.jsx`

**Interfaces:**
- Consumes: nothing new.
- Produces: `InfiniteRow` now accepts an optional `CardComponent` prop
  (component type, defaults to `ImageCard`). Each item in `images` is
  rendered as `<CardComponent image={item} onClick={...} index={i} />`.
  Existing callers that don't pass `CardComponent` are unaffected.

- [ ] **Step 1: Add the `CardComponent` prop**

Replace:

```jsx
import ImageCard from "./ImageCard";

export default function InfiniteRow({ images, rowIndex, onImageClick }) {
```

with:

```jsx
import ImageCard from "./ImageCard";

export default function InfiniteRow({
  images,
  rowIndex,
  onImageClick,
  CardComponent = ImageCard,
}) {
```

Then replace the card render inside the map:

```jsx
        {displayImages.map((image, index) => (
          <ImageCard
            key={`${image.id}-${index}`}
            image={image}
            onClick={() => onImageClick(image)}
            index={index}
          />
        ))}
```

with:

```jsx
        {displayImages.map((image, index) => (
          <CardComponent
            key={`${image.id}-${index}`}
            image={image}
            onClick={() => onImageClick(image)}
            index={index}
          />
        ))}
```

- [ ] **Step 2: Regression-check the public photo gallery**

Run `npm run dev`, visit `/gallery`, confirm the existing photo rows still
render and auto-scroll exactly as before (this task doesn't touch
`app/(user)/gallery/page.jsx`, so it still calls `InfiniteRow` without
`CardComponent`, which defaults to `ImageCard` — behavior must be
byte-for-byte identical to before this change).

- [ ] **Step 3: Commit**

```bash
git add components/shared/gallery/InfiniteRow.jsx
git commit -m "refactor: let InfiniteRow accept a custom card component"
```

---

### Task 7: Fullscreen video viewer component

**Files:**
- Create: `components/shared/gallery/FullScreenVideoViewer.jsx`

**Interfaces:**
- Consumes: an `image` object with `video_url`, `poster_url`, `title`,
  `description`, `category`, `created_at`, `id` fields (same shape as
  gallery rows from Task 1/3).
- Produces: `FullScreenVideoViewer({ image, images, currentIndex, onClose, onNavigate })` — same prop contract as the existing `FullScreenViewer`, so the public gallery page can swap between the two based on `media_type`.

- [ ] **Step 1: Create the component**

Create `components/shared/gallery/FullScreenVideoViewer.jsx`:

```jsx
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

  // Pause whenever the displayed video changes (prev/next navigation)
  useEffect(() => {
    pauseVideo();
  }, [currentIndex, pauseVideo]);

  // Pause on unmount (viewer closed)
  useEffect(() => {
    return () => pauseVideo();
  }, [pauseVideo]);

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
```

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: no errors in `components/shared/gallery/FullScreenVideoViewer.jsx`.
(Functional verification happens in Task 8 once it's wired into the
public gallery page — this component has no caller yet.)

- [ ] **Step 3: Commit**

```bash
git add components/shared/gallery/FullScreenVideoViewer.jsx
git commit -m "feat: add fullscreen video viewer component"
```

---

### Task 8: Video card + public gallery Photos/Videos tabs

**Files:**
- Create: `components/shared/gallery/VideoCard.jsx`
- Modify: `app/(user)/gallery/page.jsx`

**Interfaces:**
- Consumes: `formatDuration` from `@/utils/video-processing` (Task 3);
  `InfiniteRow`'s `CardComponent` prop (Task 6); `FullScreenVideoViewer`
  (Task 7).
- Produces: `VideoCard({ image, onClick, index })` — same prop contract as
  `ImageCard`, so both can be passed interchangeably as `InfiniteRow`'s
  `CardComponent`.

- [ ] **Step 1: Create `VideoCard`**

Create `components/shared/gallery/VideoCard.jsx`:

```jsx
// components/shared/gallery/VideoCard.jsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Play, Calendar, Tag } from "lucide-react";
import { formatDuration } from "@/utils/video-processing";

export default function VideoCard({ image, onClick, index }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const formattedDate = image.created_at
    ? new Date(image.created_at).toLocaleDateString("en-NG", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.5 }}
      whileHover={{ scale: 1.05, zIndex: 20 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
      className="relative flex-shrink-0 w-80 aspect-video rounded-2xl overflow-hidden bg-gray-100 cursor-pointer shadow-lg hover:shadow-2xl transition-smooth group touch-target"
    >
      {/* Poster image — the only bytes ever loaded until this card is clicked */}
      <div className="absolute inset-0">
        <Image
          src={image.poster_url}
          alt={image.title}
          fill
          className={`object-cover transition-smooth-slow group-hover:scale-110 ${
            isLoaded ? "opacity-100 animate-fade-in" : "opacity-0"
          }`}
          sizes="320px"
          quality={85}
          onLoad={() => setIsLoaded(true)}
          draggable={false}
        />
      </div>

      {!isLoaded && <div className="absolute inset-0 skeleton-loading" />}

      {/* Play button */}
      <div className="absolute inset-0 flex items-center justify-center z-20">
        <motion.div
          animate={{ scale: isHovered ? 1.1 : 1 }}
          className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg"
        >
          <Play className="w-6 h-6 text-gray-900 fill-gray-900 ml-1" />
        </motion.div>
      </div>

      {/* Duration badge */}
      <div className="absolute bottom-3 right-3 z-20 px-2 py-1 bg-black/70 text-white text-xs font-medium rounded-lg">
        {formatDuration(image.duration_seconds)}
      </div>

      <div
        className="absolute inset-0 bg-transparent image-protected z-10"
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
      />

      <div className="absolute inset-0 gradient-overlay-bottom opacity-0 group-hover:opacity-100 transition-smooth z-10" />

      <motion.div
        initial={false}
        animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 20 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="absolute inset-x-0 bottom-0 p-4 z-20 text-white pointer-events-none"
      >
        <h3 className="font-bold text-base leading-tight line-clamp-1 text-shadow-strong">
          {image.title}
        </h3>
        <div className="flex items-center gap-3 text-xs text-gray-300 mt-1">
          {image.category && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 glass rounded-lg">
              <Tag className="w-3 h-3" />
              <span>{image.category}</span>
            </div>
          )}
          {formattedDate && (
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3 h-3" />
              <span>{formattedDate}</span>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
```

- [ ] **Step 2: Replace the public gallery page**

Replace the entire contents of `app/(user)/gallery/page.jsx` with:

```jsx
// app/gallery/page.jsx
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/supabase/client";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Search, Grid3x3, Video as VideoIcon } from "lucide-react";
import FullscreenViewer from "@/components/shared/gallery/FullScreenViewer";
import FullScreenVideoViewer from "@/components/shared/gallery/FullScreenVideoViewer";
import InfiniteRow from "@/components/shared/gallery/InfiniteRow";
import VideoCard from "@/components/shared/gallery/VideoCard";

export default function GalleryPage() {
  const supabase = createClient();

  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("photos");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

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

  // Split by media type. Rows created before this feature (or with a null
  // media_type) default to 'image' at the database level, so they land here.
  const photos = useMemo(
    () => images.filter((img) => img.media_type !== "video"),
    [images],
  );
  const videos = useMemo(
    () => images.filter((img) => img.media_type === "video"),
    [images],
  );

  const activeItems = activeTab === "videos" ? videos : photos;

  // A category that only exists on photos (or vice versa) shouldn't
  // silently hide every item after switching tabs.
  useEffect(() => {
    setCategoryFilter("all");
  }, [activeTab]);

  const filteredItems = useMemo(() => {
    return activeItems.filter((img) => {
      const matchesCategory =
        categoryFilter === "all" || img.category === categoryFilter;
      const matchesSearch =
        searchQuery === "" ||
        img.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        img.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeItems, categoryFilter, searchQuery]);

  const categories = useMemo(() => {
    const cats = new Set(activeItems.map((img) => img.category));
    return ["all", ...Array.from(cats)];
  }, [activeItems]);

  // Split items into rows of 6 for the infinite-scroll rows (no duplication)
  const itemRows = useMemo(() => {
    if (filteredItems.length === 0) return [];

    const rows = [];
    const itemsPerRow = 6;

    for (let i = 0; i < filteredItems.length; i += itemsPerRow) {
      const row = filteredItems.slice(i, i + itemsPerRow);
      if (row.length > 0) {
        rows.push(row);
      }
    }

    return rows;
  }, [filteredItems]);

  const openFullscreen = useCallback(
    (item) => {
      const index = filteredItems.findIndex((img) => img.id === item.id);
      setSelectedImage(item);
      setSelectedIndex(index);
      document.body.style.overflow = "hidden";
    },
    [filteredItems],
  );

  const closeFullscreen = useCallback(() => {
    setSelectedImage(null);
    document.body.style.overflow = "";
  }, []);

  const navigateImage = useCallback(
    (direction) => {
      const newIndex =
        direction === "next"
          ? (selectedIndex + 1) % filteredItems.length
          : (selectedIndex - 1 + filteredItems.length) % filteredItems.length;
      setSelectedIndex(newIndex);
      setSelectedImage(filteredItems[newIndex]);
    },
    [selectedIndex, filteredItems],
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
              <span className="text-sm font-medium">Photo & Video Gallery</span>
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
                <span>{photos.length} Photos</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse-subtle"></div>
                <span>{videos.length} Videos</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse-subtle"></div>
                <span>Updated Regularly</span>
              </div>
            </motion.div>
          </motion.div>
        </div>

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
          {/* Media type tabs */}
          <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-xl w-fit">
            {[
              { tab: "photos", label: "Photos", Icon: Grid3x3 },
              { tab: "videos", label: "Videos", Icon: VideoIcon },
            ].map(({ tab, label, Icon }) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-smooth touch-target ${
                  activeTab === tab
                    ? "bg-green-700 text-white shadow-lg shadow-green-700/30"
                    : "text-gray-600 hover:bg-gray-200"
                }`}
                aria-pressed={activeTab === tab}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${activeTab}...`}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-smooth text-sm"
                aria-label={`Search ${activeTab}`}
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
        {filteredItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 max-w-7xl mx-auto px-4"
          >
            {activeTab === "videos" ? (
              <VideoIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            ) : (
              <Grid3x3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            )}
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No {activeTab} found
            </h3>
            <p className="text-gray-600">
              Try adjusting your filters or search terms
            </p>
          </motion.div>
        ) : (
          <div className="space-y-8">
            {itemRows.map((row, index) => (
              <InfiniteRow
                key={`${activeTab}-${index}`}
                images={row}
                rowIndex={index}
                onImageClick={openFullscreen}
                CardComponent={activeTab === "videos" ? VideoCard : undefined}
              />
            ))}
          </div>
        )}
      </section>

      {/* Fullscreen Viewers */}
      <AnimatePresence>
        {selectedImage && selectedImage.media_type === "video" && (
          <FullScreenVideoViewer
            image={selectedImage}
            images={filteredItems}
            currentIndex={selectedIndex}
            onClose={closeFullscreen}
            onNavigate={navigateImage}
          />
        )}
        {selectedImage && selectedImage.media_type !== "video" && (
          <FullscreenViewer
            image={selectedImage}
            images={filteredItems}
            currentIndex={selectedIndex}
            onClose={closeFullscreen}
            onNavigate={navigateImage}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 3: Manual QA**

Run `npm run dev`, visit `/gallery`:
- Confirm the "Photos" tab is active by default and behaves exactly as
  before (search, category pills, infinite-scroll rows, fullscreen photo
  viewer with zoom/pan).
- Click "Videos" — confirm the category pills reset to "All" and the
  video(s) uploaded earlier appear as 16:9 cards with a poster image, a
  centered play button, and a duration badge.
- Open devtools Network tab, filter by Media, and scroll the Videos row —
  confirm **no** video file request fires, only the poster `.jpg`.
- Click a video card — confirm the fullscreen video viewer opens, shows
  the poster until you press play, and plays back with native controls.
- If more than one video exists, use the prev/next arrows — confirm the
  previously playing video pauses when you navigate away from it.
- Press Escape — confirm the viewer closes and playback stops.

- [ ] **Step 4: Commit**

```bash
git add components/shared/gallery/VideoCard.jsx "app/(user)/gallery/page.jsx"
git commit -m "feat: add Photos/Videos tabs and video card to the public gallery"
```

---

### Task 9: End-to-end verification and Plesk safety check

**Files:** none (verification only)

**Interfaces:** none

- [ ] **Step 1: Lint the whole project**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 2: Production build (mirrors what Plesk will run)**

Run: `npm run build`
Expected: build completes successfully with no errors — this is the same
`output: "standalone"` build Plesk uses, so a clean local build here is
the strongest available signal that the deploy won't break.

- [ ] **Step 3: Confirm no new dependencies were introduced**

Open `package.json` and compare its `dependencies` and `devDependencies`
against the "Tech Stack" list at the top of this plan.
Expected: identical — no new packages were added by any task in this
plan, confirming the "no new npm dependencies" constraint was honored
throughout. (A plain `git diff` isn't a reliable check here since this
repo already has unrelated uncommitted changes from other in-progress
work — read the file directly instead.)

- [ ] **Step 4: Full manual QA pass**

With `npm run dev` running:
- **Admin:** upload a new video as a content manager, confirm it appears
  with poster + duration in both grid and list view, edit its title/
  category, view it in the View modal, then delete it. If you have access
  to the Cloudinary dashboard, confirm the video asset is actually gone
  after deletion (this is the real end-to-end proof that the Task 2 fix
  works, not just that the UI removed the row).
- **Public:** on `/gallery`, confirm Photos and Videos tabs both work,
  category filtering and search work independently per tab, and the
  fullscreen viewers behave correctly for both media types.
- **Mobile viewport:** using devtools responsive mode (or a real phone),
  check the admin upload modal's video tab and the public Videos tab/
  fullscreen viewer at a narrow width (375px) — confirm no horizontal
  overflow and touch targets are usable.

- [ ] **Step 5: Final commit (if any QA fixes were needed)**

If manual QA in Step 4 surfaced any issues, fix them, then stage only the
specific files you changed (this repo has unrelated uncommitted changes
from other in-progress work sitting in the working tree — do not sweep
those in with `-A` or `.`):

```bash
git add <path/to/each/file/you/fixed>
git commit -m "fix: address issues found in gallery video QA pass"
```

If no fixes were needed, this task requires no commit — it's a
verification-only gate before considering the feature done.
