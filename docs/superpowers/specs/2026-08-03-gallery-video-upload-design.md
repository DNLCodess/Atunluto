# Gallery Video Upload — Design Spec

Date: 2026-08-03
Status: Approved for planning

## Context

Content managers currently upload photos to the gallery via a client-side
compression step and a direct signed upload to Cloudinary (see
`hooks/use-gallery.js`, `app/api/cloudinary-sign/route.js`). The public
gallery (`app/(user)/gallery/page.jsx`) renders photos in infinite
horizontal-scrolling rows (`InfiniteRow` + `ImageCard`) with a fullscreen
lightbox (`FullScreenViewer`).

We're adding video upload for content managers and a video viewing
experience on the public gallery page. The app is deployed on **Plesk**, not
Vercel — there is no serverless function budget to lean on, and the Plesk
box should not be asked to do media processing (no ffmpeg, no transcoding).
The existing architecture already keeps media bytes off the app server
entirely (browser uploads directly to Cloudinary via signed URLs); this
design preserves that property for video.

Cloudinary is on the **free tier**, so the design deliberately avoids
upload-time (eager) transformations, which consume credits immediately.
Poster frames and optimized delivery formats are generated on-demand via URL
transformation flags and cached at Cloudinary's edge after first request —
same cost profile as a normal view.

## Goals

- Content managers can upload short video clips to the gallery from the
  existing dashboard gallery page.
- Public gallery visitors can browse and watch videos in a distinctive,
  performant UI, separate from the photo browsing experience.
- No new server-side infrastructure, no new heavy client dependencies, and
  no change to how media bytes flow relative to the existing photo pipeline
  (browser ↔ Cloudinary directly; Plesk server only ever signs a small JSON
  request).

## Non-goals

- No adaptive bitrate streaming (HLS/DASH) — relying on Cloudinary's
  `f_auto,q_auto` automatic format/quality selection over plain HTTP
  progressive download is sufficient at this scale and avoids both a new
  client dependency (hls.js) and extra Cloudinary transformation cost.
