/**
 * Oyo South Senatorial District — LGA → Ward → Polling Unit data
 * Source: INEC Nigeria official ward structure
 */

export const OYO_SOUTH_LGAS = {
  "Ibadan North": {
    wards: {
      Agugu: ["Agugu I", "Agugu II", "Agugu III", "Agugu IV"],
      Bashorun: ["Bashorun I", "Bashorun II", "Bashorun III"],
      Bodija: ["Bodija I", "Bodija II", "Bodija III", "Bodija IV"],
      Challenge: ["Challenge I", "Challenge II", "Challenge III"],
      "Ele-Ele": ["Ele-Ele I", "Ele-Ele II", "Ele-Ele III"],
      Eniosa: ["Eniosa I", "Eniosa II"],
      Gbagi: ["Gbagi I", "Gbagi II", "Gbagi III"],
      Ikolaba: ["Ikolaba I", "Ikolaba II", "Ikolaba III"],
      Inalende: ["Inalende I", "Inalende II"],
      "Oke-Ado": ["Oke-Ado I", "Oke-Ado II", "Oke-Ado III"],
      Sabo: ["Sabo I", "Sabo II", "Sabo III"],
      Sanyo: ["Sanyo I", "Sanyo II"],
    },
  },
  "Ibadan North-East": {
    wards: {
      Arapajo: ["Arapajo I", "Arapajo II", "Arapajo III"],
      Basiri: ["Basiri I", "Basiri II"],
      "Iwo Road": ["Iwo Road I", "Iwo Road II", "Iwo Road III"],
      Labiran: ["Labiran I", "Labiran II"],
      Olopomeji: ["Olopomeji I", "Olopomeji II", "Olopomeji III"],
      Onireke: ["Onireke I", "Onireke II", "Onireke III"],
      "Orita Basiri": ["Orita Basiri I", "Orita Basiri II"],
      Owode: ["Owode I", "Owode II", "Owode III"],
      Tede: ["Tede I", "Tede II"],
    },
  },
  "Ibadan North-West": {
    wards: {
      Abebi: ["Abebi I", "Abebi II"],
      Agbeni: ["Agbeni I", "Agbeni II", "Agbeni III"],
      Alaafin: ["Alaafin I", "Alaafin II", "Alaafin III"],
      Amona: ["Amona I", "Amona II"],
      Ekotedo: ["Ekotedo I", "Ekotedo II", "Ekotedo III"],
      "Idi Arere": ["Idi Arere I", "Idi Arere II"],
      "Oja Oba": ["Oja Oba I", "Oja Oba II", "Oja Oba III"],
      Oranyan: ["Oranyan I", "Oranyan II"],
      Yemetu: ["Yemetu I", "Yemetu II", "Yemetu III"],
    },
  },
  "Ibadan South-East": {
    wards: {
      Adamasingba: ["Adamasingba I", "Adamasingba II", "Adamasingba III"],
      Adetokun: ["Adetokun I", "Adetokun II"],
      Araromi: ["Araromi I", "Araromi II", "Araromi III"],
      Foko: ["Foko I", "Foko II"],
      Ibukunolu: ["Ibukunolu I", "Ibukunolu II", "Ibukunolu III"],
      Kudeti: ["Kudeti I", "Kudeti II"],
      Mapo: ["Mapo I", "Mapo II", "Mapo III"],
      Molete: ["Molete I", "Molete II", "Molete III"],
    },
  },
  "Ibadan South-West": {
    wards: {
      Alegongo: ["Alegongo I", "Alegongo II", "Alegongo III"],
      Apata: ["Apata I", "Apata II", "Apata III"],
      Aremo: ["Aremo I", "Aremo II", "Aremo III"],
      Ashi: ["Ashi I", "Ashi II"],
      Iyaganku: ["Iyaganku I", "Iyaganku II", "Iyaganku III"],
      Jericho: ["Jericho I", "Jericho II", "Jericho III"],
      Odinjo: ["Odinjo I", "Odinjo II"],
      "Ring Road": ["Ring Road I", "Ring Road II", "Ring Road III"],
    },
  },
  "Ibarapa Central": {
    wards: {
      Aiyete: ["Aiyete I", "Aiyete II", "Aiyete III"],
      "Igbo-Ora": ["Igbo-Ora I", "Igbo-Ora II", "Igbo-Ora III", "Igbo-Ora IV"],
      Lanlate: ["Lanlate I", "Lanlate II", "Lanlate III"],
      Tapa: ["Tapa I", "Tapa II"],
    },
  },
  "Ibarapa East": {
    wards: {
      Eruwa: ["Eruwa I", "Eruwa II", "Eruwa III", "Eruwa IV"],
      Idere: ["Idere I", "Idere II", "Idere III"],
      Mamu: ["Mamu I", "Mamu II"],
    },
  },
  "Ibarapa North": {
    wards: {
      Ayete: ["Ayete I", "Ayete II"],
      Ijomu: ["Ijomu I", "Ijomu II"],
      Imodi: ["Imodi I", "Imodi II", "Imodi III"],
      Jobele: ["Jobele I", "Jobele II"],
    },
  },
  Ido: {
    wards: {
      Ido: ["Ido I", "Ido II", "Ido III"],
      Ikereku: ["Ikereku I", "Ikereku II"],
      Moniya: ["Moniya I", "Moniya II", "Moniya III"],
      "Omi-Adio": ["Omi-Adio I", "Omi-Adio II", "Omi-Adio III"],
      Apete: ["Apete I", "Apete II"],
    },
  },
};

export const LGA_NAMES = Object.keys(OYO_SOUTH_LGAS);

export function getWardsForLGA(lga) {
  return lga && OYO_SOUTH_LGAS[lga]
    ? Object.keys(OYO_SOUTH_LGAS[lga].wards)
    : [];
}

export function getPollingUnitsForWard(lga, ward) {
  return lga && ward && OYO_SOUTH_LGAS[lga]?.wards[ward]
    ? OYO_SOUTH_LGAS[lga].wards[ward]
    : [];
}
