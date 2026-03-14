import React, { useEffect, useState } from 'react';
import { LaunchPlan, LaunchPhase } from '../types';
import { DEFAULT_SCRIPT_DURATION_MINUTES } from '../constants';
import { ChevronDown, ChevronUp, Copy, Check, User, Layout, Sparkles, Wand2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Props {
  plan: LaunchPlan;
  onGeneratePhase: (id: string) => void;
  canGeneratePhase?: boolean;
  isDefaultPlan?: boolean;
  pendingAvatarStory?: string;
  phaseDates?: Record<string, string>;
  requestedPhaseId?: string | null;
  onPhaseRequestHandled?: () => void;
}

export default function LaunchResult({
  plan,
  onGeneratePhase,
  canGeneratePhase = false,
  isDefaultPlan = false,
  pendingAvatarStory = '',
  phaseDates,
  requestedPhaseId = null,
  onPhaseRequestHandled,
}: Props) {
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'strategy' | 'phases'>('strategy');

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  useEffect(() => {
    if (!requestedPhaseId) {
      return;
    }

    const exists = plan.structure.some(phase => phase.id === requestedPhaseId);
    if (exists) {
      setActiveTab('phases');
      setExpandedPhase(requestedPhaseId);
    }
    onPhaseRequestHandled?.();
  }, [requestedPhaseId, plan.structure, onPhaseRequestHandled]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Sua Estratégia de Lançamento</h2>
        <div className="flex bg-slate-100 p-1 rounded-xl self-start lg:self-auto">
          <button
            onClick={() => setActiveTab('strategy')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'strategy' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Estratégia & Avatar
          </button>
          <button
            onClick={() => setActiveTab('phases')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'phases' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Estrutura de Fases
          </button>
        </div>
      </div>

      {isDefaultPlan && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-4 text-sm flex items-start gap-3">
          <Sparkles size={18} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">Pré-visualização base</p>
            <p>Os dados salvos no diagnóstico alimentam os geradores de fase. Preencha o briefing e use os botões em cada fase para criar roteiros personalizados com IA.</p>
          </div>
        </div>
      )}

      {activeTab === 'strategy' ? (
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white p-8 rounded-2xl border-2 border-indigo-100 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <User size={120} />
            </div>
            <div className="flex items-center gap-3 mb-6 relative">
              <div className="p-2 bg-indigo-600 rounded-lg text-white">
                <User size={24} />
              </div>
              <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">História da Expert</h3>
            </div>
            <div className="prose prose-indigo max-w-none text-slate-600 leading-relaxed relative">
              <ReactMarkdown>{isDefaultPlan && pendingAvatarStory ? pendingAvatarStory : plan.avatarHistory}</ReactMarkdown>
            </div>
          </div>

        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 text-indigo-700 text-sm flex items-center gap-3 mb-6">
            <Sparkles size={20} className="shrink-0" />
            Clique em uma fase para ver a descrição e gerar os roteiros/criativos detalhados.
          </div>

          {plan.structure.map((phase, idx) => (
            <section
              key={phase.id}
              id={`phase-${phase.id.toLowerCase()}`}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
            >
              <button
                onClick={() => setExpandedPhase(expandedPhase === phase.id ? null : phase.id)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="text-left">
                  <h3 className="font-bold text-slate-800">{phase.name}</h3>
                  <p className="text-sm text-slate-500">{phase.description}</p>
                  {phaseDates?.[phase.id] && (
                    <p className="text-xs font-semibold text-indigo-500">{phaseDates[phase.id]}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {phase.liveScript && <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">Gerado</span>}
                  {expandedPhase === phase.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </button>

              {expandedPhase === phase.id && (
                <div className="px-6 pb-6 space-y-6 border-t border-slate-50 pt-4">
                  {!phase.liveScript ? (
                    <div className="py-8 text-center">
                      <p className="text-slate-500 mb-6">
                        {canGeneratePhase
                          ? 'Os roteiros e criativos desta fase ainda não foram gerados.'
                          : 'Gere a estratégia completa para liberar os roteiros detalhados desta fase.'}
                      </p>
                      <button
                        onClick={() => canGeneratePhase && onGeneratePhase(phase.id)}
                        disabled={phase.isGenerating || !canGeneratePhase}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl transition-all flex items-center justify-center gap-2 mx-auto shadow-lg shadow-indigo-100 disabled:opacity-50"
                      >
                        {phase.isGenerating ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Gerando Roteiros...
                          </>
                        ) : canGeneratePhase ? (
                          <>
                            <Wand2 size={18} />
                            Gerar Roteiros e Criativos
                          </>
                        ) : (
                          <>
                            <Layout size={18} />
                            Aguarde o briefing completo
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="bg-slate-50 rounded-xl p-6 relative">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold uppercase tracking-[0.4em] text-slate-400">Script completo</span>
                        <button
                          onClick={() => handleCopy(phase.liveScript, `script-${phase.id}`)}
                          className="p-2 hover:bg-white rounded-lg transition-colors text-slate-400 hover:text-indigo-600"
                          title="Copiar conteúdo"
                        >
                          {copiedId === `script-${phase.id}` ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                        </button>
                      </div>
                      <div className="mb-4 rounded-2xl border border-indigo-100 bg-indigo-50/80 px-4 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-indigo-600">
                        Tempo solicitado: aproximadamente {phase.liveScriptDurationMinutes ?? DEFAULT_SCRIPT_DURATION_MINUTES} minutos.
                      </div>
                      <div
                        className="prose prose-slate max-w-none text-slate-600 text-sm"
                        dangerouslySetInnerHTML={{ __html: phase.liveScript }}
                      />
                    </div>
                  )}
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
