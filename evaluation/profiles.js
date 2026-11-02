// evaluation/profiles.js
// 24 profils de test : chaque humeur (12) apparaît 2 fois, chaque activité (10) au moins 2 fois,
// 12 avec un genre favori, 8 avec un artiste favori, 6 météos différentes.
// Les identifiants d'humeur / d'activité sont ceux envoyés par l'interface (src/data/uiOptions.js).

export const PROFILES = [
  { id: "P01", humeur: "joyeux",      activite: "fete",       meteo: "soleil",  genre: "",          artiste: "" },
  { id: "P02", humeur: "triste",      activite: "detente",    meteo: "pluie",   genre: "acoustic",  artiste: "" },
  { id: "P03", humeur: "energetique", activite: "sport",      meteo: "nuageux", genre: "edm",       artiste: "Avicii" },
  { id: "P04", humeur: "chill",       activite: "travail",    meteo: "brume",   genre: "",          artiste: "" },
  { id: "P05", humeur: "nostalgique", activite: "voiture",    meteo: "pluie",   genre: "rock",      artiste: "Arctic Monkeys" },
  { id: "P06", humeur: "concentre",   activite: "travail",    meteo: "nuageux", genre: "classical", artiste: "" },
  { id: "P07", humeur: "stresse",     activite: "sommeil",    meteo: "pluie",   genre: "",          artiste: "" },
  { id: "P08", humeur: "amoureux",    activite: "romantique", meteo: "soleil",  genre: "r-n-b",     artiste: "The Weeknd" },
  { id: "P09", humeur: "colere",      activite: "sport",      meteo: "orage",   genre: "metal",     artiste: "Metallica" },
  { id: "P10", humeur: "reveur",      activite: "marche",     meteo: "neige",   genre: "",          artiste: "" },
  { id: "P11", humeur: "motivant",    activite: "sport",      meteo: "soleil",  genre: "hip-hop",   artiste: "Drake" },
  { id: "P12", humeur: "sombre",      activite: "voiture",    meteo: "orage",   genre: "",          artiste: "" },
  { id: "P13", humeur: "joyeux",      activite: "enfant",     meteo: "soleil",  genre: "",          artiste: "" },
  { id: "P14", humeur: "triste",      activite: "sommeil",    meteo: "neige",   genre: "piano",     artiste: "" },
  { id: "P15", humeur: "energetique", activite: "fete",       meteo: "nuageux", genre: "latino",    artiste: "Bad Bunny" },
  { id: "P16", humeur: "chill",       activite: "cuisine",    meteo: "soleil",  genre: "jazz",      artiste: "" },
  { id: "P17", humeur: "nostalgique", activite: "cuisine",    meteo: "brume",   genre: "",          artiste: "" },
  { id: "P18", humeur: "concentre",   activite: "detente",    meteo: "pluie",   genre: "",          artiste: "" },
  { id: "P19", humeur: "stresse",     activite: "marche",     meteo: "nuageux", genre: "",          artiste: "" },
  { id: "P20", humeur: "amoureux",    activite: "fete",       meteo: "soleil",  genre: "pop",       artiste: "Taylor Swift" },
  { id: "P21", humeur: "colere",      activite: "voiture",    meteo: "orage",   genre: "",          artiste: "" },
  { id: "P22", humeur: "reveur",      activite: "romantique", meteo: "neige",   genre: "",          artiste: "" },
  { id: "P23", humeur: "motivant",    activite: "enfant",     meteo: "nuageux", genre: "k-pop",     artiste: "BTS" },
  { id: "P24", humeur: "sombre",      activite: "detente",    meteo: "brume",   genre: "",          artiste: "" },
];

const WEATHER_DESC = {
  soleil: "Ciel dégagé / Ensoleillé",
  pluie: "Pluie / Averses en direct",
  nuageux: "Nuageux / Couvert",
  orage: "Orage et éclairs",
  neige: "Chutes de neige",
  brume: "Brouillard / Brume",
};

/** Transforme un profil de test en requête identique à celle envoyée par l'interface. */
export function profileToPayload(p) {
  return {
    utilisateur: {
      prenom: "Test",
      age: 22,
      genre_musical_prefere: p.genre || "Pas de préférence",
      artiste_prefere: p.artiste || "",
      ville: "Paris",
    },
    contexte: { humeur: p.humeur, contexte_activite: p.activite, meteo: p.meteo },
    temperature: 15,
    weatherDescription: WEATHER_DESC[p.meteo],
  };
}
