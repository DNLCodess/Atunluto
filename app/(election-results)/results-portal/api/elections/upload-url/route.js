/**
 * POST /results-portal/api/elections/upload-url  — getCandidatePhotoUploadUrl
 * Returns a signed upload URL for uploading a candidate photo directly to storage.
 */

import { createAdminClient } from "@/supabase/admin";
import { getResultsSession } from "@/lib/erms-session";
import { NextResponse } from "next/server";

export async function POST(request) {
  const session = await getResultsSession();
  if (!session || session.role !== "state_admin") {
    return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { fileName, fileType, fileSize } = body;

  if (fileSize > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Photo must be under 5MB." }, { status: 400 });
  }

  const ALLOWED = ["image/jpeg", "image/png"];
  if (!ALLOWED.includes(fileType)) {
    return NextResponse.json({ error: "Only JPEG and PNG are allowed." }, { status: 400 });
  }

  const ext = fileName.split(".").pop().toLowerCase();
  const path = `candidates/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const supabase = createAdminClient();

  const { data, error } = await supabase.storage
    .from("results-images")
    .createSignedUploadUrl(path);

  if (error) return NextResponse.json({ error: "Failed to generate upload URL." }, { status: 500 });
  return NextResponse.json({ uploadUrl: data.signedUrl, path });
}
