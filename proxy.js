import { NextResponse } from "next/server";
import { updateSession } from "./supabase/middleware";

// This function can be marked `async` if using `await` inside
export async function proxy(request) {
  return await updateSession(request);
}

export const config = {
  matcher: "/dashboard/:path*",
};

// matcher: "/dashboard/:path*",
