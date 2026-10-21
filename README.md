# MoodWave • Spotify & YouTube Playlist Generator 🎵

Application web académique et full-stack combinant :
- **Profil utilisateur** (inscription / compte : nom, prénom, âge, genre musical préféré, artiste favori, ville)
- **Humeur du moment** (12 émotions : Joyeux, Énergétique, Nostalgique, etc.) & **Contexte d'activité** (voiture, fête, enfants, sport, etc.)
- **Météo en direct** par géolocalisation de l'appareil (GPS / Open-Meteo)
- **Moteur d'IA Google Gemini (Google AI Studio)** pour le raisonnement musicologique, l'inférence des attributs audio Spotify (valence, énergie, dansabilité, acoustique) et la curation des titres
- **Dataset Kaggle [Almost Million Songs Dataset 2025 (16 Features)](https://www.kaggle.com/datasets/anantsinghal786/almost-million-songs-dataset-2025-16-features)** par Anant Singhal, respectant à 100% les 16 caractéristiques acoustiques Spotify
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

# Port du serveur de développement (par défaut 3000)
PORT=3000

# URL de l'application en local
APP_URL="http://localhost:3000"
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
➜  Local:   http://localhost:3000/
```

#### 3) Ouvrir l'application
Ouvrez votre navigateur web et rendez-vous sur :  
👉 **[http://localhost:3000](http://localhost:3000)**

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
| `npm run dev` | Démarre le serveur local de dev sur `http://localhost:3000` |
| `npm run build` | Compile l'application React et le bundle client dans `dist/` |
| `npm run start` | Lance le serveur Express en mode production avec `tsx server.ts` |
| `npm run lint` | Lance la vérification TypeScript (`tsc --noEmit`) |
| `npm run clean` | Supprime le dossier de build `dist/` |

---

## 📁 Architecture du projet

```
├── .env.example              # Exemple de variables d'environnement
├── index.html                # Point d'entrée HTML
├── package.json              # Dépendances et scripts de build
├── server.ts                 # Serveur Backend Express avec SDK @google/genai
├── src/
│   ├── App.tsx               # Composant racine orchestrant l'état et l'affichage
│   ├── components/           # Composants UI React (Sélecteur météo, Table unique de morceaux, Modales)
│   ├── data/                 # Dataset Kaggle (plus de 130 titres avec 20 caractéristiques audio)
│   ├── services/             # Appels API (Gemini, Open-Meteo, Moteur de ranking)
│   └── types/                # Types TypeScript
└── vite.config.ts            # Configuration Vite & Tailwind CSS v4
```
