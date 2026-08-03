import { createClient } from "@/supabase/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET(request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return Response.json({ error: "Unauthorised." }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const folderOverride = searchParams.get("folder");
    const lga = searchParams.get("lga") || "general";
    const folder = folderOverride || `members-images/${lga}`;

    // Gallery uploads (photo/video) carry more risk than other signing
    // callers in this app (100MB/request vs a 10MB image cap elsewhere), so
    // they're additionally gated to gallery-manage roles. Other callers
    // (member profile photos, site-content images) pass a different folder
    // and are unaffected by this check.
    const isGalleryUpload =
      folderOverride === "gallery" || Boolean(folderOverride?.startsWith("gallery/"));
    if (isGalleryUpload) {
      const { data: admin } = await supabase
        .from("admins")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!admin || !["super_user", "manager"].includes(admin.role))
        return Response.json({ error: "Forbidden." }, { status: 403 });
    }

    const timestamp = Math.round(Date.now() / 1000);
    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder },
      process.env.CLOUDINARY_API_SECRET,
    );

    return Response.json({
      signature,
      timestamp,
      folder,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
    });
  } catch (err) {
    console.error("Cloudinary sign error:", err);
    return Response.json({ error: "Internal server error." }, { status: 500 });
  }
}
