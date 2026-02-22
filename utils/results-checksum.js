/**
 * utils/results-checksum.js
 * SHA-256 checksum for election result tamper detection.
 * Uses Node crypto on server, Web Crypto API in browser.
 */

export async function computeResultChecksum({
  electionId,
  candidateId,
  lga,
  ward,
  pollingUnit,
  votesCast,
  accreditedVoters,
  registeredVoters,
}) {
  const canonical = [
    electionId,
    candidateId,
    lga.trim().toLowerCase(),
    ward.trim().toLowerCase(),
    pollingUnit.trim().toLowerCase(),
    String(votesCast),
    String(accreditedVoters),
    String(registeredVoters),
  ].join("|");

  return sha256Hex(canonical);
}

export async function verifyResultChecksum(record, storedChecksum) {
  const recomputed = await computeResultChecksum({
    electionId: record.election_id,
    candidateId: record.candidate_id,
    lga: record.lga,
    ward: record.ward,
    pollingUnit: record.polling_unit,
    votesCast: record.votes_cast,
    accreditedVoters: record.accredited_voters,
    registeredVoters: record.registered_voters,
  });
  return {
    valid: recomputed === storedChecksum,
    recomputed,
    stored: storedChecksum,
  };
}

export async function batchVerifyChecksums(records) {
  const results = await Promise.all(
    records.map(async (record) => {
      const { valid, recomputed, stored } = await verifyResultChecksum(
        record,
        record.checksum,
      );
      return { record, valid, stored, recomputed };
    }),
  );
  return results.filter((r) => !r.valid);
}

// ─────────────────────────────────────────
// SHA-256 — works in Node 18+ and browser
// ─────────────────────────────────────────

async function sha256Hex(message) {
  // Node.js environment
  if (typeof process !== "undefined" && process.versions?.node) {
    const { createHash } = await import("crypto");
    return createHash("sha256").update(message, "utf8").digest("hex");
  }

  // Browser — Web Crypto API
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuf = await crypto.subtle.digest("SHA-256", data);
  const hashArr = Array.from(new Uint8Array(hashBuf));
  return hashArr.map((b) => b.toString(16).padStart(2, "0")).join("");
}
