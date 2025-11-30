// app/api/admin/register-member/route.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

export async function POST(request) {
  try {
    const body = await request.json();

    const { data, error } = await supabaseAdmin
      .from("members")
      .insert([
        {
          full_name: body.full_name,
          address: body.address,
          phone: body.phone,
          whatsapp: body.whatsapp,
          messenger: body.messenger,
          lga: body.lga,
          ward: body.ward,
          polling_unit: body.polling_unit,
        },
      ])
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    return Response.json({ success: true, data }, { status: 200 });
  } catch (err) {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
