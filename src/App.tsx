/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChecklistData, GuidanceEntry, GuidanceMap, LaunchData, LaunchPlan, LaunchPhase, StoredBriefing } from './types';
import { generateGuidedFieldCopy, generatePhaseDetails } from './services/gemini';
import LaunchForm from './components/LaunchForm';
import LaunchResult from './components/LaunchResult';
import { Sparkles, BookOpen, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';
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
import {
  collectFieldKeys,
  collectPhaseKeys,
  createEmptyGuidanceEntry,
  ensureGuidanceKeys,
  guidanceKeyForField,
  guidanceKeyForPhase,
  GuidedFieldKey,
} from './guidance';
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

const PHASE_OFFSETS: Record<string, number> = {
  PPL: -21,
  CPL1: -14,
  CPL2: -10,
  CPL3: -7,
  L1: 0,
  L2: 2,
  L3: 5,
};

const PHASE_MENU_LABELS: Record<string, string> = {
  PPL: 'PPL',
  CPL1: 'PL · CPL 1',
  CPL2: 'PL · CPL 2',
  CPL3: 'PL · CPL 3',
  L1: 'L · Abertura de Carrinho',
  L2: 'L · Meio de Carrinho',
  L3: 'L · Fechamento de Carrinho',
};

const DIAGNOSTIC_SECTION_IDS = new Set([
  'section-launch-date',
  'section-product-info',
  'section-expert-info',
  'section-avatar-info',
  'section-offer-info',
  'section-solution-info',
]);

const FIELD_GUIDANCE_PREFIX = 'field:';
const PHASE_GUIDANCE_PREFIX = 'phase:';

const TIMELINE_PHASE_ORDER = ['PPL', 'CPL1', 'CPL2', 'CPL3', 'L1', 'L2', 'L3'];

type NavItem = {
  id: string;
  label: string;
  helper?: string;
  phaseId?: string;
  description?: string;
  order?: number;
};

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
  const [guidance, setGuidance] = useState<GuidanceMap>(() => ensureGuidanceKeys(undefined, collectFieldKeys()));
  const [guidanceSaving, setGuidanceSaving] = useState<Record<string, boolean>>({});
  const [guidanceProcessing, setGuidanceProcessing] = useState<Record<string, boolean>>({});
  const [publikaSummary, setPublikaSummary] = useState<PublikaSummary>(PUBLIKA_SUMMARY);
  const [publikaModules, setPublikaModules] = useState<PublikaModule[]>(PUBLIKA_MODULES);
  const [activeDiagnosticSection, setActiveDiagnosticSection] = useState<string>('section-launch-date');
  const [focusedPhaseId, setFocusedPhaseId] = useState<string | null>(null);
  const briefingPanelRef = useRef<HTMLDivElement | null>(null);
  const getAllGuidanceKeys = useCallback(
    () => [
      ...collectFieldKeys(),
      ...collectPhaseKeys(plan.structure.map(phase => phase.id)),
    ],
    [plan.structure]
  );

  const updatePhaseStructure = (phaseId: string, updates: Partial<LaunchPhase>) => {
    setPlan(prevPlan => {
      const index = prevPlan.structure.findIndex(phase => phase.id === phaseId);
      if (index === -1) {
        return prevPlan;
      }

      const nextStructure = [...prevPlan.structure];
      nextStructure[index] = { ...nextStructure[index], ...updates };
      return { ...prevPlan, structure: nextStructure };
    });
  };

  const generatePhaseWithGuidance = async (phaseId: string, customGuidance?: GuidanceEntry) => {
    if (!launchData) {
      setError('Preencha e salve o diagnóstico antes de gerar esta fase.');
      return;
    }

    const phaseDefinition = plan.structure.find(phase => phase.id === phaseId);
    if (!phaseDefinition) {
      return;
    }

    updatePhaseStructure(phaseId, { isGenerating: true });

    try {
      const scripts = await generatePhaseDetails(
        launchData,
        phaseDefinition,
        customGuidance ?? guidance[guidanceKeyForPhase(phaseId)]
      );

      updatePhaseStructure(phaseId, { scripts, isGenerating: false });
    } catch (err) {
      console.error(err);
      setError('Erro ao gerar detalhes da fase. Tente novamente.');
      updatePhaseStructure(phaseId, { isGenerating: false });
      throw err;
    }
  };

  const phaseDates = useMemo(() => {
    const base = launchData?.launchDate ? new Date(`${launchData.launchDate}T00:00:00`) : null;
    const isValidBase = base && !Number.isNaN(base.getTime());

    const formatOffsetLabel = (offset: number) => {
      if (!offset) return 'D0';
      return offset > 0 ? `D+${offset}` : `D${offset}`;
    };

    return Object.fromEntries(
      Object.entries(PHASE_OFFSETS).map(([phaseId, offset]) => {
        if (isValidBase && base) {
          const phaseDate = new Date(base);
          phaseDate.setDate(phaseDate.getDate() + offset);
          const formatted = phaseDate.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
          });
          return [phaseId, `${formatted} · ${formatOffsetLabel(offset)}`];
        }

        return [phaseId, formatOffsetLabel(offset)];
      })
    );
  }, [launchData?.launchDate]);

  const formattedLaunchDate = useMemo(() => {
    if (!launchData?.launchDate) return null;
    const date = new Date(`${launchData.launchDate}T00:00:00`);
    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }, [launchData?.launchDate]);

  const navItems = useMemo<NavItem[]>(() => {
    const staticItems: NavItem[] = [
      { id: 'section-launch-date', label: 'Data do lançamento' },
      { id: 'section-expert-info', label: 'Informações da Expert · História' },
      { id: 'section-product-info', label: 'Informações de Produto' },
      { id: 'section-avatar-info', label: 'Informações de Avatar' },
      { id: 'section-offer-info', label: 'Informações de Oferta' },
      { id: 'section-solution-info', label: 'Informações da Solução' },
      { id: 'section-timeline-overview', label: 'Linha do tempo' },
    ];

    let orderCounter = 0;
    const phaseItems: NavItem[] = plan.structure
      .filter(phase => PHASE_MENU_LABELS[phase.id])
      .map(phase => {
        orderCounter += 1;
        return {
          id: `phase-${phase.id.toLowerCase()}`,
          label: PHASE_MENU_LABELS[phase.id],
          helper: phaseDates[phase.id],
          phaseId: phase.id,
          description: phase.description,
          order: orderCounter,
        };
      });

    return [
      ...staticItems,
      ...phaseItems,
    ];
  }, [phaseDates, plan.structure]);

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
          return;
        }

        const docSnapshot = snapshot.docs[0];
        const data = docSnapshot.data() as StoredBriefing;
        const { checklist: storedChecklist, guidance: storedGuidance, createdAt, updatedAt, ...launchFields } = data;

        setBriefingId(docSnapshot.id);
        setChecklist(mergeChecklist(storedChecklist));
        const normalized = normalizeLaunchData(launchFields);
        setFormDefaults(normalized);
        setAvatarStoryDraft(normalized.avatarStory || '');
        setLaunchData(normalized);
        const allKeys = [
          ...collectFieldKeys(),
          ...collectPhaseKeys(plan.structure.map(phase => phase.id)),
        ];
        setGuidance(prev => ensureGuidanceKeys(storedGuidance ?? prev, allKeys));
      } catch (fetchError) {
        console.error('Erro ao carregar briefing anterior', fetchError);
      }
    };

    fetchLatestBriefing();
  }, []);

  useEffect(() => {
    setGuidance(prev => ensureGuidanceKeys(prev, getAllGuidanceKeys()));
  }, [getAllGuidanceKeys]);

  useEffect(() => {
    if (!focusedPhaseId && plan.structure.length) {
      setFocusedPhaseId(plan.structure[0].id);
    }
  }, [plan.structure, focusedPhaseId]);

  const persistBriefing = async (data: LaunchData) => {
    const normalizedChecklist = mergeChecklist(checklist);
    setChecklist(normalizedChecklist);

    const payload = {
      ...data,
      checklist: normalizedChecklist,
      guidance,
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
    } catch (err) {
      console.error(err);
      setError('Ocorreu um erro ao salvar seu diagnóstico. Por favor, tente novamente.');
      const fallback = normalizeLaunchData(launchData ?? INITIAL_BRIEFING);
      setLaunchData(fallback);
      setFormDefaults(fallback);
      setAvatarStoryDraft(fallback.avatarStory || '');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePhase = async (phaseId: string) => {
    await generatePhaseWithGuidance(phaseId);
  };

  const updateGuidanceValue = (key: string, field: keyof GuidanceEntry, value: string) => {
    setGuidance(prev => ({
      ...prev,
      [key]: {
        ...(prev[key] ?? createEmptyGuidanceEntry()),
        [field]: value,
      },
    }));
  };

  const handleSaveGuidanceEntry = async (key: string) => {
    const current = guidance[key] ?? createEmptyGuidanceEntry();
    const stamped: GuidanceEntry = { ...current, updatedAt: new Date().toISOString() };
    const updatedGuidance = { ...guidance, [key]: stamped };
    setGuidance(updatedGuidance);

    if (!briefingId) {
      return;
    }

    try {
      setGuidanceSaving(prev => ({ ...prev, [key]: true }));
      await updateDoc(doc(db, 'launchBriefings', briefingId), {
        guidance: updatedGuidance,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Erro ao salvar instruções personalizadas', err);
      setError('Não foi possível salvar as instruções agora. Tente novamente.');
    } finally {
      setGuidanceSaving(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleProcessGuidanceEntry = async (key: string) => {
    const entry = guidance[key] ?? createEmptyGuidanceEntry();

    setGuidanceProcessing(prev => ({ ...prev, [key]: true }));

    try {
      if (key.startsWith(FIELD_GUIDANCE_PREFIX)) {
        const baseData = launchData ?? formDefaults;
        if (!baseData) {
          setError('Preencha e salve o diagnóstico antes de processar esse bloco.');
          return;
        }

        const field = key.replace(FIELD_GUIDANCE_PREFIX, '') as GuidedFieldKey;
        const generated = await generateGuidedFieldCopy(field, baseData, entry);
        setLaunchData(prev => ({ ...(prev ?? baseData), [field]: generated }));
        setFormDefaults(prev => ({ ...(prev ?? baseData), [field]: generated }));
        if (field === 'avatarStory') {
          setAvatarStoryDraft(generated);
        }
      } else if (key.startsWith(PHASE_GUIDANCE_PREFIX)) {
        const phaseId = key.replace(PHASE_GUIDANCE_PREFIX, '');
        await generatePhaseWithGuidance(phaseId, entry);
      }
    } catch (err) {
      console.error('Erro ao processar instruções personalizadas', err);
      setError('Não foi possível processar este bloco. Tente novamente.');
    } finally {
      setGuidanceProcessing(prev => ({ ...prev, [key]: false }));
    }
  };

  const scrollToSection = (targetId: string) => {
    if (DIAGNOSTIC_SECTION_IDS.has(targetId)) {
      setActiveDiagnosticSection(targetId);

      setTimeout(() => {
        if (typeof window === 'undefined') return;
        briefingPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      return;
    }

    if (typeof window === 'undefined') return;

    if (targetId.startsWith('phase-')) {
      setFocusedPhaseId(targetId.replace('phase-', '').toUpperCase());
    }

    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
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

  const isSolutionSection = activeDiagnosticSection === 'section-solution-info';

  const briefingPanel = (
    <div ref={briefingPanelRef} className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm space-y-10">
      <div className={`${isSolutionSection ? 'hidden' : 'space-y-8'}`}>
        <LaunchForm
          onSubmit={handleSaveBriefing}
          isLoading={isLoading}
          initialData={formDefaults ?? undefined}
          onAvatarStoryDraft={setAvatarStoryDraft}
          activeSection={activeDiagnosticSection}
          guidance={guidance}
          guidanceSaving={guidanceSaving}
          guidanceProcessing={guidanceProcessing}
          onGuidanceChange={updateGuidanceValue}
          onSaveGuidance={handleSaveGuidanceEntry}
          onProcessGuidance={handleProcessGuidanceEntry}
        />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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

      <div
        id="section-solution-info"
        className={`${isSolutionSection ? 'block' : 'hidden'} space-y-6`}
      >
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
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Background Decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-100 rounded-full blur-3xl opacity-50" />
        <div className="absolute top-[60%] -right-[10%] w-[30%] h-[30%] bg-blue-100 rounded-full blur-3xl opacity-50" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 py-12 md:py-20">
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

        <div className="mt-12 flex flex-col gap-8 lg:flex-row">
          <aside className="lg:w-64">
            <div className="hidden lg:block sticky top-24 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-indigo-500/60">Fluxo</p>
              <nav className="space-y-2">
                {navItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-600"
                  >
                    <span className="block">{item.label}</span>
                    {item.helper && (
                      <span className="text-xs font-normal text-slate-400">{item.helper}</span>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          <div className="flex-1 space-y-12">
            <div className="lg:hidden -mx-4 px-4">
              <div className="flex gap-3 overflow-x-auto pb-4">
                {navItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 whitespace-nowrap"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <section id="section-timeline-overview" className="space-y-6">
              <div className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-white to-indigo-50 p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.4em] text-indigo-500/80">Linha do tempo</p>
                <h3 className="text-3xl font-black text-slate-900 mt-2">
                  {formattedLaunchDate ?? 'Defina a data oficial no formulário'}
                </h3>
                <p className="text-sm text-slate-500 mt-2">
                  Todos os marcos abaixo são calculados automaticamente a partir desta data.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {TIMELINE_PHASE_ORDER.map(phaseId => (
                  <div key={phaseId} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">{PHASE_MENU_LABELS[phaseId] ?? phaseId}</p>
                    <p className="text-base font-semibold text-slate-800 mt-2">{phaseDates[phaseId]}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.4em] text-indigo-500/80">Briefing</p>
                  <h2 className="text-3xl font-black text-slate-900">Diagnóstico estratégico</h2>
                  <p className="text-sm text-slate-500 mt-1">Preencha uma vez e reaproveite em cada fase do lançamento.</p>
                </div>
              </div>
              {briefingPanel}
            </section>

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
                phaseDates={phaseDates}
                requestedPhaseId={focusedPhaseId}
                onPhaseRequestHandled={() => setFocusedPhaseId(null)}
                guidance={guidance}
                guidanceSaving={guidanceSaving}
                guidanceProcessing={guidanceProcessing}
                onGuidanceChange={updateGuidanceValue}
                onSaveGuidance={handleSaveGuidanceEntry}
                onProcessGuidance={handleProcessGuidanceEntry}
              />
            </section>

            {error && (
              <div className="mt-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-center font-medium">
                {error}
              </div>
            )}
          </div>
        </div>

        <footer className="mt-20 text-center text-slate-400 text-sm">
          <p>© {new Date().getFullYear()} Launch Master - Baseado na metodologia Fórmula de Lançamento.</p>
        </footer>
      </div>
    </div>
  );
}