- No client-side video compression/re-encoding (canvas tricks used for
  photos don't apply to video; ffmpeg.wasm is too heavy for this use case).
- No chunked/resumable upload — the 100MB cap keeps a single-request upload
  practical.

## Data model (Supabase `gallery` table)

Add columns, all nullable / defaulted so existing photo rows remain valid
with no backfill:

| Column | Type | Notes |
|---|---|---|
| `media_type` | text | `'image' \| 'video'`, defaults to `'image'` |
| `video_url` | text | Cloudinary secure URL, video rows only |
| `poster_url` | text | Derived Cloudinary transformation URL, video rows only |
| `duration_seconds` | numeric | Read client-side before upload, video rows only |

Existing columns (`title`, `description`, `category`, `image_url`,
`full_image_url`, `storage_path`, `full_storage_path`, `uploaded_by`,
`created_at`) are reused as-is. For video rows, `storage_path` holds the
Cloudinary `public_id` of the uploaded video (used for deletion).

## Cloudinary strategy

- Upload: signed upload with `resource_type: "video"`, folder
  `gallery/videos`, using the same `/api/cloudinary-sign` signing endpoint
  pattern already used for images (folder parameterized).
- Poster thumbnail: **not uploaded separately.** Derived via URL pattern:
  `https://res.cloudinary.com/<cloud>/video/upload/so_0,w_800,c_fill,q_auto,f_jpg/<public_id>.jpg`
- Playback URL: `f_auto,q_auto` flags applied to the delivery URL so
  Cloudinary serves the optimal codec/bitrate per requesting browser,
  cached at the edge after first request.
- **Deletion bug fix**: `app/api/cloudinary-delete/route.js` currently calls
  `cloudinary.uploader.destroy(id)` with no `resource_type`, which defaults
  to `"image"`. For a video `public_id` this silently no-ops (Cloudinary
  returns `{result: "not found"}` rather than throwing), so unmodified this
  route would leak orphaned video files on the free-tier storage budget
  indefinitely. Fix: accept a `resourceType` per id (or a list of
  `{publicId, resourceType}` pairs) and pass it through to `destroy()`.

## Admin upload UX (`app/(dashboard)/dashboard/gallery/page.jsx`)

- The upload modal gains a **Photo / Video segmented toggle** at the top,
  reusing the existing segmented-control visual style already used for the
  grid/list view toggle.
- Video branch of the dropzone:
  - Accepts `video/*`.
  - Client-side validation before upload: MIME type starts with `video/`,
    file size ≤ 100MB, duration ≤ 180s. Duration is read by loading the
    file into a hidden `<video>` element and reading the `loadedmetadata`
    event — no additional library required.
  - Shows an inline native preview player (`URL.createObjectURL`) instead
    of the canvas-thumbnail preview used for photos.
  - Validation failures render through the existing `ErrorBanner`
    component with a clear message (type / size / duration).
  - No client-side compression step for video.
- Title / description / category fields are shared, unchanged.
- Gallery management grid/list: video rows show the poster thumbnail (via
  `next/image`, already covered by the `res.cloudinary.com` remote pattern)
  with a small play-icon + duration badge overlay. View modal renders
  `<video controls poster={poster_url}>` for video rows instead of
  `<Image>`. Delete confirmation copy adjusts for "video" vs "image".
- Permissions: reuses the existing `canManageGallery` role gate
  (`super_user` / `manager`) — no new role introduced.

## Public gallery UX (`app/(user)/gallery/page.jsx`)

- A **Photos / Videos** tab pair sits above the existing category-pill
  filter bar. Category filtering continues to apply within whichever tab is
  active; the underlying filter/search logic is unchanged, just scoped by
  `media_type`.
- Videos tab reuses the existing horizontal infinite-scroll row mechanic
  (`InfiniteRow`) for visual consistency with the photo gallery. A new
  `VideoCard` component renders in a 16:9 aspect (vs. the photo card's
  fixed box):
  - Cloudinary poster image via `next/image`.
  - Centered play-button overlay + duration badge (e.g. `2:14`).
  - **No autoplay, no video bytes loaded** until the card is clicked — the
    grid never loads more than poster images, matching the decision to keep
    the browsing experience cheap on mobile data and Cloudinary bandwidth.
- Clicking a card opens a fullscreen viewer — a sibling to the existing
  `FullScreenViewer` (same chrome: title, description, category/date,
  close, prev/next, share) — with the media pane rendering
  `<video controls playsInline poster={poster_url} preload="metadata">`
  instead of `<Image>`. Autoplay is intentionally off (browsers block
  unmuted autoplay regardless; native tap-to-play is the honest choice).
  The video is paused via a ref-cleanup effect when the viewer closes or
  the user navigates prev/next, so audio never plays in the background.

## Performance / Plesk safety

- Video bytes never pass through the Node process on Plesk. Upload is
  browser → Cloudinary directly (signed URL); playback streams directly
  from Cloudinary's CDN to the visitor. The Plesk server's involvement is
  unchanged in shape from the existing photo flow: it only ever handles a
  small JSON signature request.
- No new npm dependencies. Native `<video>` + Cloudinary's `f_auto,q_auto`
  flags avoid needing hls.js/video.js, keeping the production bundle and
  Plesk build step unchanged.
- No server-side transcoding, no ffmpeg — deliberately ruled out since
  Plesk is not a dedicated media-processing host.
- Client-side size/duration caps (100MB / 3 minutes) protect the Cloudinary
  free-tier credit budget from a single runaway upload.

## Testing

- Manual verification in a browser: upload a video as a content manager,
  confirm it appears in the admin grid with poster + duration badge, edit
  its metadata, view it in the admin View modal, delete it and confirm (via
  Cloudinary dashboard or a follow-up `list` call) that the asset is
  actually removed — this specifically exercises the delete
  `resource_type` fix.
- Manual verification on the public gallery: switch to the Videos tab,
  confirm category filtering and search still work, open the fullscreen
  viewer, confirm playback, confirm prev/next pauses the previous video,
  confirm no video request fires before a card is clicked (via browser
  devtools network tab).
- Responsive check: admin upload modal and public video card/viewer on a
  narrow mobile viewport.
