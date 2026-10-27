/**
 * One-time cleanup: normalise members.phone / members.whatsapp to 0XXXXXXXXXX.
 *
 * Run from the project root:
 *   node --env-file=.env.local scripts/normalize-member-phones.mjs           # dry run
 *   node --env-file=.env.local scripts/normalize-member-phones.mjs --apply   # write changes
 *
 * - Numbers that can be fixed safely (+234…, spaces/dashes, letter "O",
 *   missing leading 0) are rewritten. A JSON backup of the original values is
 *   written to backups/ before anything is updated.
 * - Numbers that can't be fixed (wrong digit count etc.) are NOT touched; they
 *   are exported to backups/invalid-member-phones-<date>.csv for manual review.
 *
 * Safe to re-run: already-canonical numbers are skipped.
 */

import fs from "fs";
import { createClient } from "@supabase/supabase-js";
import { normalizeNigerianPhone } from "../lib/phone.js";

const APPLY = process.argv.includes("--apply");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// ── Helpers ───────────────────────────────────────────────────────────────────

async function fetchAllMembers() {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from("members")
      .select("id, membership_number, full_name, lga, ward, phone, whatsapp")
      .order("created_at", { ascending: true })
      .range(from, from + 999);
    if (error) throw error;
    rows.push(...data);
    if (data.length < 1000) return rows;
  }
}

function csvCell(value) {
  const s = String(value ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// ── Main ──────────────────────────────────────────────────────────────────────

const members = await fetchAllMembers();
const updates = [];
const invalid = [];

for (const m of members) {
  const change = {};
  const problems = [];

  for (const field of ["phone", "whatsapp"]) {
    const fixed = normalizeNigerianPhone(m[field]);
    if (!fixed) problems.push(field);
    else if (fixed !== m[field]) change[field] = fixed;
  }

  if (Object.keys(change).length) updates.push({ member: m, change });
  if (problems.length) invalid.push({ member: m, problems });
}

console.log(`Members scanned:         ${members.length}`);
console.log(`Rows fixable:            ${updates.length}`);
console.log(`Rows needing manual fix: ${invalid.length}`);
for (const { member, change } of updates.slice(0, 10)) {
  for (const [field, value] of Object.entries(change)) {
    console.log(
      `  ${member.membership_number} ${field}: "${member[field]}" → ${value}`,
    );
  }
}

const stamp = new Date().toISOString().slice(0, 10);
fs.mkdirSync("backups", { recursive: true });

const csvPath = `backups/invalid-member-phones-${stamp}.csv`;
const header =
  "membership_number,full_name,lga,ward,phone,whatsapp,invalid_fields";
const lines = invalid.map(({ member: m, problems }) =>
  [
    m.membership_number,
    m.full_name,
    m.lga,
    m.ward,
    m.phone,
    m.whatsapp,
    problems.join(" & "),
  ]
    .map(csvCell)
    .join(","),
);
fs.writeFileSync(csvPath, [header, ...lines].join("\n") + "\n");
console.log(`\nManual-review list written to ${csvPath}`);

if (!APPLY) {
  console.log("\nDry run — nothing changed. Re-run with --apply to write.");
  process.exit(0);
}

const backupPath = `backups/member-phones-before-normalize-${stamp}.json`;
fs.writeFileSync(
  backupPath,
  JSON.stringify(
    updates.map(({ member: m }) => ({
      id: m.id,
      phone: m.phone,
      whatsapp: m.whatsapp,
    })),
    null,
    1,
  ),
);
console.log(`Original values backed up to ${backupPath}`);

let updated = 0;
for (const { member, change } of updates) {
  const { error } = await supabase
    .from("members")
    .update(change)
    .eq("id", member.id);
  if (error) {
    console.error(`Failed ${member.membership_number}:`, error.message);
    continue;
  }
  updated++;
}
console.log(`Updated ${updated}/${updates.length} rows.`);
