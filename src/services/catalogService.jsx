import { useEffect, useState } from "react";

// Métadonnées du catalogue (genres et artistes du dataset Kaggle), servies par /api/catalog/meta.
// Le dataset complet (114 000 lignes) reste côté serveur : le navigateur ne télécharge que ces listes.
let cache = null;
let pending = null;
const EMPTY = { genres: [], artists: [], stats: null, source: "", url: "" };

export function fetchCatalogMeta() {
  if (cache) return Promise.resolve(cache);
  if (!pending) {
    pending = fetch("/api/catalog/meta")
      .then((res) => (res.ok ? res.json() : EMPTY))
      .then((data) => (cache = { ...EMPTY, ...data }))
      .catch(() => EMPTY)
      .finally(() => { pending = null; });
  }
  return pending;
}

export function useCatalogMeta() {
  const [meta, setMeta] = useState(cache || EMPTY);
  useEffect(() => {
    let alive = true;
    fetchCatalogMeta().then((m) => alive && setMeta(m));
    return () => { alive = false; };
  }, []);
  return meta;
}
