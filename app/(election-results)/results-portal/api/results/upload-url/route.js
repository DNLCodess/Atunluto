/**
 * POST /results-portal/api/results/upload-url
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
    return NextResponse.json({ error: "Image must be under 10MB." }, { status: 400 });
  }

  const ALLOWED = ["image/jpeg", "image/png"];
  if (!ALLOWED.includes(fileType)) {
    return NextResponse.json({ error: "Only JPEG and PNG are allowed." }, { status: 400 });
  }

  const ward = session.ward ? `/${session.ward.replace(/\s+/g, "_")}` : "";
  const folder = `results-images/${session.lga}${ward}`;

  return NextResponse.json({ ...signUpload(folder), uploadType: "image" });
}
