/**
 * One-time migration: Supabase Storage → Cloudinary
 *
 * Run from the project root:
 *   node --env-file=.env.local scripts/migrate-to-cloudinary.mjs
 *
 * Safe to re-run: already-migrated rows (res.cloudinary.com URLs) are skipped.
 */

import { createClient } from "@supabase/supabase-js";
import cloudinaryPkg from "cloudinary";
import { Readable } from "stream";

const { v2: cloudinary } = cloudinaryPkg;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseSupabaseUrl(url) {
  if (!url || !url.includes("supabase.co")) return null;
  const m = url.match(/\/storage\/v1\/object\/(?:public|sign)\/([^?]+)/);
  if (!m) return null;
  const [bucket, ...rest] = m[1].split("/");
  // Decode URL-encoded characters (e.g. %20 → space) in the path
  const path = rest.map(decodeURIComponent).join("/");
  return { bucket, path, originalUrl: url };
}

async function downloadFromSupabase(bucket, path, originalUrl) {
  // Try SDK download first (works for both public and private buckets)
  const { data, error } = await supabase.storage.from(bucket).download(path);
  if (!error && data) return Buffer.from(await data.arrayBuffer());

  // Fallback: direct HTTP fetch using the original URL (works for public buckets)
  if (originalUrl) {
    const res = await fetch(originalUrl);
    if (res.ok) return Buffer.from(await res.arrayBuffer());
  }

  throw new Error(`Download (${bucket}/${path}): ${error?.message ?? "fetch failed"}`);
}

function uploadToCloudinary(buffer, { folder, resourceType = "image" }) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (err, result) => (err ? reject(err) : resolve(result)),
    );
    Readable.from(buffer).pipe(stream);
  });
}

/** Run an array of async tasks with at most `limit` in-flight at once. */
async function pLimit(tasks, limit) {
  const results = [];
  let i = 0;
  async function worker() {
    while (i < tasks.length) {
      const idx = i++;
      results[idx] = await tasks[idx]().catch((e) => ({ __error: e.message }));
    }
  }
  await Promise.all(Array.from({ length: limit }, worker));
  return results;
}

let migrated = 0;
let skipped = 0;
let errors = 0;

function tick(icon, label, id) {
  process.stdout.write(`  ${icon} [${label}] ${id}\n`);
}

// ── 1. Gallery ────────────────────────────────────────────────────────────────
async function migrateGallery() {
  console.log("\n── Gallery ──────────────────────────────────────────────────");
  const { data, error } = await supabase
    .from("gallery")
    .select("id, image_url, full_image_url, storage_path, full_storage_path");
  if (error) { console.error("  DB error:", error.message); return; }

  for (const row of data ?? []) {
    if (!row.storage_path || row.image_url?.includes("res.cloudinary.com")) {
      tick("·", "gallery", `${row.id} skipped`); skipped++; continue;
    }
    try {
      const [thumbBuf, fullBuf] = await Promise.all([
        downloadFromSupabase("gallery", row.storage_path, row.image_url),
        row.full_storage_path
          ? downloadFromSupabase("gallery", row.full_storage_path, row.full_image_url)
          : Promise.resolve(null),
      ]);

      const [thumbResult, fullResult] = await Promise.all([
        uploadToCloudinary(thumbBuf, { folder: "gallery" }),
        fullBuf ? uploadToCloudinary(fullBuf, { folder: "gallery" }) : Promise.resolve(null),
      ]);

      await supabase.from("gallery").update({
        image_url: thumbResult.secure_url,
        full_image_url: fullResult?.secure_url ?? thumbResult.secure_url,
        storage_path: thumbResult.public_id,
        full_storage_path: fullResult?.public_id ?? thumbResult.public_id,
      }).eq("id", row.id);

      const paths = [row.storage_path, row.full_storage_path].filter(Boolean);
      await supabase.storage.from("gallery").remove(paths);

      tick("✓", "gallery", row.id); migrated++;
    } catch (err) {
      tick("✗", "gallery", `${row.id}: ${err.message}`); errors++;
    }
  }
}

