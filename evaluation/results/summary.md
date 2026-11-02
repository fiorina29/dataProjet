# Résultats de l'évaluation MoodWave

Exécution : 2026-11-02T20:40:12.226Z · modèle Gemini : gemini-3.1-flash-lite · 24 profils · playlists de 20 titres.

Dataset : 114000 lignes brutes → 113842 après nettoyage (1 incomplètes, 157 invalides) → 81021 titres uniques, 114 genres, 29794 artistes.

## Moyennes ± écart-type sur les profils

| Métrique | Aléatoire | Popularité (genre) | MoodWave local | Gemini (brut) | MoodWave + Gemini |
|---|---|---|---|---|---|
| Distance audio ↓ | 0.708 ± 0.099 | 0.615 ± 0.148 | 0.124 ± 0.053 | 0.191 ± 0.086 | 0.173 ± 0.068 |
| Écart valence ↓ | 0.294 ± 0.073 | 0.257 ± 0.083 | 0.053 ± 0.023 | 0.075 ± 0.053 | 0.069 ± 0.038 |
| Écart énergie ↓ | 0.297 ± 0.076 | 0.246 ± 0.098 | 0.047 ± 0.021 | 0.066 ± 0.042 | 0.060 ± 0.030 |
| Précision genre favori ↑ | 2.5 % ± 2.6 | 100.0 % ± 0.0 | 97.9 % ± 5.0 | 92.1 % ± 11.6 | 92.9 % ± 12.3 |
| Titres artiste favori (/20) | 0.0 ± 0.0 | 3.5 ± 4.0 | 5.5 ± 3.5 | 7.8 ± 0.7 | 7.0 ± 3.3 |
| Diversité artistes ↑ | 99.8 % ± 1.0 | 68.8 % ± 11.1 | 84.6 % ± 16.7 | 78.3 % ± 19.5 | 82.3 % ± 20.9 |
| Violations activité ↓ | 52.5 % ± 29.3 | 46.5 % ± 29.1 | 0.5 % ± 1.6 | 7.0 % ± 11.8 | 3.5 % ± 5.3 |
| Popularité moyenne | 35.6 ± 4.7 | 88.7 ± 8.5 | 59.9 ± 9.2 | 58.4 ± 11.8 | 58.8 ± 11.6 |
| Latence (ms) | 0 ± 0 | 41 ± 14 | 959 ± 228 | 11448 ± 28668 | 12415 ± 28656 |
| IDs invalides Gemini ↓ | — | — | — | 0.0 % ± 0.0 | 0.0 % ± 0.0 |

Précision genre : profils avec genre favori uniquement. Titres artiste : profils avec artiste favori. Violations : profils dont l'activité impose des règles (fête, sport, sommeil, enfants).

## Taux de violation par activité

| Activité | Aléatoire | Popularité (genre) | MoodWave local | Gemini (brut) | MoodWave + Gemini |
|---|---|---|---|---|---|
| enfant | 2 % | 25 % | 0 % | 2 % | 5 % |
| fete | 70 % | 52 % | 0 % | 7 % | 2 % |
| sommeil | 80 % | 92 % | 0 % | 0 % | 0 % |
| sport | 50 % | 25 % | 2 % | 15 % | 7 % |
