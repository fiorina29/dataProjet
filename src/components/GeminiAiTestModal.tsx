import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Play,
  CheckCircle2,
  AlertCircle,
  Clock,
  Cpu,
  Key,
  ShieldCheck,
  RefreshCw,
  Zap,
  Terminal
} from 'lucide-react';
import { AiStatusState, AiTestResult } from '../types';
import { runAiTest } from '../services/geminiService';

interface GeminiAiTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  aiStatus: AiStatusState;
  onRefreshStatus: () => void;
}

const PRESET_PROMPTS = [
  {
    label: '✨ Test d\'harmonie Météo & Émotion',
    prompt: "Donne une phrase courte et poétique sur la façon dont une pluie douce à Paris inspire une mélodie mélancolique.",
  },
  {
    label: '🎵 Test de recommandation musicale',
    prompt: "Suggère 3 morceaux cultes de French Touch pour rouler sous le soleil, avec 1 phrase d'explication pour chacun.",
  },
  {
    label: '⚡ Test de latence et connectivité',
    prompt: "Réponds simplement par 'Connecté avec succès à Google AI Studio' suivi du modèle actif.",
  },
];

export const GeminiAiTestModal: React.FC<GeminiAiTestModalProps> = ({
  isOpen,
  onClose,
  aiStatus,
  onRefreshStatus,
}) => {
  const [customPrompt, setCustomPrompt] = useState(PRESET_PROMPTS[0].prompt);
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<AiTestResult | null>(null);

  if (!isOpen) return null;

  const handleExecuteTest = async (promptToRun?: string) => {
    const text = promptToRun || customPrompt;
    setIsLoading(true);
    setTestResult(null);
    try {
      const res = await runAiTest(text);
      setTestResult(res);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white border border-slate-100 shadow-2xl p-6 sm:p-7 max-h-[90vh] overflow-y-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 via-pink-600 to-amber-400 text-white shadow-md">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                Console de Test Google AI Studio
                <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
                  Gemini API
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Validation et tests d'appels réels vers les modèles Gemini Flash
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Status Card */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-gradient-to-r from-violet-50 via-pink-50 to-amber-50 border border-violet-100/80">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-xs text-violet-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500">Statut API</div>
              <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                {aiStatus.hasKey ? 'Clé Active' : 'En attente'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-xs text-pink-600">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500">Modèle Principal</div>
              <div className="font-mono text-xs font-bold text-slate-800">
                {aiStatus.primaryModel}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-xs text-amber-600">
              <Key className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500">Sécurité Clé</div>
              <div className="text-xs font-bold text-slate-700">
                Côté Serveur (Secret)
              </div>
            </div>
          </div>
        </div>

        {/* Preset Prompts Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700">
            Exemples de tests prêts à l'emploi :
          </label>
          <div className="flex flex-wrap gap-2">
            {PRESET_PROMPTS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setCustomPrompt(preset.prompt);
                  handleExecuteTest(preset.prompt);
                }}
                className="text-xs text-left px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-violet-50 hover:border-violet-300 text-slate-700 font-medium transition-all"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Prompt Input */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
            <span>Prompt envoyé à Gemini :</span>
            <button
              onClick={onRefreshStatus}
              className="text-[11px] text-violet-600 hover:text-violet-700 flex items-center gap-1 font-semibold"
            >
              <RefreshCw className="h-3 w-3" />
              Actualiser statut
            </button>
          </label>
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            rows={3}
            className="w-full rounded-2xl border border-slate-200 p-3 text-xs text-slate-800 placeholder-slate-400 focus:border-violet-500 focus:outline-hidden focus:ring-2 focus:ring-violet-200"
            placeholder="Tapez une question ou consigne pour tester Gemini..."
          />
        </div>

        {/* Action Button */}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Fermer
          </button>
          <button
            type="button"
            disabled={isLoading || !customPrompt.trim()}
            onClick={() => handleExecuteTest()}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 text-white font-bold text-xs shadow-md hover:opacity-95 disabled:opacity-50 transition-all"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Exécution de l'appel Gemini en cours...</span>
              </>
            ) : (
              <>
                <Zap className="h-3.5 w-3.5" />
                <span>Lancer le test IA en direct</span>
              </>
            )}
          </button>
        </div>

        {/* Result Area */}
        {testResult && (
          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-900 text-slate-100 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-violet-400" />
                <span className="text-xs font-bold text-slate-300">
                  Résultat de l'appel en direct
                </span>
                {testResult.success ? (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    200 OK
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-rose-400">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Erreur
                  </span>
                )}
              </div>
              {testResult.durationMs && (
                <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                  <Clock className="h-3 w-3" />
                  {testResult.durationMs} ms
                </div>
              )}
            </div>

            {testResult.model && (
              <div className="text-[11px] text-slate-400">
                Modèle sollicité :{' '}
                <span className="text-pink-400 font-mono font-semibold">
                  {testResult.model}
                </span>
              </div>
            )}

            {testResult.success ? (
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/50 text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
                {testResult.response}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300">
                {testResult.error}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
