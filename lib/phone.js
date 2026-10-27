// lib/phone.js
// Nigerian mobile number handling, shared by the registration forms (client)
// and the register-member API routes (server).
//
// Canonical stored format: 11 digits, 0 + network prefix, e.g. 08012345678.
// Accepted input variants: +234…, 234…, spaces/dashes/dots, a letter "O"
// typed for zero, and a missing leading 0 (8012345678).

const VALID_PHONE = /^0[789][01]\d{8}$/;

export const PHONE_ERROR =
  "Enter a valid 11-digit phone number, e.g. 08012345678";

// Returns the canonical 0XXXXXXXXXX form, or null if it isn't a valid number.
export function normalizeNigerianPhone(input) {
  let digits = String(input ?? "")
    .replace(/[oO]/g, "0")
    .replace(/\D/g, "");

  if (digits.length === 13 && digits.startsWith("234")) {
    digits = "0" + digits.slice(3);
  } else if (digits.length === 10 && /^[789]/.test(digits)) {
    digits = "0" + digits;
  }

  return VALID_PHONE.test(digits) ? digits : null;
}

// Keystroke filter for phone inputs: digits only, capped at 11 — or 13 while
// the number is being typed/pasted in 234… form, which is then converted.
export function sanitizePhoneInput(value) {
  const digits = String(value ?? "")
    .replace(/[oO]/g, "0")
    .replace(/\D/g, "");

  if (digits.startsWith("234")) {
    const capped = digits.slice(0, 13);
    return capped.length === 13 ? "0" + capped.slice(3) : capped;
  }
  return digits.slice(0, 11);
}
