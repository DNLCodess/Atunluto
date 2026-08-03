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

    // This route is only ever called by the gallery hook's deleteImageFn
    // (grepped for callers of /api/cloudinary-delete — no other feature in
    // the app deletes Cloudinary assets), so the gallery-manage role gate
    // applies unconditionally, unlike cloudinary-sign which has other,
    // non-gallery callers.
    const { data: admin } = await supabase
      .from("admins")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!admin || !["super_user", "manager"].includes(admin.role))
      return Response.json({ error: "Forbidden." }, { status: 403 });

    const { assets } = await request.json();
    if (!Array.isArray(assets) || assets.length === 0)
      return Response.json(
        { error: "assets array is required." },
        { status: 400 },
      );

    const results = await Promise.allSettled(
      assets.map(({ publicId, resourceType }) =>
        cloudinary.uploader.destroy(publicId, {
          resource_type: resourceType || "image",
        }),
      ),
    );

    const failed = results
      .map((r, i) => (r.status === "rejected" ? assets[i].publicId : null))
      .filter(Boolean);

    if (failed.length > 0) {
      console.error("Cloudinary delete failed for:", failed);
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error("Cloudinary delete error:", err);
    return Response.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