// ── 2. Members (batched, 5 concurrent) ───────────────────────────────────────
async function migrateMembers() {
  console.log("\n── Members ──────────────────────────────────────────────────");

  // Paginate to fetch beyond the 1000-row default limit
  let rows = [];
  let from = 0;
  const PAGE = 1000;
  while (true) {
    const { data, error } = await supabase
      .from("members")
      .select("id, full_name, profile_image_url, lga")
      .ilike("profile_image_url", "%supabase.co%")
      .range(from, from + PAGE - 1);
    if (error) { console.error("  DB error:", error.message); return; }
    rows = rows.concat(data ?? []);
    if (!data || data.length < PAGE) break;
    from += PAGE;
  }
  console.log(`  Found ${rows.length} members to migrate`);

  const tasks = rows.map((row) => async () => {
    const loc = parseSupabaseUrl(row.profile_image_url);
    if (!loc) { skipped++; return; }
    const buf = await downloadFromSupabase(loc.bucket, loc.path, loc.originalUrl);
    const result = await uploadToCloudinary(buf, {
      folder: `members-images/${row.lga ?? "general"}`,
    });
    await supabase.from("members")
      .update({ profile_image_url: result.secure_url })
      .eq("id", row.id);
    await supabase.storage.from(loc.bucket).remove([loc.path]);
    tick("✓", "member", row.full_name);
    migrated++;
  });

  // Process 5 at a time, catch per-item errors
  let done = 0;
  const BATCH = 5;
  for (let i = 0; i < tasks.length; i += BATCH) {
    const batch = tasks.slice(i, i + BATCH);
    await Promise.allSettled(
      batch.map((t) =>
        t().catch((err) => {
          tick("✗", "member", `row ${i + batch.indexOf(t)}: ${err.message}`);
          errors++;
        }),
      ),
    );
    done += batch.length;
    process.stdout.write(`  Progress: ${done}/${tasks.length}\r`);
  }
  console.log(); // newline after progress
}

// ── 3. Candidates ─────────────────────────────────────────────────────────────
async function migrateCandidates() {
  console.log("\n── Candidates ───────────────────────────────────────────────");
  const { data, error } = await supabase
    .from("candidates")
    .select("id, full_name, photo_url")
    .ilike("photo_url", "%supabase.co%");
  if (error) { console.error("  DB error:", error.message); return; }

  for (const row of data ?? []) {
    const loc = parseSupabaseUrl(row.photo_url);
    if (!loc) { skipped++; continue; }
    try {
      const buf = await downloadFromSupabase(loc.bucket, loc.path, loc.originalUrl);
      const result = await uploadToCloudinary(buf, { folder: "candidates" });
      await supabase.from("candidates").update({ photo_url: result.secure_url }).eq("id", row.id);
      await supabase.storage.from(loc.bucket).remove([loc.path]);
      tick("✓", "candidate", row.full_name); migrated++;
    } catch (err) {
      tick("✗", "candidate", `${row.full_name}: ${err.message}`); errors++;
    }
  }
}

// ── 4. Election result images ─────────────────────────────────────────────────
async function migrateResultImages() {
  console.log("\n── Election Results ─────────────────────────────────────────");
  const { data, error } = await supabase
    .from("election_results")
    .select("id, result_image_url, result_image_path")
    .not("result_image_url", "is", null);
  if (error) { console.error("  DB error:", error.message); return; }

  for (const row of data ?? []) {
    if (!row.result_image_url?.includes("supabase.co")) { skipped++; continue; }

    const parsed = parseSupabaseUrl(row.result_image_url);
    const storagePath = row.result_image_path ?? parsed?.path;
    if (!storagePath) { skipped++; continue; }

    try {
      const buf = await downloadFromSupabase("results-images", storagePath, row.result_image_url);
      const result = await uploadToCloudinary(buf, { folder: "results-images" });
      await supabase.from("election_results").update({
        result_image_url: result.secure_url,
        result_image_path: null,
      }).eq("id", row.id);
      await supabase.storage.from("results-images").remove([storagePath]);
      tick("✓", "result", row.id); migrated++;
    } catch (err) {
      tick("✗", "result", `${row.id}: ${err.message}`); errors++;
    }
  }
}

