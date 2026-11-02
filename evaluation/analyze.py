"""
evaluation/analyze.py
Analyse des résultats produits par evaluate.mjs : tableaux (Markdown + CSV) et figures.

Usage :  python evaluation/analyze.py
Dépendances : pandas, matplotlib, numpy  (pip install -r evaluation/requirements.txt)

Sorties :
  evaluation/results/summary.md     tableau récapitulatif + tests (à copier dans le rapport)
  evaluation/results/summary.csv
  evaluation/figures/*.png          figures pour le rapport et la vidéo
"""
import json
import os
import sys

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

HERE = os.path.dirname(os.path.abspath(__file__))
RES = os.path.join(HERE, "results")
FIG = os.path.join(HERE, "figures")
DATASET = os.path.join(HERE, "..", "data", "dataset.csv")
os.makedirs(FIG, exist_ok=True)

metrics_path = os.path.join(RES, "metrics_per_profile.csv")
if not os.path.exists(metrics_path):
    sys.exit("Lancez d'abord : npm run evaluate")
df = pd.read_csv(metrics_path)
run_info = json.load(open(os.path.join(RES, "run_info.json"), encoding="utf8"))

ORDER = ["aleatoire", "popularite", "moteur_local", "gemini_brut", "gemini_pipeline"]
LABELS = {
    "aleatoire": "Aléatoire",
    "popularite": "Popularité (genre)",
    "moteur_local": "MoodWave local",
    "gemini_brut": "Gemini (brut)",
    "gemini_pipeline": "MoodWave + Gemini",
}
# Palette catégorielle validée (ordre fixe, une couleur par système quel que soit le nombre de systèmes présents)
COLORS = {
    "aleatoire": "#2a78d6",
    "popularite": "#eb6834",
    "moteur_local": "#1baf7a",
    "gemini_brut": "#eda100",
    "gemini_pipeline": "#e87ba4",
}
SYSTEMS = [s for s in ORDER if s in set(df.systeme)]
INK, INK2, GRID, SURFACE = "#0b0b0b", "#52514e", "#e4e3df", "#fcfcfb"

plt.rcParams.update({
    "font.family": "DejaVu Sans",
    "font.size": 9,
    "axes.edgecolor": GRID,
    "axes.labelcolor": INK2,
    "xtick.color": INK2,
    "ytick.color": INK2,
    "axes.titlecolor": INK,
    "axes.titlesize": 10,
    "axes.titleweight": "bold",
    "figure.facecolor": SURFACE,
    "axes.facecolor": SURFACE,
    "savefig.facecolor": SURFACE,
    "axes.spines.top": False,
    "axes.spines.right": False,
})

# ---------------------------------------------------------------------------
# 1. Tableau récapitulatif
# ---------------------------------------------------------------------------
METRICS = [
    ("distance_audio", "Distance audio ↓", 3, 1),
    ("mae_valence", "Écart valence ↓", 3, 1),
    ("mae_energy", "Écart énergie ↓", 3, 1),
    ("precision_genre", "Précision genre favori ↑", 1, 100),
    ("titres_artiste", "Titres artiste favori (/20)", 1, 1),
    ("diversite_artistes", "Diversité artistes ↑", 1, 100),
    ("taux_violation", "Violations activité ↓", 1, 100),
    ("popularite_moyenne", "Popularité moyenne", 1, 1),
    ("latence_ms", "Latence (ms)", 0, 1),
]
if "taux_invalides" in df.columns:
    METRICS.append(("taux_invalides", "IDs invalides Gemini ↓", 1, 100))

summary = {}
for s in SYSTEMS:
    sub = df[df.systeme == s]
    summary[s] = {}
    for key, _, _, scale in METRICS:
        if key not in sub.columns:
            continue
        vals = sub[key].dropna()
        summary[s][key] = (vals.mean() * scale, vals.std(ddof=1) * scale if len(vals) > 1 else 0.0, len(vals))

