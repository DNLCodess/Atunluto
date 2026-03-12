import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/supabase/server";

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const MEMBER_FIELDS = [
  "id",
  "membership_number",
  "full_name",
  "gender",
  "date_of_birth",
  "phone",
  "whatsapp",
  "messenger",
  "lga",
  "ward",
  "polling_unit",
  "address",
  "profile_image_url",
  "created_at",
].join(", ");

async function getAdmin() {
  // validate session exists — reuse your existing session check pattern
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function GET() {
  try {
    const { data, error } = await serviceClient
      .from("members")
      .select(MEMBER_FIELDS)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return Response.json(data ?? []);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const { id, updates } = await request.json();
    if (!id || !updates)
      return Response.json({ error: "Missing id or updates" }, { status: 400 });
    const { data, error } = await serviceClient
      .from("members")
      .update(updates)
      .eq("id", id)
      .select(MEMBER_FIELDS)
      .single();
    if (error) throw error;
    return Response.json(data);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { id } = await request.json();
    if (!id) return Response.json({ error: "Missing id" }, { status: 400 });
    const { error } = await serviceClient.from("members").delete().eq("id", id);
    if (error) throw error;
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
