# MoodWave — Playlists selon l'humeur, l'activité et la météo 🎵

> Projet de Machine Learning / LLM — **CY Tech, ING3 option Business Intelligence**
> Dépôt : <https://github.com/fiorina29/dataProjet>

MoodWave génère en un clic une playlist de **20 titres minimum** adaptée à l'utilisateur :
son **humeur** (12 émotions), son **activité** (10 contextes : fête, sport, sommeil, enfants…),
la **météo en direct** (géolocalisation + Open-Meteo) et son **profil** (genre et artiste favoris).

Le moteur combine :
- un **dataset public Kaggle** de 114 000 titres et leurs caractéristiques audio Spotify ;
- un **moteur de similarité** (distance euclidienne pondérée sur 4 caractéristiques audio + règles par activité) ;
- un **LLM Google Gemini** qui choisit et ordonne les titres **uniquement parmi des candidats réels** du dataset (aucune hallucination possible) ;
- un **module d'évaluation** chiffré contre deux systèmes de référence.

---

## 👥 Auteurs

| Nom | Formation | Contribution |
|---|---|---|
| **Cloé GOACOLOU** | CY Tech — ING3, option BI | Conception, développement, évaluation, rapport |
| **Fiorina ROYCEE** | CY Tech — ING3, option BI | Conception, développement, évaluation, rapport |



---

## 🚀 Lancer le projet en local

### 1. Prérequis
- **Node.js 18 ou plus** (testé avec Node 22) — <https://nodejs.org/>
- **npm** (fourni avec Node.js)


### 2. Cloner le dépôt
```bash
git clone https://github.com/fiorina29/dataProjet.git
cd dataProjet
```
Le dataset (`data/dataset.csv`, 20 Mo) est inclus dans le dépôt.

### 3. Créer le fichier `.env`
À la racine du projet, créez un fichier `.env` :
```env
# Clé gratuite : https://aistudio.google.com/app/apikey
GEMINI_API_KEY="VOTRE_CLE_API_GEMINI"
# Modèle utilisé (par défaut : gemini-3.1-flash-lite)
GEMINI_MODEL="gemini-3.1-flash-lite"
PORT=3001
APP_URL="http://localhost:3001"
```
> Sans clé Gemini, l'application fonctionne quand même : elle bascule sur le **moteur local** (sans IA).
> Le fichier `.env` est exclu de Git par `.gitignore`. Ne le publiez jamais.

### 4. Installer et démarrer
```bash
npm install
npm run dev
```
Ouvrez <http://localhost:3001>. Le serveur Express charge le dataset au démarrage (≈ 2 à 3 s).

### 5. Utiliser l'application
1. Créez un compte (ou connectez-vous avec Google) : prénom, âge, ville, genre et artiste favoris.
2. Choisissez votre **humeur** et votre **activité**. La **météo** se remplit automatiquement.
3. Cliquez sur **« Générer la playlist »** : 20 titres minimum s'affichent, chacun avec une justification.
4. Bouton **« Tester l'API Gemini »** : vérifie la clé et la latence.
5. **Export YouTube** : ouvre la playlist directement sur YouTube.

---

## 🛠️ Commandes