rows_md = []
header = "| Métrique | " + " | ".join(LABELS[s] for s in SYSTEMS) + " |"
rows_md.append(header)
rows_md.append("|" + "---|" * (len(SYSTEMS) + 1))
csv_rows = []
for key, label, dec, scale in METRICS:
    cells = []
    for s in SYSTEMS:
        if key in summary[s] and not np.isnan(summary[s][key][0]):
            m, sd, n = summary[s][key]
            unit = " %" if scale == 100 else ""
            cells.append(f"{m:.{dec}f}{unit} ± {sd:.{dec}f}")
            csv_rows.append({"metrique": key, "systeme": s, "moyenne": m, "ecart_type": sd, "n": n})
        else:
            cells.append("—")
    rows_md.append(f"| {label} | " + " | ".join(cells) + " |")

# ---------------------------------------------------------------------------
# 2. Détail par activité
# ---------------------------------------------------------------------------
# Violations par activité
act_md = []
viol = df.dropna(subset=["taux_violation"])
if len(viol):
    pv = viol.pivot_table(index="activite", columns="systeme", values="taux_violation", aggfunc="mean") * 100
    act_md = ["| Activité | " + " | ".join(LABELS[s] for s in SYSTEMS if s in pv.columns) + " |",
              "|" + "---|" * (1 + sum(s in pv.columns for s in SYSTEMS))]
    for act, r in pv.iterrows():
        act_md.append(f"| {act} | " + " | ".join(f"{r[s]:.0f} %" for s in SYSTEMS if s in pv.columns) + " |")

ds = run_info["dataset"]
with open(os.path.join(RES, "summary.md"), "w", encoding="utf8") as f:
    f.write("# Résultats de l'évaluation MoodWave\n\n")
    f.write(f"Exécution : {run_info['date']} · modèle Gemini : {run_info.get('model') or 'non évalué'} · "
            f"{run_info['profiles']} profils · playlists de {run_info['k']} titres.\n\n")
    f.write(f"Dataset : {ds['rawRows']} lignes brutes → {ds['keptRows']} après nettoyage "
            f"({ds['droppedMissing']} incomplètes, {ds['droppedInvalid']} invalides) → "
            f"{ds['uniqueTracks']} titres uniques, {ds['genres']} genres, {ds['artists']} artistes.\n\n")
    f.write("## Moyennes ± écart-type sur les profils\n\n" + "\n".join(rows_md) + "\n\n")
    f.write("Précision genre : profils avec genre favori uniquement. Titres artiste : profils avec artiste favori. "
            "Violations : profils dont l'activité impose des règles (fête, sport, sommeil, enfants).\n\n")
    if act_md:
        f.write("## Taux de violation par activité\n\n" + "\n".join(act_md) + "\n")
pd.DataFrame(csv_rows).to_csv(os.path.join(RES, "summary.csv"), index=False)

# ---------------------------------------------------------------------------
# 3. Figures
# ---------------------------------------------------------------------------
def bar_panel(ax, key, title, scale=1, fmt="{:.2f}", lower_better=True):
    present = [s for s in SYSTEMS if key in summary[s] and not np.isnan(summary[s][key][0])]
    vals = [summary[s][key][0] for s in present]
    x = np.arange(len(present))
    ax.bar(x, vals, width=0.62, color=[COLORS[s] for s in present], edgecolor=SURFACE, linewidth=2)
    for xi, v in zip(x, vals):
        ax.text(xi, v, fmt.format(v), ha="center", va="bottom", fontsize=8, color=INK)
    ax.set_xticks(x)
    ax.set_xticklabels([LABELS[s].replace(" (", "\n(").replace(" + ", "\n+ ") for s in present], fontsize=7.5)
    ax.set_title(title + ("  (↓ mieux)" if lower_better else "  (↑ mieux)"), loc="left")
    ax.yaxis.grid(True, color=GRID, linewidth=0.8)
    ax.set_axisbelow(True)
    ax.set_ylim(0, max(vals) * 1.18 if vals else 1)

