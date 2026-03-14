/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LaunchData, LaunchPlan } from './types';
import { generateLaunchOverview, generatePhaseDetails } from './services/gemini';
import LaunchForm from './components/LaunchForm';
import LaunchResult from './components/LaunchResult';
import { Rocket, Sparkles, BookOpen, MessageSquare, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [plan, setPlan] = useState<LaunchPlan | null>(null);
  const [launchData, setLaunchData] = useState<LaunchData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateOverview = async (data: LaunchData) => {
    setIsLoading(true);
    setError(null);
    setLaunchData(data);
    try {
      const result = await generateLaunchOverview(data);
      setPlan(result);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error(err);
      setError('Ocorreu um erro ao gerar a visão geral. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePhase = async (phaseId: string) => {
    if (!plan || !launchData) return;

    const phaseIndex = plan.structure.findIndex(p => p.id === phaseId);
    if (phaseIndex === -1) return;

    // Set loading state for the specific phase
    const newStructure = [...plan.structure];
    newStructure[phaseIndex] = { ...newStructure[phaseIndex], isGenerating: true };
    setPlan({ ...plan, structure: newStructure });

    try {
      const scripts = await generatePhaseDetails(launchData, plan.structure[phaseIndex]);
      
      const updatedStructure = [...plan.structure];
      updatedStructure[phaseIndex] = { 
        ...updatedStructure[phaseIndex], 
        scripts, 
        isGenerating: false 
      };
      setPlan({ ...plan, structure: updatedStructure });
    } catch (err) {
      console.error(err);
      setError('Erro ao gerar detalhes da fase. Tente novamente.');
      
      const resetStructure = [...plan.structure];
      resetStructure[phaseIndex] = { ...resetStructure[phaseIndex], isGenerating: false };
      setPlan({ ...plan, structure: resetStructure });
    }
  };

  const handleBack = () => {
    setPlan(null);
    setLaunchData(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Background Decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-100 rounded-full blur-3xl opacity-50" />
        <div className="absolute top-[60%] -right-[10%] w-[30%] h-[30%] bg-blue-100 rounded-full blur-3xl opacity-50" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 py-12 md:py-20">
        <header className="text-center mb-12">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 text-indigo-600 text-sm font-bold mb-4"
          >
            <Sparkles size={16} />
            IA Especialista em Lançamentos
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-black tracking-tight text-slate-900 mb-4"
          >
            LANÇAMENTO <span className="text-indigo-600">CLÁSSICO</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-slate-600 max-w-2xl mx-auto"
          >
            Transforme seu conhecimento em um império digital. Gere toda a estrutura do seu 
            <strong> Lançamento Clássico</strong> em segundos.
          </motion.p>
        </header>

        <main>
          <AnimatePresence mode="wait">
            {!plan ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2">
                    <LaunchForm onSubmit={handleGenerateOverview} isLoading={isLoading} />
                  </div>
                  <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                      <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                        <BookOpen size={18} className="text-indigo-500" /> O que será gerado?
                      </h3>
                      <ul className="space-y-3 text-sm text-slate-600">
                        <li className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                          Estrutura de fases (PPL, PL, L)
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                          Roteiros para CPL 1, 2 e 3
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                          Sequência de emails de vendas
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                          Sugestões de criativos para anúncios
                        </li>
                      </ul>
                    </div>

                    <div className="bg-indigo-600 p-6 rounded-2xl text-white shadow-lg shadow-indigo-200">
                      <h3 className="font-bold flex items-center gap-2 mb-2">
                        <MessageSquare size={18} /> Dica do Especialista
                      </h3>
                      <p className="text-sm text-indigo-100 leading-relaxed">
                        "O segredo do Lançamento Clássico não é o produto, é a jornada de consciência que você cria para o seu lead através dos CPLs."
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="result"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <button
                  onClick={handleBack}
                  className="mb-6 flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-semibold transition-colors"
                >
                  <ArrowLeft size={18} />
                  Voltar para o formulário
                </button>
                <LaunchResult plan={plan} onGeneratePhase={handleGeneratePhase} />
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-center font-medium">
              {error}
            </div>
          )}
        </main>

        <footer className="mt-20 text-center text-slate-400 text-sm">
          <p>© {new Date().getFullYear()} Launch Master - Baseado na metodologia Fórmula de Lançamento.</p>
        </footer>
      </div>
    </div>
  );
}
