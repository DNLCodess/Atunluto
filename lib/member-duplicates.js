// lib/member-duplicates.js
// Duplicate-registration detection for the members table.
//
// A registration is treated as a duplicate when BOTH the phone number and the
// name match an existing member. Phone alone is not enough — families and ward
// agents legitimately register several different people from one phone.
//
// Phones are stored in mixed formats (0803…, +234803…, 234803…, with spaces,
// stray dots/commas), so they are compared on their last 10 digits. Names are
// compared case-, punctuation- and word-order-insensitively, so "Shagari
// Muhammad" matches "MUHAMMAD SHAGARI".

export const MEMBER_RETURN_COLUMNS =
  "id, full_name, membership_number, lga, ward, polling_unit, polling_unit_code, gender, profile_image_url";

export function normalizePhone(phone) {
  const digits = String(phone ?? "").replace(/\D/g, "");
  return digits.length > 10 ? digits.slice(-10) : digits;
}

export function nameKey(fullName) {
  return String(fullName ?? "")
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .sort()
    .join(" ");
}

export function isSameMember(a, b) {
  const phone = normalizePhone(a.phone);
  return (
    phone.length > 0 &&
    phone === normalizePhone(b.phone) &&
    nameKey(a.full_name) === nameKey(b.full_name)
  );
}

// Returns the earliest existing member matching phone + name, or null.
export async function findDuplicateMember(client, { phone, full_name }) {
  const phoneDigits = normalizePhone(phone);
  if (!phoneDigits) return { data: null, error: null };

  const { data, error } = await client
    .from("members")
    .select(`${MEMBER_RETURN_COLUMNS}, phone, created_at`)
    .like("phone", `%${phoneDigits}%`)
    .order("created_at", { ascending: true });

  if (error) return { data: null, error };

  const match = data.find((m) => isSameMember(m, { phone, full_name }));
  if (!match) return { data: null, error: null };

  const { phone: _phone, created_at: _createdAt, ...member } = match;
  return { data: member, error: null };
}
