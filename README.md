# MoodWave • Spotify & YouTube Playlist Generator 🎵

Application web académique et full-stack combinant :
- **Profil utilisateur** (inscription / compte : nom, prénom, âge, genre musical préféré, artiste favori, ville)
- **Humeur du moment** (12 émotions : Joyeux, Énergétique, Nostalgique, etc.) & **Contexte d'activité** (voiture, fête, enfants, sport, etc.)
- **Météo en direct** par géolocalisation de l'appareil (GPS / Open-Meteo)
- **Moteur d'IA Google Gemini (Google AI Studio)** pour le raisonnement musicologique, l'inférence des attributs audio Spotify (valence, énergie, dansabilité, acoustique) et la curation des titres
- **Dataset Kaggle [Spotify Tracks Dataset](https://www.kaggle.com/datasets/maharshipandya/-spotify-tracks-dataset)** (maharshipandya) : 114 000 titres, 114 genres, caractéristiques audio Spotify (valence, énergie, dansabilité, acoustique, tempo…) — fichier `data/dataset.csv`
- **Module d'évaluation** (`evaluation/`) : comparaison chiffrée avec deux systèmes de référence et figures
- **Règle stricte** : Génération de 20 titres minimum par playlist en un clic
- **Export direct** vers Spotify Web & YouTube Music

---

## 🚀 Guide pas-à-pas : Lancer le projet en local

### 1. Prérequis
- **Node.js** (version 18, 20 ou supérieure recommandée) : [Télécharger Node.js](https://nodejs.org/)
- **npm** (inclus automatiquement avec Node.js)
- Un éditeur de code tel que **VS Code** (recommandé) ou n'importe quel terminal

---

### 2. Configuration des Clés API (`.env`)

Le projet utilise **Google Gemini API** (`@google/genai`) pour son moteur de recommandation IA, et **Open-Meteo** pour la météo en temps réel (qui ne nécessite aucune clé).

#### Étape A : Obtenir une clé API Gemini (100% Gratuit)
1. Rendez-vous sur **[Google AI Studio](https://aistudio.google.com/app/apikey)**.
2. Connectez-vous avec votre compte Google.
3. Cliquez sur **« Create API key »** (ou « Obtenir une clé API »).
4. Copiez votre clé (commençant généralement par `AIzaSy...`).

#### Étape B : Créer le fichier `.env`
À la racine du projet, créez un fichier nommé `.env` (en dupliquant ou renommant `.env.example`) :

```env
# Clé API Google AI Studio pour Gemini (Gemini 3.8 Flash & Gemini 3.1 Flash-Lite)
GEMINI_API_KEY="VOTRE_CLE_API_GEMINI_ICI"

# Port du serveur de développement (par défaut 3001)
PORT=3001

# URL de l'application en local
APP_URL="http://localhost:3001"
```

> 💡 **Remarque importante** : Si vous n'avez pas de clé API Gemini ou ne souhaitez pas en mettre une immédiatement, le projet fonctionnera tout de même grâce à son **moteur heuristique local de secours** intégré !

---

### 3. Installation et Lancement

Ouvrez un terminal dans le dossier du projet :

#### 1) Installer les dépendances
```bash
npm install
```

#### 2) Lancer le serveur de développement
```bash
npm run dev
```

Le serveur Express + Vite démarre simultanément :
```
➜  Local:   http://localhost:3001/
```

#### 3) Ouvrir l'application
Ouvrez votre navigateur web et rendez-vous sur :  
👉 **[http://localhost:3001](http://localhost:3001)**

---

## 📋 Fonctionnement & Vérifications

1. **Choix de l'humeur & du contexte** :
   - Sélectionnez votre humeur (ex: *Joyeux*) et votre contexte (ex: *En voiture* ou *Fête*).
   - La météo se synchronise automatiquement avec votre position GPS ou la ville de votre profil.
2. **Génération de la playlist** :
   - Cliquez sur **« Générer la playlist (20 titres min.) »**.
   - L'IA Gemini analyse votre humeur, météo, contexte, et vos préférences d'inscription (artiste favori, genre).
   - **Une unique liste de musique** s'affiche contenant **au moins 20 morceaux optimisés**.
3. **Tester l'API Gemini depuis l'interface** :
   - Cliquez sur le bouton **« Tester l'API Gemini »** dans la barre supérieure ou dans la section IA pour tester la latence et la connectivité avec votre clé API.
4. **Exportation** :
   - Cliquez sur **« Créer le Top 20 instantané »** ou **« Exporter sur Spotify / YouTube »** pour ouvrir directement la playlist dans vos applications musicales préférées.

---

## 🛠️ Commandes utiles

| Commande | Action |
| :--- | :--- |
| `npm run dev` | Démarre le serveur local de dev sur `http://localhost:3001` |
| `npm run build` | Compile l'application React et le bundle client dans `dist/` |
| `npm run start` | Lance le serveur Express en mode production avec `tsx server.jsx` |
| `npm run lint` | Analyse les sources JSX sans générer de fichiers (`tsc --noEmit`) |
| `npm run clean` | Supprime le dossier de build `dist/` |
| `npm run evaluate` | Évalue les 5 systèmes sur 24 profils (`-- --no-gemini` pour sans IA) |
| `python evaluation/analyze.py` | Tableaux et figures de l'évaluation |

---

## 📁 Architecture du projet

```
├── .env.example              # Exemple de variables d'environnement
├── index.html                # Point d'entrée HTML
├── package.json              # Dépendances et scripts de build
├── server.jsx                # Serveur Backend Express avec SDK @google/genai
├── data/dataset.csv          # Spotify Tracks Dataset (Kaggle, 114 000 lignes)
├── evaluation/               # Évaluation hors ligne (profils, métriques, tests, figures)
├── src/
│   ├── App.jsx               # Composant racine orchestrant l'état et l'affichage
│   ├── components/           # Composants UI React (Sélecteur météo, Table unique de morceaux, Modales)
│   ├── data/
│   │   ├── datasetLoader.js  # Lecture + nettoyage de data/dataset.csv (serveur)
│   │   ├── moodwaveRules.js  # Humeur/activité/météo -> cibles audio, familles de genres, règles d'activité
│   │   ├── recommender.js    # Classement final (distance audio + préférences + choix de l'IA)
│   │   └── uiOptions.js      # Humeurs, activités, météos affichées dans l'interface
│   ├── server/
│   │   └── playlistPipeline.js # Pipeline complet : candidats -> Gemini -> validation -> classement
│   ├── services/             # Appels API côté navigateur (Gemini, catalogue, Open-Meteo, YouTube)
│   └── main.jsx              # Point d'entrée React
└── vite.config.jsx           # Configuration Vite & Tailwind CSS v4
```

---

## 📊 Dataset

| | |
|---|---|
| Source | [Spotify Tracks Dataset — Kaggle (maharshipandya)](https://www.kaggle.com/datasets/maharshipandya/-spotify-tracks-dataset) |
| Fichier | `data/dataset.csv` (20 Mo) |
| Taille brute | 114 000 lignes × 21 colonnes, 114 genres (1 000 titres par genre) |
| Nettoyage | 1 ligne incomplète et 157 lignes invalides (tempo ou durée nuls) supprimées → 113 842 lignes |
| Doublons | un même titre est listé sous plusieurs genres → regroupés en **81 021 titres uniques** (champ `all_genres`) |
| Variables utilisées | `valence`, `energy`, `danceability`, `acousticness`, `tempo`, `loudness`, `explicit`, `popularity`, `track_genre`, `artists` |

Le CSV est lu une seule fois au démarrage du serveur (≈ 2 s). Le navigateur ne reçoit que la liste des genres et des 3 000 artistes les plus populaires (`/api/catalog/meta`) et les playlists générées.

## 🧠 Pipeline de recommandation

1. **Cibles audio** (`computeAudioTargets`) : l'humeur fixe un vecteur (valence, énergie, dansabilité, acoustique), l'activité le contraint (ex. fête : énergie ≥ 0,78) et la météo l'ajuste (pluie : valence −0,07).
2. **Pré-sélection** (`buildCandidatePool`) : ~150 candidats parmi 81 000 — titres de l'artiste favori, du genre favori, des genres voisins, puis les plus proches de l'ambiance (distance euclidienne pondérée + a priori de popularité).
3. **Gemini** : choisit 25 identifiants parmi les candidats, les ordonne et justifie chaque choix (sortie JSON contrainte par un schéma). Le serveur rejette tout identifiant inventé et relance si moins de 20 sont valides : le LLM ne peut pas halluciner de titres.
4. **Classement final** (`rankTracksFromDataset`) : règles strictes par activité (pas de titre explicite avec des enfants, pas de titre calme au sport…), pénalités hors genre favori, bonus artiste favori (8 titres max.), choix de Gemini en tête, suppression des versions en double.

Sans clé Gemini ou si l'API échoue, l'interface bascule automatiquement sur le **moteur local** (étapes 1, 2 et 4).

## 📈 Évaluation

```bash
npm run evaluate                  # 5 systèmes, nécessite GEMINI_API_KEY (réponses mises en cache)
npm run evaluate -- --no-gemini   # systèmes sans IA uniquement
pip install -r evaluation/requirements.txt
python evaluation/analyze.py      # -> evaluation/results/summary.md + evaluation/figures/*.png
```

**Protocole** : 24 profils de test (`evaluation/profiles.js`) couvrant les 12 humeurs, les 10 activités, 6 météos, 12 genres et 8 artistes favoris. Chaque système produit une playlist de 20 titres.

| Système | Description |
|---|---|
| Aléatoire | 20 titres tirés au hasard (référence basse) |
| Popularité (genre) | les 20 titres les plus populaires du genre favori, sans tenir compte du contexte |
| MoodWave local | pipeline sans IA |
| Gemini (brut) | les 20 premiers choix de Gemini |
| MoodWave + Gemini | pipeline complet, tel que vu par l'utilisateur |

**Métriques** : distance moyenne au vecteur cible, écart par caractéristique, précision du genre favori, titres de l'artiste favori, diversité des artistes, taux de violation des règles d'activité, popularité, identifiants invalides renvoyés par Gemini, latence.

Les résultats et figures fournis dans `evaluation/` ont été produits **sans Gemini** ; relancez `npm run evaluate` avec votre clé pour ajouter les deux colonnes Gemini.

## 👥 Auteurs

- _Prénom Nom_ — _rôle_ — _email_
- _Prénom Nom_ — _rôle_ — _email_
