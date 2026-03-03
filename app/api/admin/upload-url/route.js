import { createClient } from "@/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const serviceClient = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function GET(request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return Response.json({ error: "Unauthorised." }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const lga = searchParams.get("lga");
    const ext = searchParams.get("ext") || "jpg";

    if (!lga)
      return Response.json({ error: "LGA is required." }, { status: 400 });

    const path = `${lga}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { data, error } = await serviceClient.storage
      .from("members-images")
      .createSignedUploadUrl(path);

    if (error) {
      console.error("Signed URL error:", error);
      return Response.json(
        { error: "Could not generate upload URL." },
        { status: 500 },
      );
    }

    const { data: publicUrlData } = serviceClient.storage
      .from("members-images")
      .getPublicUrl(path);

    return Response.json({
      signedUrl: data.signedUrl,
      token: data.token, // needed for uploadToSignedUrl
      path,
      publicUrl: publicUrlData.publicUrl,
    });
  } catch (err) {
    console.error("Upload URL error:", err);
    return Response.json({ error: "Internal server error." }, { status: 500 });
  }
}
