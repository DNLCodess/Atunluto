/**
 * POST /results-portal/api/security/upload-url
 */

import { getResultsSession } from "@/lib/erms-session";
import { NextResponse } from "next/server";
import { signUpload } from "@/lib/cloudinary";

export async function POST(request) {
  const session = await getResultsSession();
  if (!session || !["lga_admin", "polling_unit_admin"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { fileType, fileSize } = body;

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

  const folder = `security-evidence/${session.id}`;

  return NextResponse.json({ ...signUpload(folder), uploadType: "auto" });
}