// ── 5. Security evidence ──────────────────────────────────────────────────────
async function migrateSecurityEvidence() {
  console.log("\n── Security Evidence ────────────────────────────────────────");
  const { data, error } = await supabase
    .from("security_reports")
    .select("id, evidence_url")
    .not("evidence_url", "is", null);
  if (error) { console.error("  DB error:", error.message); return; }

  for (const row of data ?? []) {
    if (!row.evidence_url?.includes("supabase.co")) { skipped++; continue; }
    const loc = parseSupabaseUrl(row.evidence_url);
    if (!loc) { skipped++; continue; }
    try {
      const buf = await downloadFromSupabase(loc.bucket, loc.path, loc.originalUrl);
      const resourceType = loc.path.toLowerCase().endsWith(".pdf") ? "raw" : "image";
      const result = await uploadToCloudinary(buf, {
        folder: "security-evidence",
        resourceType,
      });
      await supabase.from("security_reports")
        .update({ evidence_url: result.secure_url })
        .eq("id", row.id);
      await supabase.storage.from(loc.bucket).remove([loc.path]);
      tick("✓", "security", row.id); migrated++;
    } catch (err) {
      tick("✗", "security", `${row.id}: ${err.message}`); errors++;
    }
  }
}

// ── 6. Purge any orphaned files left in Supabase buckets ─────────────────────
async function purgeOrphanedFiles() {
  console.log("\n── Purging orphaned Supabase files ─────────────────────────");
  const BUCKETS = ["gallery", "results-images", "security-evidence", "members-images"];

  for (const bucket of BUCKETS) {
    try {
      const { data: files, error } = await supabase.storage.from(bucket).list("", {
        limit: 1000,
        offset: 0,
      });
      if (error) { console.error(`  ${bucket}: list error — ${error.message}`); continue; }

      const names = (files ?? []).filter((f) => f.name !== ".emptyFolderPlaceholder").map((f) => f.name);
      if (names.length === 0) {
        console.log(`  ${bucket}: empty ✓`);
        continue;
      }

      // For nested paths (e.g. members-images/LGA/file.jpg), list recursively
      // Simple bucket root list only catches top-level items; nested folders show as folders.
      const folders = (files ?? []).filter((f) => f.id === null).map((f) => f.name);
      const rootFiles = (files ?? []).filter((f) => f.id !== null).map((f) => f.name);

      // Delete root-level files
      if (rootFiles.length > 0) {
        const { error: delErr } = await supabase.storage.from(bucket).remove(rootFiles);
        if (delErr) console.error(`  ${bucket} root delete error: ${delErr.message}`);
        else console.log(`  ${bucket}: deleted ${rootFiles.length} root file(s)`);
      }

      // Recurse into folders (one level deep is enough for our structure)
      for (const folder of folders) {
        const { data: subFiles, error: subErr } = await supabase.storage
          .from(bucket)
          .list(folder, { limit: 1000 });
        if (subErr) { console.error(`  ${bucket}/${folder}: list error`); continue; }
        const subPaths = (subFiles ?? [])
          .filter((f) => f.id !== null)
          .map((f) => `${folder}/${f.name}`);
        if (subPaths.length === 0) continue;
        const { error: subDelErr } = await supabase.storage.from(bucket).remove(subPaths);
        if (subDelErr) console.error(`  ${bucket}/${folder}: delete error — ${subDelErr.message}`);
        else console.log(`  ${bucket}/${folder}: deleted ${subPaths.length} file(s)`);
      }
    } catch (err) {
      console.error(`  ${bucket}: unexpected error — ${err.message}`);
    }
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
console.log("=== Supabase Storage → Cloudinary Migration ===");
console.log(`Cloud: ${process.env.CLOUDINARY_CLOUD_NAME}`);
console.log(`Supabase: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);

await migrateGallery();
await migrateMembers();
await migrateCandidates();
await migrateResultImages();
await migrateSecurityEvidence();
await purgeOrphanedFiles();

console.log("\n=== Summary ===");
console.log(`  Migrated : ${migrated}`);
console.log(`  Skipped  : ${skipped}`);
console.log(`  Errors   : ${errors}`);

if (errors > 0) {
  console.log("\n⚠  Some files had errors — re-run the script to retry.");
  process.exit(1);
} else {
  console.log("\n✅ Migration complete. You can now delete the Supabase storage buckets if desired.");
}
