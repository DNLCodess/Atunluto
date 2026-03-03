import { createClient as createAdminClient } from "@supabase/supabase-js";

console.log("[upload-url] Module loaded");
console.log(
  "[upload-url] SUPABASE_URL:",
  process.env.NEXT_PUBLIC_SUPABASE_URL ? "SET" : "MISSING",
);
console.log(
  "[upload-url] SERVICE_ROLE_KEY:",
  process.env.SUPABASE_SERVICE_ROLE_KEY ? "SET" : "MISSING",
);

const serviceClient = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function GET(request) {
  console.log("[upload-url] GET received:", request.url);
  try {
    const { searchParams } = new URL(request.url);
    const lga = searchParams.get("lga");
    const ext = searchParams.get("ext") || "jpg";
    console.log("[upload-url] Params — lga:", lga, "| ext:", ext);

    if (!lga)
      return Response.json({ error: "LGA is required." }, { status: 400 });

    const safeExt = ext.replace(/[^a-zA-Z0-9]/g, "").slice(0, 5) || "jpg";
    const path = `public/${lga}/${Date.now()}-${Math.random().toString(36).slice(2)}.${safeExt}`;
    console.log("[upload-url] Storage path:", path);

    const { data, error } = await serviceClient.storage
      .from("members-images")
      .createSignedUploadUrl(path);

    if (error) {
      console.error("[upload-url] createSignedUploadUrl FAILED:", {
        message: error.message,
        statusCode: error.statusCode,
        error: error.error,
        full: JSON.stringify(error),
      });
      return Response.json(
        { error: "Could not generate upload URL.", detail: error.message },
        { status: 500 },
      );
    }

    console.log(
      "[upload-url] Signed URL OK. Token present:",
      !!data?.token,
      "| Keys:",
      Object.keys(data || {}),
    );

    const { data: publicUrlData } = serviceClient.storage
      .from("members-images")
      .getPublicUrl(path);
    console.log("[upload-url] Public URL:", publicUrlData?.publicUrl);

    return Response.json({
      token: data.token,
      path,
      publicUrl: publicUrlData.publicUrl,
    });
  } catch (err) {
    console.error("[upload-url] Unexpected error:", err.message, err.stack);
    return Response.json(
      { error: "Internal server error.", detail: err.message },
      { status: 500 },
    );
  }
}
