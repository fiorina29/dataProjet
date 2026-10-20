# MoodWave • Spotify & YouTube Playlist Generator

Application web académique de Machine Learning combinant :
- Profil utilisateur (âge, genre musical préféré, artiste favori)
- Humeur du moment (12 émotions) & Contexte d'activité (voiture, fête, enfants, sport, etc.)
- Météo en direct par géolocalisation de l'appareil (GPS)
- Dataset Kaggle *Spotify Tracks Dataset* (20 variables audio)
- Export direct vers Spotify & YouTube Music

---

## 🚀 Démarrage rapide en local (VS Code)

### 1. Prérequis
- [Node.js](https://nodejs.org/) (version 18 ou supérieure recommandée)
- [VS Code](https://code.visualstudio.com/)

### 2. Étapes de lancement

1. **Ouvrir le projet dans VS Code** :
   - Lancez VS Code.
   - Cliquez sur `Fichier` > `Ouvrir le dossier...` (ou `File` > `Open Folder...`) et sélectionnez le dossier racine du projet.

2. **Ouvrir le terminal intégré** :
   - Raccourci : ``Ctrl + ` `` (Windows/Linux) ou ``Cmd + ` `` (Mac).
   - Ou via le menu supérieur : `Terminal` > `Nouveau terminal`.

3. **Installer les dépendances** :
   ```bash
   npm install
   ```

4. **Lancer le serveur de développement** :
   ```bash
   npm run dev
   ```

5. **Accéder à l'application** :
   - Ouvrez votre navigateur sur : [http://localhost:3000](http://localhost:3000) (ou cliquez sur le lien affiché dans le terminal avec `Ctrl + Clic` / `Cmd + Clic`).

---

## 🛠️ Commandes disponibles

- `npm run dev` : Démarre le serveur local de dev sur le port 3000.
- `npm run build` : Compile l'application pour la production dans le dossier `dist/`.
- `npm run lint` : Vérifie la validité des types TypeScript (`tsc --noEmit`).

---

## 📡 Connexions & API en temps réel
- **Météo en direct** : Utilise l'API Open-Meteo et l'API de géolocalisation du navigateur (`navigator.geolocation`). Aucune clé payante n'est requise.
- **Plateformes de streaming** : Les boutons d'export ouvrent directement les requêtes de playlists adaptées sur Spotify Web Player et YouTube Music.
