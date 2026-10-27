// app/api/admin/register-member/route.js
import { createClient } from "@/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import {
  findDuplicateMember,
  MEMBER_RETURN_COLUMNS,
} from "@/lib/member-duplicates";
import { normalizeNigerianPhone, PHONE_ERROR } from "@/lib/phone";

const serviceClient = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const VALID_GENDERS = ["male", "female", "prefer_not_to_say"];
const ALLOWED_ROLES = [
  "state_admin",
  "super_user",
  "administrator",
  "registration",
];

export async function POST(request) {
  try {
    // ── Auth ────────────────────────────────────────────────────────────────
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

    if (!ALLOWED_ROLES.includes(actor.role)) {
      return Response.json(
        { error: "You do not have permission to register members." },
        { status: 403 },
      );
    }

    // ── Parse body ───────────────────────────────────────────────────────────
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
      polling_unit_code,
      profile_image_url,
    } = body;

    // ── Required fields ──────────────────────────────────────────────────────
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

    // ── Age ──────────────────────────────────────────────────────────────────
    const ageMs = Date.now() - new Date(date_of_birth).getTime();
    if (ageMs / (1000 * 60 * 60 * 24 * 365.25) < 18) {
      return Response.json(
        { error: "Member must be at least 18 years old." },
        { status: 400 },
      );
    }

    // ── Gender ───────────────────────────────────────────────────────────────
    if (!VALID_GENDERS.includes(gender)) {
      return Response.json({ error: "Invalid gender value." }, { status: 400 });
    }

    // ── Phone format — stored canonically as 0XXXXXXXXXX ─────────────────────
    const phoneNumber = normalizeNigerianPhone(phone);
    const whatsappNumber = normalizeNigerianPhone(whatsapp);
    if (!phoneNumber) {
      return Response.json(
        { error: `Phone: ${PHONE_ERROR}.` },
        { status: 400 },
      );
    }
    if (!whatsappNumber) {
      return Response.json(
        { error: `WhatsApp: ${PHONE_ERROR}.` },
        { status: 400 },
      );
    }

    // ── LGA scope — non-state-admin can only register in their own LGA ───────
    if (actor.role !== "state_admin" && lga !== actor.lga) {
      return Response.json(
        { error: "You can only register members in your assigned LGA." },
        { status: 403 },
      );
    }

    // ── Validate LGA + ward + polling unit against oyo_south_polling_units ───
    // Some polling units share the same pu_name within a ward, so the client
    // sends pu_code too (pu_code is unique within a ward) — prefer that for
    // an unambiguous lookup, falling back to pu_name for older cached clients.
    const { data: puRow, error: puLookupError } = await serviceClient
      .from("oyo_south_polling_units")
      .select("id, pu_code, pu_name")
      .eq("lga", lga)
      .eq("ward_name", ward)
      .eq(
        polling_unit_code ? "pu_code" : "pu_name",
        polling_unit_code || polling_unit,
      )
      .limit(1)
      .maybeSingle();

    if (puLookupError) {
      console.error("PU validation query error:", puLookupError);
      return Response.json(
        { error: "Could not validate location data. Please try again." },
        { status: 500 },
      );
    }

    if (!puRow) {
      // Narrow down the error so the client gets a useful message
      const { count: lgaCount } = await serviceClient
        .from("oyo_south_polling_units")
        .select("id", { count: "exact", head: true })
        .eq("lga", lga);

      if (!lgaCount) {
        return Response.json({ error: "Invalid LGA." }, { status: 400 });
      }

      const { count: wardCount } = await serviceClient
        .from("oyo_south_polling_units")
        .select("id", { count: "exact", head: true })
        .eq("lga", lga)
        .eq("ward_name", ward);

      if (!wardCount) {
        return Response.json(
          { error: "Invalid ward for the selected LGA." },
          { status: 400 },
        );
      }

      return Response.json(
        { error: "Invalid polling unit for the selected ward." },
        { status: 400 },
      );
    }

    // ── Duplicate check ──────────────────────────────────────────────────────
    // Same phone AND same name as an existing member → return that member
    // instead of creating a second record (e.g. a double-tapped submit).
    const { data: existing, error: dupLookupError } = await findDuplicateMember(
      serviceClient,
      { phone: phoneNumber, full_name },
    );

    if (dupLookupError) {
      console.error("Duplicate check query error:", dupLookupError);
      return Response.json(
        { error: "Could not verify registration. Please try again." },
        { status: 500 },
      );
    }

    if (existing) {
      // The lookup spans all LGAs so a person can't be registered twice, but
      // LGA-scoped admins only get the record back if it's in their own LGA.
      if (actor.role !== "state_admin" && existing.lga !== actor.lga) {
        return Response.json(
          {
            error:
              "This person is already registered in another LGA. Please contact the state admin.",
            duplicate: true,
          },
          { status: 409 },
        );
      }
      return Response.json(
        {
          error: `${existing.full_name} is already registered (Membership No. ${existing.membership_number}).`,
          duplicate: true,
          data: existing,
        },
        { status: 409 },
      );
    }

    // ── Insert ───────────────────────────────────────────────────────────────
    const { data, error } = await serviceClient
      .from("members")
      .insert({
        full_name: full_name.trim(),
        date_of_birth,
        gender,
        address: address.trim(),
        phone: phoneNumber,
        whatsapp: whatsappNumber,
        messenger: messenger?.trim() || null,
        lga,
        ward,
        polling_unit,
        // Store the canonical code from the matched DB row, not the raw
        // client value, so it's trustworthy even if the client is stale.
        polling_unit_code: puRow.pu_code,
        profile_image_url: profile_image_url || null,
      })
      .select(MEMBER_RETURN_COLUMNS)
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
