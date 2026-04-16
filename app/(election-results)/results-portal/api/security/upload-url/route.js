/**
 * POST /results-portal/api/security/upload-url  — getEvidenceUploadUrl
 */

import { createAdminClient } from "@/supabase/admin";
import { getResultsSession } from "@/lib/erms-session";
import { NextResponse } from "next/server";

export async function POST(request) {
  const session = await getResultsSession();
  if (!session || !["lga_admin", "polling_unit_admin"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { fileName, fileType, fileSize } = body;

  if (fileSize > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "Evidence file must be under 10MB." }, { status: 400 });
  }

  const ALLOWED = ["image/jpeg", "image/png", "application/pdf"];
  if (!ALLOWED.includes(fileType)) {
    return NextResponse.json(
      { error: "Only JPEG, PNG, and PDF files are allowed." },
      { status: 400 },
    );
  }

  const ext = fileName.split(".").pop().toLowerCase();
  const path = `security-evidence/${session.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const supabase = createAdminClient();

  const { data, error } = await supabase.storage
    .from("security-evidence")
    .createSignedUploadUrl(path);

  if (error) return NextResponse.json({ error: "Failed to generate upload URL." }, { status: 500 });
  return NextResponse.json({ uploadUrl: data.signedUrl, path, token: data.token });
}
