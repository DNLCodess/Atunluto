import { createClient } from "@/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { OYO_SOUTH_LGAS } from "@/lib/oyo-south-lgas";

const serviceClient = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function POST(request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return Response.json({ error: "Unauthorised." }, { status: 401 });

    const { data: actor, error: actorError } = await supabase
      .from("admins")
      .select("role, lga, is_active")
      .eq("id", user.id)
      .single();

    if (actorError || !actor || !actor.is_active) {
      return Response.json({ error: "Unauthorised." }, { status: 401 });
    }

    const ALLOWED_ROLES = [
      "state_admin",
      "super_user",
      "administrator",
      "registration",
    ];
    if (!ALLOWED_ROLES.includes(actor.role)) {
      return Response.json(
        { error: "You do not have permission to register members." },
        { status: 403 },
      );
    }

    // JSON body — no file, no body size issues
    const body = await request.json();
    const {
      full_name,
      date_of_birth,
      gender,
      address,
      phone,
      whatsapp,
      messenger,
      lga,
      ward,
      polling_unit,
      profile_image_url,
    } = body;

    if (
      !full_name?.trim() ||
      !date_of_birth ||
      !gender ||
      !address?.trim() ||
      !phone?.trim() ||
      !whatsapp?.trim() ||
      !lga ||
      !ward ||
      !polling_unit
    ) {
      return Response.json(
        { error: "All required fields must be provided." },
        { status: 400 },
      );
    }

    const age =
      (Date.now() - new Date(date_of_birth).getTime()) /
      (1000 * 60 * 60 * 24 * 365.25);
    if (age < 18) {
      return Response.json(
        { error: "Member must be at least 18 years old." },
        { status: 400 },
      );
    }

    if (!["male", "female", "prefer_not_to_say"].includes(gender)) {
      return Response.json({ error: "Invalid gender value." }, { status: 400 });
    }

    if (actor.role !== "state_admin" && lga !== actor.lga) {
      return Response.json(
        { error: "You can only register members in your assigned LGA." },
        { status: 403 },
      );
    }

    if (!OYO_SOUTH_LGAS[lga]) {
      return Response.json({ error: "Invalid LGA." }, { status: 400 });
    }

    const validWards = Object.keys(OYO_SOUTH_LGAS[lga].wards || {});
    if (!validWards.includes(ward)) {
      return Response.json(
        { error: "Invalid ward for the selected LGA." },
        { status: 400 },
      );
    }

    const validPUs = OYO_SOUTH_LGAS[lga].wards[ward] || [];
    if (!validPUs.includes(polling_unit)) {
      return Response.json(
        { error: "Invalid polling unit for the selected ward." },
        { status: 400 },
      );
    }

    const { data, error } = await serviceClient
      .from("members")
      .insert({
        full_name: full_name.trim(),
        date_of_birth,
        gender,
        address: address.trim(),
        phone: phone.trim(),
        whatsapp: whatsapp.trim(),
        messenger: messenger?.trim() || null,
        lga,
        ward,
        polling_unit,
        profile_image_url: profile_image_url || null,
      })
      .select("id, full_name, membership_number, lga, ward")
      .single();

    if (error) {
      console.error("Member insert error:", error);
      if (error.message?.includes("check_age_18_plus")) {
        return Response.json(
          { error: "Member must be at least 18 years old." },
          { status: 400 },
        );
      }
      return Response.json(
        { error: "Failed to register member. Please try again." },
        { status: 500 },
      );
    }

    return Response.json({ success: true, data }, { status: 201 });
  } catch (err) {
    console.error("Register member error:", err);
    return Response.json({ error: "Internal server error." }, { status: 500 });
  }
}
