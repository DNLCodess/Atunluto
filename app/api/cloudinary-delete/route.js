import { createClient } from "@/supabase/server";
import { cloudinary } from "@/lib/cloudinary";

export async function POST(request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return Response.json({ error: "Unauthorised." }, { status: 401 });

    const { publicIds } = await request.json();
    if (!Array.isArray(publicIds) || publicIds.length === 0)
      return Response.json({ error: "publicIds array is required." }, { status: 400 });

    const results = await Promise.allSettled(
      publicIds.map((id) => cloudinary.uploader.destroy(id)),
    );

    const failed = results
      .map((r, i) => (r.status === "rejected" ? publicIds[i] : null))
      .filter(Boolean);

    if (failed.length > 0) {
      console.error("Cloudinary delete failed for:", failed);
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error("Cloudinary delete error:", err);
    return Response.json({ error: "Internal server error." }, { status: 500 });
  }
}
