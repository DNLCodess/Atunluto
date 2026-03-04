/**
 * Oyo South Senatorial District — LGA → Ward data
 * Source: INEC Nigeria official ward structure (scraped from eduweb.com.ng / inecnigeria.org)
 * Total: 99 wards across 9 LGAs, 2,499 polling units
 *
 * NOTE: Polling units are NOT stored in this file — they live in the database.
 * This file is used to populate the oyo_south_wards table and drive
 * the LGA → Ward cascading dropdowns in the member registration and ERMS forms.
 */

export const OYO_SOUTH_LGAS = {
  "Ibadan North": {
    wardCount: 12,
    pollingUnitCount: 512,
    wards: [
      { wardNumber: 1, wardName: "Ward I (N2)" },
      { wardNumber: 2, wardName: "Ward II (N3)" },
      { wardNumber: 3, wardName: "Ward III (N4)" },
      { wardNumber: 4, wardName: "Ward IV (N5A)" },
      { wardNumber: 5, wardName: "Ward V (N5B)" },
      { wardNumber: 6, wardName: "Ward VI (N6A Part I)" },
      { wardNumber: 7, wardName: "Ward VII (N6A Part II)" },
      { wardNumber: 8, wardName: "Ward VIII (N6A Part III)" },
      { wardNumber: 9, wardName: "Ward IX (N6B Part I)" },
      { wardNumber: 10, wardName: "Ward X (N6B Part II)" },
      { wardNumber: 11, wardName: "Ward XI (NW8)" },
      { wardNumber: 12, wardName: "Ward XII (NW8)" },
    ],
  },

  "Ibadan North-East": {
    wardCount: 12,
    pollingUnitCount: 336,
    wards: [
      { wardNumber: 1, wardName: "Ward I (E1)" },
      { wardNumber: 2, wardName: "Ward II (N1 Part II)" },
      { wardNumber: 3, wardName: "Ward III (E3)" },
      { wardNumber: 4, wardName: "Ward IV (E4)" },
      { wardNumber: 5, wardName: "Ward V (E5A)" },
      { wardNumber: 6, wardName: "Ward VI (E5B)" },
      { wardNumber: 7, wardName: "Ward VII (E6)" },
      { wardNumber: 8, wardName: "Ward VIII (E7 I)" },
      { wardNumber: 9, wardName: "Ward IX (E7 II)" },
      { wardNumber: 10, wardName: "Ward X (E8)" },
      { wardNumber: 11, wardName: "Ward XI (E9 I)" },
      { wardNumber: 12, wardName: "Ward XII (E9 II)" },
    ],
  },

  "Ibadan North-West": {
    wardCount: 11,
    pollingUnitCount: 240,
    wards: [
      { wardNumber: 1, wardName: "Ward 1 (N1 Part I)" },
      { wardNumber: 2, wardName: "Ward 2 (N1 Part II)" },
      { wardNumber: 3, wardName: "Ward 3 (NW1)" },
      { wardNumber: 4, wardName: "Ward 4 (NW2)" },
      { wardNumber: 5, wardName: "Ward 5 (NW3 Part I)" },
      { wardNumber: 6, wardName: "Ward 6 (NW3 Part II)" },
      { wardNumber: 7, wardName: "Ward 7 (NW4)" },
      { wardNumber: 8, wardName: "Ward 8 (NW5)" },
      { wardNumber: 9, wardName: "Ward 9 (NW6)" },
      { wardNumber: 10, wardName: "Ward 10 (NW7)" },
      { wardNumber: 11, wardName: "Ward 11 (NW7)" },
    ],
  },

  "Ibadan South-East": {
    wardCount: 12,
    pollingUnitCount: 473,
    wards: [
      { wardNumber: 1, wardName: "Ward 1 (CI)" },
      { wardNumber: 2, wardName: "Ward 2 (S1)" },
      { wardNumber: 3, wardName: "Ward 3 (S2A)" },
      { wardNumber: 4, wardName: "Ward 4 (S2B)" },
      { wardNumber: 5, wardName: "Ward 5 (S3)" },
      { wardNumber: 6, wardName: "Ward 6 (S4A)" },
      { wardNumber: 7, wardName: "Ward 7 (S4B)" },
      { wardNumber: 8, wardName: "Ward 8 (S5)" },
      { wardNumber: 9, wardName: "Ward 9 (S6A)" },
      { wardNumber: 10, wardName: "Ward 10 (S6B)" },
      { wardNumber: 11, wardName: "Ward 11 (S7A)" },
      { wardNumber: 12, wardName: "Ward 12 (S7B)" },
    ],
  },

  "Ibadan South-West": {
    wardCount: 12,
    pollingUnitCount: 352,
    wards: [
      { wardNumber: 1, wardName: "Ward 1 (C2)" },
      { wardNumber: 2, wardName: "Ward 2 (SW1)" },
      { wardNumber: 3, wardName: "Ward 3 (SW2)" },
      { wardNumber: 4, wardName: "Ward 4 (SW3A & 3B)" },
      { wardNumber: 5, wardName: "Ward 5 (SW4)" },
      { wardNumber: 6, wardName: "Ward 6 (SW5)" },
      { wardNumber: 7, wardName: "Ward 7 (SW6)" },
      { wardNumber: 8, wardName: "Ward 8 (SW7)" },
      { wardNumber: 9, wardName: "Ward 9 (SW8 I)" },
      { wardNumber: 10, wardName: "Ward 10 (SW8 II)" },
      { wardNumber: 11, wardName: "Ward 11 (SW9 I)" },
      { wardNumber: 12, wardName: "Ward 12 (SW9 II)" },
    ],
  },

  "Ibarapa Central": {
    wardCount: 10,
    pollingUnitCount: 140,
    wards: [
      { wardNumber: 1, wardName: "Idere I (Molete)" },
      { wardNumber: 2, wardName: "Idere II (Ominigbo/Oke-Oba)" },
      { wardNumber: 3, wardName: "Idere III (Koso/Apa)" },
      { wardNumber: 4, wardName: "Iberekodo I (Pataoju)" },
      { wardNumber: 5, wardName: "Iberekodo/Agbooro/Ita Baale" },
      { wardNumber: 6, wardName: "Idofin Isaganun" },
      { wardNumber: 7, wardName: "Igbole/Pako" },
      { wardNumber: 8, wardName: "Isale-Oba" },
      { wardNumber: 9, wardName: "Okeserin I & II" },
      { wardNumber: 10, wardName: "Oke-Odo" },
    ],
  },

  "Ibarapa East": {
    wardCount: 10,
    pollingUnitCount: 140,
    wards: [
      { wardNumber: 1, wardName: "Oke-Oba" },
      { wardNumber: 2, wardName: "Anko" },
      { wardNumber: 3, wardName: "Isaba" },
      { wardNumber: 4, wardName: "Aborerin" },
      { wardNumber: 5, wardName: "New Eruwa" },
      { wardNumber: 6, wardName: "Sango" },
      { wardNumber: 7, wardName: "Oke-Imale" },
      { wardNumber: 8, wardName: "Isale Togun" },
      { wardNumber: 9, wardName: "Oke Otun" },
      { wardNumber: 10, wardName: "Itabo" },
    ],
  },

  "Ibarapa North": {
    wardCount: 10,
    pollingUnitCount: 148,
    wards: [
      { wardNumber: 1, wardName: "Ayete I" },
      { wardNumber: 2, wardName: "Ayete II" },
      { wardNumber: 3, wardName: "Igangan I" },
      { wardNumber: 4, wardName: "Igangan II" },
      { wardNumber: 5, wardName: "Igangan III" },
      { wardNumber: 6, wardName: "Igangan IV" },
      { wardNumber: 7, wardName: "Ofiki I" },
      { wardNumber: 8, wardName: "Ofiki II" },
      { wardNumber: 9, wardName: "Tapa I" },
      { wardNumber: 10, wardName: "Tapa II" },
    ],
  },

  Ido: {
    wardCount: 10,
    pollingUnitCount: 158,
    wards: [
      { wardNumber: 1, wardName: "Aba Emo/Ilaju/Alako" },
      { wardNumber: 2, wardName: "Akufo/Idigba/Araromi" },
      { wardNumber: 3, wardName: "Akinware/Akindele" },
      { wardNumber: 4, wardName: "Apete/Ayegun/Awotan" },
      { wardNumber: 5, wardName: "Batake/Idi-Iya" },
      { wardNumber: 6, wardName: "Erinwusi/Koguo/Odetola" },
      { wardNumber: 7, wardName: "Fenwa/Oganla/Elenusonso" },
      { wardNumber: 8, wardName: "Ido/Onikede/Okuna Awo" },
      { wardNumber: 9, wardName: "Omi Adio/Omi Onigbagbo Bakatari" },
      { wardNumber: 10, wardName: "Ogundele/Alaho/Siba/Idi-Ahun" },
    ],
  },
};

