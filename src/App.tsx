/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  ChecklistBlockId,
  ChecklistData,
  ChecklistFields,
  LaunchData,
  LaunchPlan,
  StoredBriefing,
} from './types';
import { generatePhaseDetails } from './services/gemini';
import LaunchForm from './components/LaunchForm';
import LaunchResult from './components/LaunchResult';
import { Rocket, Sparkles, BookOpen, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';
import { ChecklistPanel } from './components/ChecklistPanel';
import { PublikaShowcase } from './components/PublikaShowcase';
import { PublikaEditor } from './components/PublikaEditor';
import { db } from './firebase';
import { IA_FABIANA_BRIEFING } from './briefingDefaults';
import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { createInitialChecklist, mergeChecklist } from './checklist';
import { PUBLIKA_MODULES, PUBLIKA_SUMMARY, PublikaModule, PublikaSummary } from './publika';
import { DEFAULT_PLAN } from './planDefaults';

const EMPTY_LAUNCH_DATA: LaunchData = {
  avatarName: '',
  productName: '',
  niche: '',
  targetAudience: '',
  mainProblem: '',
  mainBenefit: '',
  avatarStory: '',
  avatarPainPoints: '',
  avatarObjections: '',
  avatarDesiredState: '',
  cplThreeSolution: '',
  price: '',
  anchorPrice: '',
  guarantee: '',
  bonuses: '',
  paymentMethods: '',
  scarcity: '',
  launchDate: '',
  offerDetails: '',
  launchModel: 'opportunity',
};

const BASE_PLAN = DEFAULT_PLAN;

const normalizeLaunchData = (data?: Partial<LaunchData> | null): LaunchData => ({
  ...EMPTY_LAUNCH_DATA,
  ...data,
});

const INITIAL_BRIEFING = normalizeLaunchData(IA_FABIANA_BRIEFING);

const createDefaultPlan = (): LaunchPlan => ({
  avatarHistory: BASE_PLAN.avatarHistory,
  socialMediaStrategy: BASE_PLAN.socialMediaStrategy,
  launchModelExplanation: BASE_PLAN.launchModelExplanation,
  snaStrategy: BASE_PLAN.snaStrategy,
  insiderDeliverablesMap: BASE_PLAN.insiderDeliverablesMap,
  structure: BASE_PLAN.structure.map(phase => ({ ...phase })),
});

export default function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [plan, setPlan] = useState<LaunchPlan>(() => createDefaultPlan());
  const isDefaultPlan = true;
  const [launchData, setLaunchData] = useState<LaunchData | null>(INITIAL_BRIEFING);
  const [error, setError] = useState<string | null>(null);
  const [briefingId, setBriefingId] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<ChecklistData>(createInitialChecklist());
  const [formDefaults, setFormDefaults] = useState<LaunchData | null>(INITIAL_BRIEFING);
  const [avatarStoryDraft, setAvatarStoryDraft] = useState(INITIAL_BRIEFING.avatarStory || '');
  const [isBriefingOpen, setIsBriefingOpen] = useState(false);
  const [publikaSummary, setPublikaSummary] = useState<PublikaSummary>(PUBLIKA_SUMMARY);
  const [publikaModules, setPublikaModules] = useState<PublikaModule[]>(PUBLIKA_MODULES);

  useEffect(() => {
    const fetchLatestBriefing = async () => {
      try {
        const snapshot = await getDocs(
          query(collection(db, 'launchBriefings'), orderBy('createdAt', 'desc'), limit(1))
        );

        if (snapshot.empty) {
          const normalized = normalizeLaunchData(IA_FABIANA_BRIEFING);
          setFormDefaults(normalized);
          setAvatarStoryDraft(normalized.avatarStory || '');
          setLaunchData(normalized);
          setIsBriefingOpen(true);
          return;
        }

        const docSnapshot = snapshot.docs[0];
        const data = docSnapshot.data() as StoredBriefing;
        const { checklist: storedChecklist, createdAt, updatedAt, ...launchFields } = data;

        setBriefingId(docSnapshot.id);
        setChecklist(mergeChecklist(storedChecklist));
        const normalized = normalizeLaunchData(launchFields);
        setFormDefaults(normalized);
        setAvatarStoryDraft(normalized.avatarStory || '');
        setLaunchData(normalized);
        setIsBriefingOpen(true);
      } catch (fetchError) {
        console.error('Erro ao carregar briefing anterior', fetchError);
      }
    };

    fetchLatestBriefing();
  }, []);

  const persistBriefing = async (data: LaunchData) => {
    const normalizedChecklist = mergeChecklist(checklist);
    setChecklist(normalizedChecklist);

    const payload = {
      ...data,
      checklist: normalizedChecklist,
      updatedAt: serverTimestamp(),
    };

    if (briefingId) {
      await updateDoc(doc(db, 'launchBriefings', briefingId), payload);
      return briefingId;
    }

    const docRef = await addDoc(collection(db, 'launchBriefings'), {
      ...payload,
      createdAt: serverTimestamp(),
    });

    return docRef.id;
  };

  const handleSaveBriefing = async (data: LaunchData) => {
    setIsLoading(true);
    setError(null);
    try {
      const savedId = await persistBriefing(data);
      setBriefingId(savedId);
      setLaunchData(data);
      setFormDefaults(data);
      setAvatarStoryDraft(data.avatarStory || '');
      setIsBriefingOpen(true);
    } catch (err) {
      console.error(err);
      setError('Ocorreu um erro ao salvar seu diagnóstico. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePhase = async (phaseId: string) => {
    if (!launchData) return;

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

  const handleChecklistFieldUpdate = async (key: keyof ChecklistFields, value: string) => {
    const previousChecklist = checklist;
    const updatedChecklist: ChecklistData = {
      ...checklist,
      fields: {
        ...checklist.fields,
        [key]: value,
      },
    };

    setChecklist(updatedChecklist);

    if (!briefingId) {
      return;
    }

    try {
      await updateDoc(doc(db, 'launchBriefings', briefingId), {
        checklist: updatedChecklist,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      setChecklist(previousChecklist);
      console.error('Erro ao atualizar campo do checklist', err);
      throw err;
    }
  };

  const handleChecklistBlockUpdate = async (blockId: ChecklistBlockId, status: ChecklistData['blocks'][number]['status']) => {
    const previousChecklist = checklist;
    const updatedChecklist: ChecklistData = {
      ...checklist,
      blocks: checklist.blocks.map(block =>
        block.id === blockId
          ? { ...block, status, approvedAt: status === 'approved' ? new Date().toISOString() : undefined }
          : block
      ),
    };

    setChecklist(updatedChecklist);

    if (!briefingId) {
      return;
    }

    try {
      await updateDoc(doc(db, 'launchBriefings', briefingId), {
        checklist: updatedChecklist,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      setChecklist(previousChecklist);
      console.error('Erro ao atualizar bloco do checklist', err);
      throw err;
    }
  };

  useEffect(() => {
    if (formDefaults && !isBriefingOpen) {
      setIsBriefingOpen(true);
    }
  }, [formDefaults, isBriefingOpen]);

  const handlePublikaSummaryChange = (field: keyof PublikaSummary, value: string) => {
    setPublikaSummary(prev => ({ ...prev, [field]: value }));
  };

  const handlePublikaCreditPackChange = (
    field: keyof PublikaSummary['creditPack'],
    value: string | number
  ) => {
    setPublikaSummary(prev => ({
      ...prev,
      creditPack: {
        ...prev.creditPack,
        [field]: value,
      },
    }));
  };

  const handlePublikaHighlightChange = (index: number, value: string) => {
    setPublikaSummary(prev => {
      const highlights = [...prev.highlights];
      highlights[index] = value;
      return { ...prev, highlights };
    });
  };

  const handlePublikaModuleChange = (code: string, field: keyof PublikaModule, value: string) => {
    setPublikaModules(prevModules =>
      prevModules.map(module => {
        if (module.code !== code) {
          return module;
        }

        if (field === 'credits') {
          return { ...module, credits: Number(value) };
        }

        if (field === 'status') {
          return { ...module, status: value as PublikaModule['status'] };
        }

        return { ...module, [field]: value };
      })
    );
  };

  const briefingPanel = isBriefingOpen ? (
    <div className="mt-4 rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-indigo-500/80">Briefing</p>
          <h3 className="text-2xl font-black text-slate-900">Diagnóstico estratégico</h3>
          <p className="text-sm text-slate-500 mt-1">Este formulário abastece os prompts de cada fase. Ajuste antes de gerar roteiros.</p>
        </div>
        <button
          onClick={() => setIsBriefingOpen(false)}
          className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-500 transition hover:border-slate-300"
        >
          Recolher
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <LaunchForm
            onSubmit={handleSaveBriefing}
            isLoading={isLoading}
            initialData={formDefaults ?? undefined}
            onAvatarStoryDraft={setAvatarStoryDraft}
          />
        </div>
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
              <BookOpen size={18} className="text-indigo-500" /> O que é usado aqui?
            </h3>
            <p className="text-sm text-slate-600">
              Cada campo alimenta o contexto dos CPLs, emails, anúncios e histórico do avatar antes de gerar roteiros com IA.
            </p>
          </div>

          <div className="bg-indigo-600 p-6 rounded-2xl text-white shadow-lg shadow-indigo-200">
            <h3 className="font-bold flex items-center gap-2 mb-2">
              <MessageSquare size={18} /> Dica do Especialista
            </h3>
            <p className="text-sm text-indigo-100 leading-relaxed">
              "Use exemplos reais do seu salão para cada resposta. Isso acelera a personalização dos roteiros de fase."
            </p>
          </div>
        </div>
      </div>

      <div className="mt-10 space-y-6">
        <div className="rounded-3xl border border-teal-100 bg-white/95 p-6 shadow-inner shadow-teal-50">
          <PublikaEditor
            summary={publikaSummary}
            modules={publikaModules}
            onSummaryChange={handlePublikaSummaryChange}
            onCreditPackChange={handlePublikaCreditPackChange}
            onHighlightChange={handlePublikaHighlightChange}
            onModuleChange={handlePublikaModuleChange}
          />
        </div>

        <div className="rounded-3xl border border-emerald-50 bg-white p-8 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-teal-500/80">Solução proprietária</p>
              <h3 className="text-2xl font-black text-slate-900">Pré-visualização da Publika.AI</h3>
              <p className="text-sm text-slate-500 mt-1">Acompanhe o resultado final enquanto edita os campos acima.</p>
            </div>
          </div>
          <div className="mt-8">
            <PublikaShowcase summary={publikaSummary} modules={publikaModules} />
          </div>
        </div>
      </div>
    </div>
  ) : null;

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

        <main className="space-y-12">
          <section className="space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-indigo-500/80">Fases</p>
              <h2 className="text-3xl font-black text-slate-900">Categorias do lançamento</h2>
              <p className="text-sm text-slate-500 mt-1">Visualize todas as fases agora e gere os roteiros completos quando desejar.</p>
            </div>

            <LaunchResult
              plan={plan}
              onGeneratePhase={handleGeneratePhase}
              canGeneratePhase={Boolean(launchData)}
              isDefaultPlan={isDefaultPlan}
              pendingAvatarStory={avatarStoryDraft}
              onOpenBriefing={() => setIsBriefingOpen(true)}
              briefingPanel={briefingPanel}
            />
          </section>
          <section className="space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-indigo-500/80">Checklists</p>
              <h2 className="text-3xl font-black text-slate-900">Comando Mestre operacional</h2>
              <p className="text-sm text-slate-500 mt-1">Acompanhe aprovações e campos críticos do lançamento, tudo salvo no Firestore.</p>
            </div>

            <ChecklistPanel
              checklist={checklist}
              onUpdateBlock={handleChecklistBlockUpdate}
              onUpdateField={handleChecklistFieldUpdate}
            />
          </section>

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
