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

-- Video rows never populate image_url/full_image_url (they use video_url/poster_url
-- instead), so these columns must be nullable or every video insert fails at the
-- DB step after the asset is already uploaded to Cloudinary.
alter table public.gallery alter column image_url drop not null;
alter table public.gallery alter column full_image_url drop not null;

-- Verification: after running the above, confirm both columns report
-- is_nullable = 'YES' via:
--   select column_name, is_nullable
--   from information_schema.columns
--   where table_name = 'gallery' and column_name in ('image_url', 'full_image_url');