| Commande | Action |
|---|---|
| `npm run dev` | Serveur Express + Vite sur `http://localhost:3001` |
| `npm run build` | Compile le front-end dans `dist/` |
| `npm run start` | Lance le serveur (`tsx server.jsx`) |
| `npm run lint` | Vérification statique (`tsc --noEmit`) |
| `npm run evaluate` | Évalue les 5 systèmes sur 24 profils (`-- --no-gemini` pour exclure l'IA) |
| `python evaluation/analyze.py` | Génère `evaluation/results/summary.md` et les figures |

---

## 📊 Dataset

| | |
|---|---|
| Source | [Spotify Tracks Dataset — Kaggle (maharshipandya)](https://www.kaggle.com/datasets/maharshipandya/-spotify-tracks-dataset) |
| Fichier | `data/dataset.csv` (20 Mo) |
| Taille brute | 114 000 lignes × 21 colonnes, 114 genres (1 000 titres par genre) |
| Nettoyage | 1 ligne incomplète + 157 lignes invalides (tempo ou durée nuls) supprimées → 113 842 lignes |
| Doublons | un même titre listé sous plusieurs genres → **81 021 titres uniques** (champ `all_genres`) |
| Variables | `valence`, `energy`, `danceability`, `acousticness`, `tempo`, `loudness`, `explicit`, `popularity`, `track_genre`, `artists` |

**Pourquoi Kaggle et pas l'API YouTube / Spotify ?** Depuis novembre 2024, Spotify a fermé l'accès aux
caractéristiques audio (`audio-features`) pour les nouvelles applications. YouTube ne fournit aucune donnée
audio (énergie, valence…), seulement des métadonnées. Le dataset Kaggle est public, stable, reproductible et
contient exactement les variables nécessaires.

---

## 🧠 Pipeline de recommandation

1. **Cibles audio** (`computeAudioTargets`, `src/data/moodwaveRules.js`) : l'humeur fixe un vecteur
   (valence, énergie, dansabilité, acoustique), l'activité le contraint (ex. fête : énergie ≥ 0,78),
   la météo l'ajuste (pluie : valence −0,07).
2. **Pré-sélection** (`buildCandidatePool`) : ~150 candidats parmi 81 021 titres — artiste favori, genre favori,
   genres voisins, puis plus proches voisins de l'ambiance (distance euclidienne + a priori de popularité).
3. **Gemini** (`src/server/playlistPipeline.js`) : choisit 25 identifiants parmi les candidats, les ordonne et
   justifie chaque choix. Sortie JSON contrainte par un schéma. Le serveur **rejette tout identifiant inventé**
   et relance si moins de 20 sont valides.
4. **Classement final** (`rankTracksFromDataset`, `src/data/recommender.js`) : règles strictes par activité
   (pas de titre explicite avec des enfants, pas de titre calme au sport…), pénalités hors genre favori,
   bonus artiste favori (8 titres max.), choix de Gemini en tête, suppression des doublons de versions.

Sans clé Gemini ou en cas d'erreur, l'application utilise le **moteur local** (étapes 1, 2 et 4).

---

## 📈 Évaluation

```bash
npm run evaluate                  # 5 systèmes (nécessite GEMINI_API_KEY ; réponses mises en cache)
npm run evaluate -- --no-gemini   # systèmes sans IA uniquement
pip install -r evaluation/requirements.txt
python evaluation/analyze.py
```

**Protocole** : 24 profils (`evaluation/profiles.js`) couvrant les 12 humeurs, les 10 activités, 6 météos,
12 genres et 8 artistes favoris. Chaque système produit 20 titres.

**Résultats** (fournis dans `evaluation/results/`, exécution du 02/11/2026 avec `gemini-3.1-flash-lite`) :

| Métrique | Aléatoire | Popularité (genre) | MoodWave local | Gemini (brut) | MoodWave + Gemini |
|---|---|---|---|---|---|
| Distance audio ↓ | 0.708 | 0.615 | **0.124** | 0.191 | 0.173 |
| Précision genre favori ↑ | 2.5 % | 100 % | 97.9 % | 92.1 % | 92.9 % |
| Titres artiste favori (/20) | 0.0 | 3.5 | 5.5 | **7.8** | 7.0 |
| Diversité artistes ↑ | 99.8 % | 68.8 % | 84.6 % | 78.3 % | 82.3 % |
| Violations activité ↓ | 52.5 % | 46.5 % | **0.5 %** | 7.0 % | 3.5 % |
| IDs inventés par Gemini ↓ | — | — | — | **0 %** | **0 %** |

---

## 📁 Architecture

```
├── server.jsx                  # Serveur Express + API Gemini (@google/genai)
├── data/dataset.csv            # Spotify Tracks Dataset (Kaggle)
├── evaluation/                 # Profils, script d'évaluation, résultats, figures
├── src/
│   ├── App.jsx                 # Composant racine React
│   ├── components/             # UI : humeur/météo, table de titres, modales, connexion
│   ├── data/
│   │   ├── datasetLoader.js    # Lecture + nettoyage du CSV
│   │   ├── moodwaveRules.js    # Humeur/activité/météo → cibles audio, familles de genres
│   │   ├── recommender.js      # Classement final
│   │   └── uiOptions.js        # Humeurs, activités, météos
│   ├── server/playlistPipeline.js  # Candidats → Gemini → validation → classement
│   └── services/               # Gemini, catalogue, météo, auth, export YouTube
└── vite.config.jsx             # Vite + Tailwind CSS v4
```

**Technologies** : React 19, Vite, Tailwind CSS 4, Node.js / Express, Google Gemini (`@google/genai`),
Firebase Auth (Google), Open-Meteo, Python (pandas, matplotlib).

---

## 🔭 Perspectives

- **Export Spotify** : création de la playlist directement dans le compte Spotify de l'utilisateur (OAuth Spotify).
- Apprentissage des poids du classement à partir des retours utilisateurs (likes / skips).
- Déploiement en ligne.