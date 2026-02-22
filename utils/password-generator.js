/**
 * lib/utils/passwordGenerator.js
 * Cryptographically secure password generation for LGA Admin accounts
 */

const UPPERCASE = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // removed I, O (look like 1, 0)
const LOWERCASE = "abcdefghjkmnpqrstuvwxyz"; // removed i, l, o
const DIGITS = "23456789"; // removed 0, 1
const SYMBOLS = "!@#$%^&*+-=?";

const ALL_CHARS = UPPERCASE + LOWERCASE + DIGITS + SYMBOLS;

/**
 * Generates a cryptographically random 12-character password.
 * Guarantees: at least 1 uppercase, 1 lowercase, 1 digit, 1 symbol.
 * Uses Web Crypto API (works in both Node 18+ and browser).
 */
export function generateSecurePassword(length = 12) {
  // Pick one guaranteed character from each required class
  const required = [
    randomChar(UPPERCASE),
    randomChar(LOWERCASE),
    randomChar(DIGITS),
    randomChar(SYMBOLS),
  ];

  // Fill the rest randomly from the full charset
  const rest = Array.from({ length: length - required.length }, () =>
    randomChar(ALL_CHARS),
  );

  // Shuffle so the guaranteed chars aren't always at the start
  return shuffle([...required, ...rest]).join("");
}

function randomChar(charset) {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return charset[arr[0] % charset.length];
}

function shuffle(arr) {
  // Fisher-Yates using crypto random
  for (let i = arr.length - 1; i > 0; i--) {
    const j = cryptoRandInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function cryptoRandInt(max) {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return arr[0] % max;
}

/**
 * Validates a password meets minimum requirements.
 * Use for checking user-supplied new passwords on change.
 */
export function validatePasswordStrength(password) {
  const errors = [];

  if (password.length < 8)
    errors.push("Password must be at least 8 characters long.");
  if (!/[A-Z]/.test(password))
    errors.push("Password must contain at least one uppercase letter.");
  if (!/[a-z]/.test(password))
    errors.push("Password must contain at least one lowercase letter.");
  if (!/[0-9]/.test(password))
    errors.push("Password must contain at least one number.");
  if (!/[!@#$%^&*+\-=?_]/.test(password))
    errors.push("Password must contain at least one symbol (!@#$%^&*+-=?_).");

  return { valid: errors.length === 0, errors };
}
