// src/data/uiOptions.js
// Options affichées dans l'interface (humeurs, activités, météo).
// Le catalogue musical lui-même est chargé côté serveur depuis data/dataset.csv.

const AVAILABLE_GENRES = [
  "Pas de pr\xE9f\xE9rence",
  "Pop",
  "Rock",
  "Hip-Hop / Rap",
  "R&B / Soul",
  "\xC9lectronique / EDM",
  "Indie / Alternative",
  "Acoustique / Folk",
  "Jazz / Blues",
  "Classique",
  "Chanson Fran\xE7aise",
  "Latino / Reggaeton",
  "Metal / Hard Rock",
  "Ambient / Chill",
  "Disco / Funk",
  "Musique pour Enfants (Kids / Disney)"
];
const MOOD_OPTIONS = [
  { id: "joyeux", label: "Joyeux / Solaire", emoji: "\u2600\uFE0F", color: "from-amber-400 to-orange-400" },
  { id: "triste", label: "M\xE9lancolique / Triste", emoji: "\u{1F327}\uFE0F", color: "from-blue-400 to-indigo-500" },
  { id: "energetique", label: "Survolt\xE9 / \xC9nergie", emoji: "\u26A1", color: "from-red-400 to-rose-500" },
  { id: "chill", label: "Paisible / Chill", emoji: "\u{1F33F}", color: "from-emerald-400 to-teal-500" },
  { id: "nostalgique", label: "Nostalgique / R\xE9tro", emoji: "\u{1F4FB}", color: "from-purple-400 to-violet-500" },
  { id: "concentre", label: "Hyper-concentr\xE9", emoji: "\u{1F3AF}", color: "from-cyan-400 to-blue-500" },
  { id: "stresse", label: "Besoin de d\xE9stresser", emoji: "\u{1F9D8}", color: "from-teal-400 to-emerald-500" },
  { id: "amoureux", label: "Amoureux / Romantique", emoji: "\u{1F496}", color: "from-pink-400 to-rose-400" },
  { id: "colere", label: "D\xE9fouloir / \xC9nerv\xE9", emoji: "\u{1F525}", color: "from-orange-500 to-red-600" },
  { id: "reveur", label: "R\xEAveur / Flottant", emoji: "\u2601\uFE0F", color: "from-indigo-300 to-purple-400" },
  { id: "motivant", label: "Conqu\xE9rant / Motivation", emoji: "\u{1F3C6}", color: "from-yellow-400 to-amber-500" },
  { id: "sombre", label: "Nocturne / Sombre", emoji: "\u{1F319}", color: "from-slate-600 to-slate-800" }
];
const CONTEXT_OPTIONS = [
  { id: "voiture", label: "En voiture / Road Trip", emoji: "\u{1F697}" },
  { id: "fete", label: "F\xEAte / Soir\xE9e", emoji: "\u{1F389}" },
  { id: "enfant", label: "Avec enfants / Famille", emoji: "\u{1F476}" },
  { id: "sport", label: "Sport / Workout", emoji: "\u{1F3C3}" },
  { id: "travail", label: "Travail / \xC9tudes", emoji: "\u{1F4BB}" },
  { id: "detente", label: "D\xE9tente / Cocon", emoji: "\u{1F6C1}" },
  { id: "cuisine", label: "Cuisine / Repas", emoji: "\u{1F373}" },
  { id: "sommeil", label: "Avant de dormir", emoji: "\u{1F6CC}" },
  { id: "marche", label: "Balade / Plein air", emoji: "\u{1F6B6}" },
  { id: "romantique", label: "D\xEEner romantique", emoji: "\u{1F377}" }
];
const WEATHER_OPTIONS = [
  { id: "pluie", label: "Pluie", icon: "\u{1F327}\uFE0F" },
  { id: "soleil", label: "Ensoleill\xE9", icon: "\u2600\uFE0F" },
  { id: "nuageux", label: "Nuageux", icon: "\u26C5" },
  { id: "orage", label: "Orage", icon: "\u26C8\uFE0F" },
  { id: "neige", label: "Neige", icon: "\u2744\uFE0F" },
  { id: "brume", label: "Brume", icon: "\u{1F32B}\uFE0F" }
];
export { AVAILABLE_GENRES, MOOD_OPTIONS, CONTEXT_OPTIONS, WEATHER_OPTIONS };
