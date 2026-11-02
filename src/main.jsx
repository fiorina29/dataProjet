import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { fetchCatalogMeta } from './services/catalogService';

const rootElement = document.getElementById('root');
if (rootElement) {
  // On charge d'abord la liste des genres/artistes du dataset pour que les formulaires soient prêts au premier affichage.
  fetchCatalogMeta().finally(() => {
    createRoot(rootElement).render(<App />);
  });
}
