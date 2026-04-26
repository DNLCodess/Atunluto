/**
 * POST /results-portal/api/elections/upload-url
 */

import { getResultsSession } from "@/lib/erms-session";
import { NextResponse } from "next/server";
import { signUpload } from "@/lib/cloudinary";

export async function POST(request) {
  const session = await getResultsSession();
  if (!session || session.role !== "state_admin") {
    return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { fileType, fileSize } = body;

  if (fileSize > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Photo must be under 5MB." }, { status: 400 });
  }

  const ALLOWED = ["image/jpeg", "image/png"];
  if (!ALLOWED.includes(fileType)) {
    return NextResponse.json({ error: "Only JPEG and PNG are allowed." }, { status: 400 });
  }

  return NextResponse.json({ ...signUpload("candidates"), uploadType: "image" });
}
