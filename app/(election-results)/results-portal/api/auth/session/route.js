/**
 * GET /results-portal/api/auth/session
 * Returns the current ERMS session or { session: null } if not authenticated.
 * Used by login page to check for an existing session on mount.
 */

import { getResultsSession } from "@/lib/erms-session";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getResultsSession();
  return NextResponse.json({ session: session ?? null });
}
