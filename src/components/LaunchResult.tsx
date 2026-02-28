import React, { useState } from 'react';
import { LaunchPlan, LaunchPhase } from '../types';
import { ChevronDown, ChevronUp, FileText, Mail, Video, Megaphone, Copy, Check, User, Share2, Info, Layout, Bell, ListChecks, Sparkles, Wand2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Props {
  plan: LaunchPlan;
  onGeneratePhase: (id: string) => void;
}

export default function LaunchResult({ plan, onGeneratePhase }: Props) {
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'strategy' | 'phases'>('strategy');

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video size={18} className="text-red-500" />;
      case 'heygen': return <Video size={18} className="text-purple-500" />;
      case 'email': return <Mail size={18} className="text-blue-500" />;
      case 'ad': return <Megaphone size={18} className="text-orange-500" />;
      default: return <FileText size={18} className="text-slate-500" />;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Sua Estratégia de Lançamento</h2>
        <div className="flex bg-slate-100 p-1 rounded-xl">
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
              <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">História do Avatar</h3>
            </div>
            <div className="prose prose-indigo max-w-none text-slate-600 leading-relaxed relative">
              <ReactMarkdown>{plan.avatarHistory}</ReactMarkdown>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
                  <Bell size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-800">SNA (Sistema de Notificação)</h3>
              </div>
              <div className="prose prose-slate max-w-none text-slate-600 text-sm">
                <ReactMarkdown>{plan.snaStrategy}</ReactMarkdown>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                  <ListChecks size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Mapa de Entregáveis (Insider)</h3>
              </div>
              <div className="prose prose-slate max-w-none text-slate-600 text-sm">
                <ReactMarkdown>{plan.insiderDeliverablesMap}</ReactMarkdown>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                  <Share2 size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Redes Sociais</h3>
              </div>
              <div className="prose prose-slate max-w-none text-slate-600 text-sm">
                <ReactMarkdown>{plan.socialMediaStrategy}</ReactMarkdown>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                  <Info size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Modelo Escolhido</h3>
              </div>
              <div className="prose prose-slate max-w-none text-slate-600 text-sm">
                <ReactMarkdown>{plan.launchModelExplanation}</ReactMarkdown>
              </div>
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
            <div key={phase.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <button
                onClick={() => setExpandedPhase(expandedPhase === phase.id ? null : phase.id)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
                    {idx + 1}
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-slate-800">{phase.name}</h3>
                    <p className="text-sm text-slate-500">{phase.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {phase.scripts && <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">Gerado</span>}
                  {expandedPhase === phase.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </button>

              {expandedPhase === phase.id && (
                <div className="px-6 pb-6 space-y-6 border-t border-slate-50 pt-4">
                  {!phase.scripts ? (
                    <div className="py-8 text-center">
                      <p className="text-slate-500 mb-6">Os roteiros e criativos desta fase ainda não foram gerados.</p>
                      <button
                        onClick={() => onGeneratePhase(phase.id)}
                        disabled={phase.isGenerating}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl transition-all flex items-center justify-center gap-2 mx-auto shadow-lg shadow-indigo-100 disabled:opacity-50"
                      >
                        {phase.isGenerating ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Gerando Roteiros...
                          </>
                        ) : (
                          <>
                            <Wand2 size={18} />
                            Gerar Roteiros e Criativos
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-6">
                      {phase.scripts.map((script, sIdx) => (
                        <div key={sIdx} className="bg-slate-50 rounded-xl p-6 relative group">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              {getIcon(script.type)}
                              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                {script.type === 'ad' ? 'Criativo/Anúncio' : script.type === 'heygen' ? 'Roteiro HeyGen' : script.type}
                              </span>
                            </div>
                            <button
                              onClick={() => handleCopy(script.content, `${phase.id}-${sIdx}`)}
                              className="p-2 hover:bg-white rounded-lg transition-colors text-slate-400 hover:text-indigo-600"
                              title="Copiar conteúdo"
                            >
                              {copiedId === `${phase.id}-${sIdx}` ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                            </button>
                          </div>
                          <h4 className="font-bold text-slate-800 mb-3">{script.title}</h4>
                          <div className="prose prose-slate max-w-none text-slate-600 text-sm whitespace-pre-wrap">
                            <ReactMarkdown>{script.content}</ReactMarkdown>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