fig, axes = plt.subplots(2, 2, figsize=(9, 6.2))
bar_panel(axes[0, 0], "distance_audio", "Distance au vecteur cible", fmt="{:.3f}")
bar_panel(axes[0, 1], "precision_genre", "Titres du genre favori (%)", fmt="{:.0f} %", lower_better=False)
bar_panel(axes[1, 0], "taux_violation", "Violations des règles d'activité (%)", fmt="{:.1f} %")
bar_panel(axes[1, 1], "diversite_artistes", "Diversité des artistes (%)", fmt="{:.0f} %", lower_better=False)
fig.suptitle("Comparaison des systèmes sur 24 profils (playlists de 20 titres)", x=0.01, ha="left", fontweight="bold", color=INK)
fig.tight_layout(rect=(0, 0, 1, 0.97))
fig.savefig(os.path.join(FIG, "fig1_comparaison_systemes.png"), dpi=200)
plt.close(fig)

# Interprétation : vecteurs cibles par humeur et par activité (heatmaps séquentielles, une seule teinte)
targets = json.load(open(os.path.join(RES, "audio_targets.json"), encoding="utf8"))
from matplotlib.colors import LinearSegmentedColormap

seq = LinearSegmentedColormap.from_list("seq_blue", ["#cde2fb", "#86b6ef", "#3987e5", "#1c5cab", "#0d2f5c"])
cols = ["target_valence", "target_energy", "target_danceability", "target_acousticness"]
col_fr = ["Valence", "Énergie", "Dansabilité", "Acoustique"]
fig, axes = plt.subplots(1, 2, figsize=(10, 5.2), gridspec_kw={"width_ratios": [12, 10]})
for ax, (key, title) in zip(axes, [("humeurs", "Cible audio par humeur"), ("activites", "Cible audio par activité (humeur neutre)")]):
    t = pd.DataFrame(targets[key])
    m = t[cols].values
    ax.imshow(m, cmap=seq, vmin=0, vmax=1, aspect="auto")
    ax.set_xticks(range(4)); ax.set_xticklabels(col_fr, fontsize=8)
    ax.set_yticks(range(len(t))); ax.set_yticklabels(t["label"], fontsize=8)
    for i in range(m.shape[0]):
        for j in range(m.shape[1]):
            ax.text(j, i, f"{m[i, j]:.2f}", ha="center", va="center", fontsize=7.5, color="white" if m[i, j] > 0.55 else INK)
    ax.set_title(title, loc="left")
    for spine in ax.spines.values():
        spine.set_visible(False)
fig.tight_layout()
fig.savefig(os.path.join(FIG, "fig2_cibles_audio.png"), dpi=200)
plt.close(fig)

# Dataset : distribution des caractéristiques audio
if os.path.exists(DATASET):
    raw = pd.read_csv(DATASET, usecols=["valence", "energy", "danceability", "acousticness", "popularity", "track_genre"])
    fig, axes = plt.subplots(1, 5, figsize=(13, 2.8))
    for ax, f in zip(axes, ["valence", "energy", "danceability", "acousticness", "popularity"]):
        ax.hist(raw[f].dropna(), bins=40, color="#3987e5", edgecolor=SURFACE, linewidth=0.6)
        ax.set_title({"valence": "Valence (positivité)", "energy": "Énergie", "danceability": "Dansabilité", "acousticness": "Acoustique"}.get(f, "Popularité"), loc="left")
        ax.yaxis.grid(True, color=GRID, linewidth=0.8); ax.set_axisbelow(True)
        ax.set_yticklabels([])
    fig.suptitle(f"Spotify Tracks Dataset — distribution des caractéristiques ({len(raw):,} lignes · {raw.track_genre.nunique()} genres)".replace(",", " "),
                 x=0.01, ha="left", fontweight="bold", color=INK)
    fig.tight_layout(rect=(0, 0, 1, 0.88))
    fig.savefig(os.path.join(FIG, "fig3_dataset_distributions.png"), dpi=200)
    plt.close(fig)

print(open(os.path.join(RES, "summary.md"), encoding="utf8").read())
print(f"Figures écrites dans {FIG}")