// ─── Convenience helpers ──────────────────────────────────────────────────────

export const LGA_NAMES = Object.keys(OYO_SOUTH_LGAS);

/**
 * Returns an array of ward objects { wardNumber, wardName } for a given LGA.
 * Safe to call with null/undefined — returns [].
 */
export function getWardsForLGA(lga) {
  return lga && OYO_SOUTH_LGAS[lga] ? OYO_SOUTH_LGAS[lga].wards : [];
}

/**
 * Returns ward names only (strings) for use in simple select dropdowns.
 */
export function getWardNamesForLGA(lga) {
  return getWardsForLGA(lga).map((w) => w.wardName);
}

/**
 * Returns summary stats for a given LGA.
 */
export function getLGAStats(lga) {
  const entry = OYO_SOUTH_LGAS[lga];
  if (!entry) return null;
  return {
    lga,
    wardCount: entry.wardCount,
    pollingUnitCount: entry.pollingUnitCount,
  };
}

/**
 * Returns total ward and polling unit counts across the senatorial district.
 */
export function getDistrictTotals() {
  return Object.values(OYO_SOUTH_LGAS).reduce(
    (acc, { wardCount, pollingUnitCount }) => ({
      wards: acc.wards + wardCount,
      pollingUnits: acc.pollingUnits + pollingUnitCount,
    }),
    { wards: 0, pollingUnits: 0 },
  );
}
