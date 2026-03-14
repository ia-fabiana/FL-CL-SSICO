/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { jsPDF } from 'jspdf';
import { AudienceDay, ChecklistData, GuidanceEntry, GuidanceMap, LaunchData, LaunchPlan, LaunchPhase, LaunchType, PhaseContentMap, PhaseTask, RootScriptVersion, RootScriptVersionStatus, StoredBriefing, TaskProof } from './types';
import { generateGuidedFieldCopy, generatePhaseDetails, generateRootHeadlines, generateRootScript, generateTaskContentDraft } from './services/gemini';
import LaunchForm from './components/LaunchForm';
import AudienceCreationPanel from './components/AudienceCreationPanel';
import { Sparkles, BookOpen, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';
import { PublikaShowcase } from './components/PublikaShowcase';
import { PublikaEditor } from './components/PublikaEditor';
import { db, storage } from './firebase';
import { IA_FABIANA_BRIEFING } from './briefingDefaults';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { createInitialChecklist, mergeChecklist } from './checklist';
import { PUBLIKA_MODULES, PUBLIKA_SUMMARY, PublikaModule, PublikaSummary } from './publika';
import {
  applyPhaseGuidanceDefaults,
  collectFieldKeys,
  collectPhaseKeys,
  createEmptyGuidanceEntry,
  ensureGuidanceKeys,
  guidanceKeyForField,
  guidanceKeyForPhase,
  GuidedFieldKey,
} from './guidance';
import { getDefaultPlan } from './planDefaults';
import { DEFAULT_SCRIPT_DURATION_MINUTES } from './constants';

const EMPTY_LAUNCH_DATA: LaunchData = {
  generalTriggers: '',
  launchType: 'classic',
  avatarName: '',
  expertInstagramHandle: '',
  expertInstagramUrl: '',
  expertFacebookUrl: '',
  expertYoutubeUrl: '',
  expertLinkInBio: '',
  expertPhotoReferenceUrl: '',
  expertLookGuide: '',
  expertLookReferenceUrl: '',
  expertEnvironmentGuide: '',
  expertEnvironmentReferenceUrl: '',
  expertArtDirection: '',
  productName: '',
  niche: '',
  targetAudience: '',
  mainProblem: '',
  mainBenefit: '',
  avatarStory: '',
  avatarAge: '',
  avatarGender: '',
  avatarSalary: '',
  avatarProfession: '',
  avatarReligion: '',
  avatarPoliticalOrientation: '',
  avatarOtherDetails: '',
  avatarSummary: '',
  avatarPains: '',
  avatarDesires: '',
  avatarObjections: '',
  avatarRomaMyth: '',
  avatarFear: '',
  avatarLimitingBeliefs: '',
  avatarQuote: '',
  avatarOpportunitiesShortcuts: '',
  avatarResearchABC: '',
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

const getLaunchTypeLabel = (launchType: LaunchType) =>
  launchType === 'seed' ? 'Semente' : 'Clássico';

const getBasePlan = (launchType: LaunchType) => getDefaultPlan(launchType);

const normalizeLaunchData = (data?: Partial<LaunchData> | null): LaunchData => ({
  ...EMPTY_LAUNCH_DATA,
  ...data,
});

const INITIAL_BRIEFING = normalizeLaunchData(IA_FABIANA_BRIEFING);
const ROOT_SCRIPT_UI_VERSION = 'v2026.03.13-2';

const CLASSIC_PHASE_OFFSETS: Record<string, number> = {
  PPL: -21,
  CPL1: -14,
  CPL2: -10,
  CPL3: -7,
  L1: 0,
  L2: 2,
  L3: 5,
};

const SEED_PHASE_OFFSETS: Record<string, number> = {
  CLI: -14,
  AL: -7,
  SEED_WEBINAR: 0,
  SEED_CART: 0,
  SEED_DELIVERY: 2,
  SEED_DEBRIEF: 7,
};

const CLASSIC_PHASE_MENU_LABELS: Record<string, string> = {
  PPL: 'AL - Aquecimento de Inscritos',
  CPL1: 'PL · CPL 1',
  CPL2: 'PL · CPL 2',
  CPL3: 'PL · CPL 3',
  L1: 'L · Abertura de Carrinho',
  L2: 'L · Meio de Carrinho',
  L3: 'L · Fechamento de Carrinho',
};

const SEED_PHASE_MENU_LABELS: Record<string, string> = {
  CLI: 'CLI - Construcao da Lista de Inscritos',
  AL: 'AL - Aquecimento de Inscritos',
  SEED_WEBINAR: 'SEMENTE · Webinario (Aula Ao Vivo)',
  SEED_CART: 'SEMENTE · Carrinho Aberto',
  SEED_DELIVERY: 'SEMENTE · Entrega do Produto',
  SEED_DEBRIEF: 'SEMENTE · Debriefing',
};

const DIAGNOSTIC_SECTION_IDS = new Set([
  'section-launch-date',
  'section-product-info',
  'section-roma-info',
  'section-general-triggers',
  'section-expert-info',
  'section-avatar-info',
  'section-offer-info',
  'section-solution-info',
]);

const FIELD_GUIDANCE_PREFIX = 'field:';
const PHASE_GUIDANCE_PREFIX = 'phase:';

const CLASSIC_TIMELINE_PHASE_ORDER = ['PPL', 'CPL1', 'CPL2', 'CPL3', 'L1', 'L2', 'L3'];
const SEED_TIMELINE_PHASE_ORDER = ['CLI', 'AL', 'SEED_WEBINAR', 'SEED_CART', 'SEED_DELIVERY', 'SEED_DEBRIEF'];
const SCRIPT_DURATION_OPTIONS = [15, 20, 25, 30, 35, 40, 45, 60];
const QUICK_SAVE_TIMEOUT_MS = 7000;
const BRIEFING_SAVE_TIMEOUT_MS = 12000;
const LOCAL_LAUNCH_DATA_KEY = 'fl-classico-launch-data';
const LOCAL_GUIDANCE_KEY = 'fl-classico-guidance-data';

const DEFAULT_AUDIENCE_DAYS: AudienceDay[] = [
  {
    id: 'day-audience-creation',
    label: 'Criação de Audiência',
    tasks: [
      {
        id: 'task-watch-class',
        title: 'Assistir à aula de Criação de Audiência',
        platform: 'geral',
        done: false,
      },
      {
        id: 'task-post-summary',
        title: 'Postar o resumo da aula na comunidade',
        platform: 'geral',
        done: false,
      },
      {
        id: 'task-review-profiles',
        title: 'Revisar a estrutura dos perfis nas redes sociais',
        platform: 'geral',
        done: false,
        subTasks: [
          // Instagram
          { id: 'ig-01', title: 'Atualizar os stories em destaque (covers e conteúdo)', done: false },
          {
            id: 'ig-02',
            title: 'Revisar a bio: cargo, promessa, palavra-chave e link',
            done: false,
            contentMode: 'text',
          },
          { id: 'ig-03', title: 'Conferir o link na bio (criar ou ajustar Linktree/página)', done: false },
          {
            id: 'ig-04',
            title: 'Criar ou atualizar o post fixado apresentando o trabalho',
            done: false,
            contentMode: 'both',
            imageSpec: { label: 'Post para Instagram', ratio: '4:5', width: 1080, height: 1350 },
            expertPhotoRequired: true,
          },
          { id: 'ig-05', title: 'Revisar os últimos posts para verificar alinhamento com o avatar', done: false },
          { id: 'ig-06', title: 'Definir a pauta dos primeiros posts do período de criação de audiência', done: false },
          // Facebook
          { id: 'fb-01', title: 'Atualizar a foto de capa com a promessa ROMA', done: false },
          { id: 'fb-02', title: 'Conferir a bio e os dados de contato', done: false },
          { id: 'fb-03', title: 'Verificar se o grupo (se houver) está ativo e com regras visíveis', done: false },
          // YouTube
          { id: 'yt-01', title: 'Criar ou atualizar a capa do canal com a promessa ROMA', done: false },
          { id: 'yt-02', title: 'Criar ou atualizar o vídeo de boas-vindas do canal', done: false },
          { id: 'yt-03', title: 'Organizar as playlists e conferir a descrição do canal', done: false },
        ],
      },
      {
        id: 'task-plan-reels',
        title: 'Planejar pelo menos 4 reels nutella e 1 raiz por semana até o início da captação de leads',
        platform: 'geral',
        notes: 'Defina os temas antecipadamente usando a Lista de Temas desta plataforma.',
        done: false,
      },
    ],
  },
];


const ROOT_SCRIPT_MARKDOWN_COMPONENTS = {
  h1: ({ children }: { children: React.ReactNode }) => (
    <h1 className="text-xl font-black text-slate-900">{children}</h1>
  ),
  h2: ({ children }: { children: React.ReactNode }) => (
    <h2 className="mt-5 text-lg font-black text-slate-900">{children}</h2>
  ),
  h3: ({ children }: { children: React.ReactNode }) => (
    <h3 className="mt-4 text-base font-black text-slate-900">{children}</h3>
  ),
  p: ({ children }: { children: React.ReactNode }) => (
    <p className="mt-3 text-sm leading-relaxed text-slate-700">{children}</p>
  ),
  ul: ({ children }: { children: React.ReactNode }) => (
    <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">{children}</ul>
  ),
  ol: ({ children }: { children: React.ReactNode }) => (
    <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-slate-700">{children}</ol>
  ),
  li: ({ children }: { children: React.ReactNode }) => <li>{children}</li>,
  strong: ({ children }: { children: React.ReactNode }) => (
    <span className="rounded-md bg-pink-100 px-1.5 py-0.5 font-black text-pink-700">{children}</span>
  ),
  code: ({ children }: { children: React.ReactNode }) => (
    <span className="rounded-md bg-sky-100 px-1.5 py-0.5 font-semibold text-sky-700">{children}</span>
  ),
};

const loadLaunchDataFromStorage = (): LaunchData | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(LOCAL_LAUNCH_DATA_KEY);
    if (!raw) {
      return null;
    }
    return normalizeLaunchData(JSON.parse(raw));
  } catch (storageError) {
    console.warn('Erro ao ler briefing salvo localmente', storageError);
    return null;
  }
};

const saveLaunchDataToStorage = (data: LaunchData) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(LOCAL_LAUNCH_DATA_KEY, JSON.stringify(data));
  } catch (storageError) {
    console.warn('Erro ao salvar briefing localmente', storageError);
  }
};

const loadGuidanceFromStorage = (): GuidanceMap | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(LOCAL_GUIDANCE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as GuidanceMap;
  } catch (storageError) {
    console.warn('Erro ao ler guidance salvo localmente', storageError);
    return null;
  }
};

const saveGuidanceToStorage = (data: GuidanceMap) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(LOCAL_GUIDANCE_KEY, JSON.stringify(data));
  } catch (storageError) {
    console.warn('Erro ao salvar guidance localmente', storageError);
  }
};

const stripHtml = (value?: string | null): string => {
  if (!value) {
    return '';
  }

  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const getFirebaseErrorMessage = (error: unknown, fallback: string): string => {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : '';

  const normalized = message.toLowerCase();

  if (normalized.includes('firestore api has not been used') || normalized.includes('it is disabled')) {
    return 'O Firestore do projeto fl-classico está desativado. Ative a Cloud Firestore API no Firebase/Google Cloud para liberar os salvamentos.';
  }

  if (normalized.includes('permission-denied')) {
    return 'O Firebase respondeu com PERMISSION_DENIED. Verifique se a Cloud Firestore API está ativa e se as regras permitem escrita.';
  }

  if (normalized.includes('unavailable') || normalized.includes('offline')) {
    return 'Não foi possível conectar ao Firestore agora. Verifique a internet e o status do projeto Firebase.';
  }

  return fallback;
};

const hasGuidanceContent = (entry?: GuidanceEntry | null): boolean =>
  Boolean(entry?.keyPoints?.trim() || entry?.framework?.trim());

const getGuidanceTimestamp = (entry?: GuidanceEntry | null): number => {
  if (!entry?.updatedAt) {
    return 0;
  }

  const parsed = Date.parse(entry.updatedAt);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const mergeGuidanceSources = (
  remote: GuidanceMap | undefined,
  local: GuidanceMap | null | undefined,
  keys: string[]
): GuidanceMap => {
  const merged: GuidanceMap = {};

  keys.forEach(key => {
    const remoteEntry = remote?.[key];
    const localEntry = local?.[key];

    if (remoteEntry && localEntry) {
      const remoteHasContent = hasGuidanceContent(remoteEntry);
      const localHasContent = hasGuidanceContent(localEntry);

      if (remoteHasContent !== localHasContent) {
        merged[key] = remoteHasContent ? remoteEntry : localEntry;
        return;
      }

      merged[key] =
        getGuidanceTimestamp(localEntry) > getGuidanceTimestamp(remoteEntry)
          ? localEntry
          : remoteEntry;
      return;
    }

    if (remoteEntry || localEntry) {
      merged[key] = remoteEntry ?? localEntry ?? createEmptyGuidanceEntry();
      return;
    }

    merged[key] = createEmptyGuidanceEntry();
  });

  return merged;
};

const normalizeMarkdownStructure = (value?: string | null): string => {
  if (!value) {
    return '';
  }

  const normalizedLines = value
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map(line => line.trimEnd())
    .map(line => {
      const trimmed = line.trim();
      if (!trimmed) {
        return '';
      }

      if (/^(#{1,6}\s|[-*+]\s|>\s|\d+\.\s|```|\|)/.test(trimmed)) {
        return trimmed;
      }

      const labelWithValue = trimmed.match(/^([^:]{2,80}):\s+(.+)$/);
      if (labelWithValue) {
        return `- **${labelWithValue[1].trim()}:** ${labelWithValue[2].trim()}`;
      }

      const labelOnly = trimmed.match(/^([^:]{2,80}):\s*$/);
      if (labelOnly) {
        return `## ${labelOnly[1].trim()}`;
      }

      return trimmed;
    });

  return normalizedLines
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

const normalizeGuidanceEntryForStorage = (entry?: GuidanceEntry | null): GuidanceEntry => ({
  keyPoints: normalizeMarkdownStructure(entry?.keyPoints),
  framework: normalizeMarkdownStructure(entry?.framework),
  ...(entry?.updatedAt ? { updatedAt: entry.updatedAt } : {}),
});

const normalizeGuidanceMapForStorage = (map: GuidanceMap): GuidanceMap =>
  Object.fromEntries(
    Object.entries(map).map(([key, entry]) => [key, normalizeGuidanceEntryForStorage(entry)])
  );

type AvatarKnowledgeBaseField =
  | 'avatarOtherDetails'
  | 'avatarSummary'
  | 'avatarPains'
  | 'avatarDesires'
  | 'avatarObjections'
  | 'avatarRomaMyth'
  | 'avatarFear'
  | 'avatarLimitingBeliefs'
  | 'avatarQuote'
  | 'avatarOpportunitiesShortcuts'
  | 'avatarResearchABC';

const AVATAR_KNOWLEDGE_BASE_FIELDS: AvatarKnowledgeBaseField[] = [
  'avatarOtherDetails',
  'avatarSummary',
  'avatarPains',
  'avatarDesires',
  'avatarObjections',
  'avatarRomaMyth',
  'avatarFear',
  'avatarLimitingBeliefs',
  'avatarQuote',
  'avatarOpportunitiesShortcuts',
  'avatarResearchABC',
];

const normalizeAvatarKnowledgeBaseForStorage = (data: LaunchData): LaunchData => {
  const nextData: LaunchData = { ...data };

  AVATAR_KNOWLEDGE_BASE_FIELDS.forEach(field => {
    nextData[field] = normalizeMarkdownStructure(nextData[field]);
  });

  return nextData;
};

type NavItem = {
  id: string;
  label: string;
  helper?: string;
  phaseId?: string;
  description?: string;
  order?: number;
};

type AvatarThemeField =
  | 'avatarPains'
  | 'avatarDesires'
  | 'avatarObjections'
  | 'avatarRomaMyth'
  | 'avatarFear'
  | 'avatarLimitingBeliefs'
  | 'avatarQuote'
  | 'avatarOpportunitiesShortcuts'
  | 'avatarResearchABC';

type AvatarThemeItem = {
  id: string;
  title: string;
  sourceKey: AvatarThemeField;
  sourceLabel: string;
  sourceAngle: string;
  rawValue: string;
  order: number;
};

type EditorialLineOption = {
  id: string;
  title: string;
  description: string;
  benefits: string;
  howTo: string;
  bestUse: string;
};

type ThemeVisualStyle = {
  cardClassName: string;
  badgeClassName: string;
  titleClassName: string;
  angleClassName: string;
  activeButtonClassName: string;
  inactiveButtonClassName: string;
  statusActiveClassName: string;
};

type QuestionMenuSection = {
  id: string;
  title: string;
  prompts: string[];
};

type ThemeQuestionSelectionMap = Record<string, Record<string, string[]>>;

const AVATAR_THEME_FIELDS: Array<{
  key: AvatarThemeField;
  label: string;
  angle: string;
}> = [
  {
    key: 'avatarPains',
    label: 'Dores',
    angle: 'Traga o problema real, o desconforto atual e o custo de continuar assim.',
  },
  {
    key: 'avatarDesires',
    label: 'Desejos',
    angle: 'Mostre o resultado desejado e por que ele vale o esforco agora.',
  },
  {
    key: 'avatarObjections',
    label: 'Objecoes',
    angle: 'Quebre resistencias, duvidas e travas que impedem a acao.',
  },
  {
    key: 'avatarRomaMyth',
    label: 'Mito sobre ROMA',
    angle: 'Desfaca a ideia errada que faz o avatar desacreditar da promessa.',
  },
  {
    key: 'avatarFear',
    label: 'Medo',
    angle: 'Mostre o risco de nao agir e a tensao emocional envolvida.',
  },
  {
    key: 'avatarLimitingBeliefs',
    label: 'Crencas limitantes',
    angle: 'Traga as verdades distorcidas que fazem o avatar se sabotar ou desacreditar.',
  },
  {
    key: 'avatarQuote',
    label: '"Abre Aspas"',
    angle: 'Use a fala literal do avatar como gancho de identificacao imediata.',
  },
  {
    key: 'avatarOpportunitiesShortcuts',
    label: 'Oportunidades e Atalhos',
    angle: 'Apresente caminhos praticos, ganhos rapidos e portas de entrada.',
  },
  {
    key: 'avatarResearchABC',
    label: 'Pesquisa ABC',
    angle: 'Aproveite vocabulario de pesquisa, curiosidade e perguntas do mercado.',
  },
];

const EDITORIAL_LINE_OPTIONS: EditorialLineOption[] = [
  {
    id: 'aula',
    title: 'Aula',
    description: 'Conteudo em formato de aula, ao vivo ou gravado, para ensinar o tema com clareza.',
    benefits: 'Da mais controle sobre o planejamento e ajuda a aprofundar o raciocinio.',
    howTo: 'Pode ser camera direta, tela, apresentacao ou flip chart.',
    bestUse: 'Excelente quando o tema pede contexto, explicacao e organizacao do passo a passo.',
  },
  {
    id: 'perguntas-respostas',
    title: 'Perguntas e Respostas',
    description: 'Formato de FAQ com perguntas reais ou pre-selecionadas pela audiencia.',
    benefits: 'Confirma que o tema conversa com a realidade do avatar e aumenta proximidade.',
    howTo: 'Use caixa de perguntas, comentarios, direct ou perguntas recorrentes da audiencia.',
    bestUse: 'Ideal para objecoes, mitos, medos e perguntas muito repetidas.',
  },
  {
    id: 'entrevistas',
    title: 'Entrevistas',
    description: 'Conversa com aluno, cliente, expert ou convidado para explorar o tema.',
    benefits: 'Reforca autoridade, prova e percepcao de resultado real.',
    howTo: 'Agende a entrevista com um caso concreto e use perguntas que puxem detalhes praticos.',
    bestUse: 'Perfeito para temas que precisam de prova, caso real e validacao social.',
  },
  {
    id: 'consultoria-online',
    title: 'Consultoria Online',
    description: 'Analise um caso real ao vivo, resolvendo um problema ligado ao tema.',
    benefits: 'Mistura autoridade, reciprocidade e demonstracao pratica.',
    howTo: 'Escolha um participante, diagnostique a situacao e construa um plano acionavel.',
    bestUse: 'Funciona muito bem para dores, medos e oportunidades que pedem intervencao pratica.',
  },
  {
    id: 'bastidores',
    title: 'Bastidores',
    description: 'Mostre o processo, os ajustes, o suporte e a execucao por tras do resultado.',
    benefits: 'Aumenta prova, percepcao de movimento e sensacao de realidade.',
    howTo: 'Grave cenas do processo, reunioes, ajustes, rotina e evolucao do trabalho.',
    bestUse: 'Bom para atalhos, oportunidades, metodo e construcao de confianca.',
  },
  {
    id: 'live-pre-lancamento',
    title: 'Live Pre-lancamento',
    description: 'Live de aquecimento para gerar interesse e preparar a audiencia para o tema.',
    benefits: 'Aumenta antecipacao e cria ponte com o evento principal.',
    howTo: 'Abra com um gancho forte, entregue clareza e termine com proximo passo definido.',
    bestUse: 'Boa para dores, medos e desejos que precisam ganhar urgencia.',
  },
  {
    id: 'webinario-semente',
    title: 'Webinario Semente',
    description: 'Aula central do semente para apresentar oportunidade, metodo e oferta.',
    benefits: 'Organiza a narrativa e conecta contexto, desejo e decisao.',
    howTo: 'Use uma linha de raciocinio progressiva que leve da consciencia para a acao.',
    bestUse: 'Ideal para desejos, oportunidades, mito sobre ROMA e visao de futuro.',
  },
  {
    id: 'webinario-cpl1',
    title: 'Webinario CPL 1',
    description: 'Primeiro conteudo classico para abrir a conversa e preparar o terreno.',
    benefits: 'Cria consciencia, interesse e enquadramento do tema.',
    howTo: 'Foque no contexto, no erro comum e na nova forma de ver o problema.',
    bestUse: 'Combina com dores, objecoes e mitos centrais do avatar.',
  },
  {
    id: 'webinario-cpl2',
    title: 'Webinario CPL 2',
    description: 'Segundo conteudo classico para aprofundar a oportunidade e aumentar desejo.',
    benefits: 'Expande a visao de beneficio e prepara o avatar para a mudanca.',
    howTo: 'Trabalhe contraste entre situacao atual e possibilidade real de transformacao.',
    bestUse: 'Muito forte para desejos, oportunidades, atalhos e beneficios praticos.',
  },
  {
    id: 'webinario-cpl3',
    title: 'Webinario CPL 3',
    description: 'Terceiro conteudo classico para consolidar solucao, prova e acao.',
    benefits: 'Une autoridade, prova e prontidao para a oferta.',
    howTo: 'Amarre prova, metodo, objecoes finais e passo imediato.',
    bestUse: 'Funciona muito bem para objecoes, medo, atalhos e decisao final.',
  },
];

const SCRIPT_STRUCTURE_STEPS = [
  {
    id: 'introducao',
    title: '1. Introducao',
    items: ['Saudacao', 'Beneficio do programa', 'Eu sou', 'Tema do episodio'],
  },
  {
    id: 'contexto',
    title: '2. Contexto',
    items: ['Explique o que e esse tema.', 'Explique o que nao e esse tema.'],
  },
  {
    id: 'beneficios',
    title: '3. Beneficios',
    items: [
      'Explique por que esse tema e uma oportunidade.',
      'De 1 a 3 exemplos de pessoas semelhantes ao avatar que tiveram resultado com esse tema.',
      'Responda de 1 a 3 objecoes que aparecem quando esse tema entra em cena.',
    ],
  },
  {
    id: 'como',
    title: '4. Como',
    items: [
      'Explique um jeito errado de executar esse tema.',
      'Explique um jeito certo de executar esse tema.',
      'Escreva um pequeno passo para comecar imediatamente.',
    ],
  },
];

const QUESTION_MENU_SECTIONS: QuestionMenuSection[] = [
  {
    id: 'contexto',
    title: 'O que e / Contexto',
    prompts: [
      'O que e {tema}?',
      'As pessoas confundem o que significa isso?',
      'Qual a diferenca entre {tema} e a alternativa mais comum?',
      'Quais tipos de {tema} existem?',
    ],
  },
  {
    id: 'beneficios',
    title: 'Beneficios',
    prompts: [
      'Por que {tema} e importante?',
      'Por que investir tempo ou dinheiro nisso?',
      'Qual o maior beneficio de {tema}?',
      'Por que {tema} consegue gerar resultado?',
      'Quais as vantagens de usar {tema}?',
      'Se eu nao fizer {tema}, o que acontece?',
      'Qual e o melhor momento para aplicar {tema}?',
      'O que vale mais: fazer {tema} ou seguir a alternativa comum?',
    ],
  },
  {
    id: 'como-fazer',
    title: 'Como fazer',
    prompts: [
      'Onde as pessoas mais erram nisso?',
      'Por onde comecar?',
      'Como voce organiza {tema}?',
      'Quando e melhor fazer {tema}?',
      'Voce tem um exemplo pratico de como fazer isso?',
      'Como melhorar {tema}?',
      'Como fazer {tema} mesmo sem ter tudo pronto?',
      'Como usar {tema} em um caso especifico do avatar?',
    ],
  },
  {
    id: 'estudos-de-caso',
    title: 'Estudos de caso',
    prompts: [
      'Voce tem um exemplo de alguem que ja fez isso?',
      'Algum aluno seu ja fez isso?',
      'Quem foi o primeiro aluno a fazer isso?',
      'Quantos alunos seus ja conseguiram isso?',
      'Quem e a pessoa que mais fez isso?',
    ],
  },
  {
    id: 'historias',
    title: 'Historias',
    prompts: [
      'Como voce chegou nessa conclusao?',
      'Como foi que voce descobriu isso?',
      'Quando foi a primeira vez que isso aconteceu?',
      'Voce se lembra de alguma historia em que isso foi importante para voce?',
      'Quanto tempo voce demorou para fazer isso?',
    ],
  },
  {
    id: 'estudos',
    title: 'Estudos',
    prompts: [
      'Quais dados demograficos ajudam a sustentar esse tema?',
      'Existem estudos cientificos que ajudam a explicar isso?',
      'Quais estatisticas fortalecem esse ponto?',
      'Existe alguma historia com numeros que deixe isso mais concreto?',
      'Quais referencias confiaveis voce usaria para validar esse tema?',
    ],
  },
  {
    id: 'analogias',
    title: 'Analogias',
    prompts: [
      'Liste areas da vivencia do expert que podem servir de base para analogias sobre {tema}.',
      'Quais esportes, hobbies, atividades, jogos ou relacoes ajudam a explicar {tema} de forma simples?',
      'Como transformar {tema} em uma analogia memoravel para o avatar?',
    ],
  },
];

const REQUIRED_QUESTION_SECTION_IDS = ['contexto', 'beneficios', 'como-fazer'] as const;

const QUESTION_SECTION_VISUAL_STYLES: Record<
  string,
  {
    containerClassName: string;
    titleClassName: string;
    activeButtonClassName: string;
    inactiveButtonClassName: string;
    activeBadgeClassName: string;
  }
> = {
  contexto: {
    containerClassName: 'border-cyan-200 bg-gradient-to-br from-cyan-50 to-white',
    titleClassName: 'text-cyan-700',
    activeButtonClassName: 'border-cyan-300 bg-cyan-100 text-cyan-900 shadow-[0_8px_16px_rgba(6,182,212,0.12)]',
    inactiveButtonClassName: 'border-transparent bg-white text-slate-700 hover:border-cyan-200 hover:bg-cyan-50',
    activeBadgeClassName: 'bg-cyan-200 text-cyan-800',
  },
  beneficios: {
    containerClassName: 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-white',
    titleClassName: 'text-emerald-700',
    activeButtonClassName: 'border-emerald-300 bg-emerald-100 text-emerald-900 shadow-[0_8px_16px_rgba(16,185,129,0.12)]',
    inactiveButtonClassName: 'border-transparent bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50',
    activeBadgeClassName: 'bg-emerald-200 text-emerald-800',
  },
  'como-fazer': {
    containerClassName: 'border-indigo-200 bg-gradient-to-br from-indigo-50 to-white',
    titleClassName: 'text-indigo-700',
    activeButtonClassName: 'border-indigo-300 bg-indigo-100 text-indigo-900 shadow-[0_8px_16px_rgba(99,102,241,0.12)]',
    inactiveButtonClassName: 'border-transparent bg-white text-slate-700 hover:border-indigo-200 hover:bg-indigo-50',
    activeBadgeClassName: 'bg-indigo-200 text-indigo-800',
  },
  'estudos-de-caso': {
    containerClassName: 'border-amber-200 bg-gradient-to-br from-amber-50 to-white',
    titleClassName: 'text-amber-700',
    activeButtonClassName: 'border-amber-300 bg-amber-100 text-amber-900 shadow-[0_8px_16px_rgba(245,158,11,0.12)]',
    inactiveButtonClassName: 'border-transparent bg-white text-slate-700 hover:border-amber-200 hover:bg-amber-50',
    activeBadgeClassName: 'bg-amber-200 text-amber-800',
  },
  historias: {
    containerClassName: 'border-rose-200 bg-gradient-to-br from-rose-50 to-white',
    titleClassName: 'text-rose-700',
    activeButtonClassName: 'border-rose-300 bg-rose-100 text-rose-900 shadow-[0_8px_16px_rgba(244,63,94,0.12)]',
    inactiveButtonClassName: 'border-transparent bg-white text-slate-700 hover:border-rose-200 hover:bg-rose-50',
    activeBadgeClassName: 'bg-rose-200 text-rose-800',
  },
  estudos: {
    containerClassName: 'border-violet-200 bg-gradient-to-br from-violet-50 to-white',
    titleClassName: 'text-violet-700',
    activeButtonClassName: 'border-violet-300 bg-violet-100 text-violet-900 shadow-[0_8px_16px_rgba(139,92,246,0.12)]',
    inactiveButtonClassName: 'border-transparent bg-white text-slate-700 hover:border-violet-200 hover:bg-violet-50',
    activeBadgeClassName: 'bg-violet-200 text-violet-800',
  },
  analogias: {
    containerClassName: 'border-orange-200 bg-gradient-to-br from-orange-50 to-white',
    titleClassName: 'text-orange-700',
    activeButtonClassName: 'border-orange-300 bg-orange-100 text-orange-900 shadow-[0_8px_16px_rgba(249,115,22,0.12)]',
    inactiveButtonClassName: 'border-transparent bg-white text-slate-700 hover:border-orange-200 hover:bg-orange-50',
    activeBadgeClassName: 'bg-orange-200 text-orange-800',
  },
};

const QUESTION_SECTION_DEFAULT_STYLE = {
  containerClassName: 'border-slate-100 bg-slate-50/60',
  titleClassName: 'text-slate-500',
  activeButtonClassName: 'border-slate-300 bg-slate-100 text-slate-900 shadow-[0_8px_16px_rgba(15,23,42,0.08)]',
  inactiveButtonClassName: 'border-transparent bg-white text-slate-700 hover:border-slate-200 hover:bg-slate-50',
  activeBadgeClassName: 'bg-slate-200 text-slate-700',
};

const ROOT_SCRIPT_DURATION_OPTIONS = [30, 45, 60];

const ROOT_SCRIPT_SCRUMBAN_COLUMNS: Array<{
  key: RootScriptVersionStatus;
  label: string;
  className: string;
}> = [
  { key: 'idea', label: 'Ideia / Rascunho', className: 'border-slate-200 bg-slate-50/70' },
  { key: 'review', label: 'Em revisao', className: 'border-amber-200 bg-amber-50/70' },
  { key: 'approved', label: 'Aprovado', className: 'border-emerald-200 bg-emerald-50/70' },
  { key: 'published', label: 'Publicado', className: 'border-sky-200 bg-sky-50/70' },
];

const ROOT_SCRIPT_STATUS_LABELS: Record<RootScriptVersionStatus, string> = {
  idea: 'Ideia / Rascunho',
  review: 'Em revisao',
  approved: 'Aprovado',
  published: 'Publicado',
};

const normalizeThemeLine = (line: string) =>
  line
    .replace(/^#{1,6}\s*/, '')
    .replace(/^\s*(?:[-*+]|(?:\d+|[a-zA-Z])[.)])\s+/, '')
    .replace(/^>\s*/, '')
    .replace(/\*\*/g, '')
    .replace(/`/g, '')
    .trim();

const extractThemeLines = (value: string) => {
  const normalizedValue = value.replace(/\r\n/g, '\n').trim();
  if (!normalizedValue) {
    return [];
  }

  const normalizedItems = normalizedValue
    .split('\n')
    .map(normalizeThemeLine)
    .filter(Boolean);

  return Array.from(new Set(normalizedItems));
};

const buildAvatarThemeItems = (data?: LaunchData | null): AvatarThemeItem[] => {
  if (!data) {
    return [];
  }

  let order = 0;

  return AVATAR_THEME_FIELDS.flatMap(field => {
    const lines = extractThemeLines(data[field.key] ?? '');

    return lines.map((line, index) => {
      order += 1;
      return {
        id: `${field.key}-${index}-${line.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        title: line,
        sourceKey: field.key,
        sourceLabel: field.label,
        sourceAngle: field.angle,
        rawValue: data[field.key] ?? '',
        order,
      };
    });
  });
};

const applyThemeToPrompt = (template: string, theme: string) => template.replace(/\{tema\}/g, theme);

const THEME_VISUAL_STYLES: Record<AvatarThemeField, ThemeVisualStyle> = {
  avatarPains: {
    cardClassName: 'border-rose-200 bg-gradient-to-br from-rose-50 to-white',
    badgeClassName: 'border-rose-200 bg-white text-rose-500',
    titleClassName: 'text-rose-700',
    angleClassName: 'text-rose-500/80',
    activeButtonClassName: 'border-rose-300 bg-rose-100 shadow-[0_10px_20px_rgba(244,63,94,0.12)]',
    inactiveButtonClassName: 'border-transparent bg-white hover:border-rose-200 hover:bg-rose-50/60',
    statusActiveClassName: 'bg-rose-200 text-rose-800',
  },
  avatarDesires: {
    cardClassName: 'border-amber-200 bg-gradient-to-br from-amber-50 to-white',
    badgeClassName: 'border-amber-200 bg-white text-amber-600',
    titleClassName: 'text-amber-700',
    angleClassName: 'text-amber-600/80',
    activeButtonClassName: 'border-amber-300 bg-amber-100 shadow-[0_10px_20px_rgba(245,158,11,0.12)]',
    inactiveButtonClassName: 'border-transparent bg-white hover:border-amber-200 hover:bg-amber-50/60',
    statusActiveClassName: 'bg-amber-200 text-amber-800',
  },
  avatarObjections: {
    cardClassName: 'border-violet-200 bg-gradient-to-br from-violet-50 to-white',
    badgeClassName: 'border-violet-200 bg-white text-violet-500',
    titleClassName: 'text-violet-700',
    angleClassName: 'text-violet-500/80',
    activeButtonClassName: 'border-violet-300 bg-violet-100 shadow-[0_10px_20px_rgba(139,92,246,0.12)]',
    inactiveButtonClassName: 'border-transparent bg-white hover:border-violet-200 hover:bg-violet-50/60',
    statusActiveClassName: 'bg-violet-200 text-violet-800',
  },
  avatarRomaMyth: {
    cardClassName: 'border-fuchsia-200 bg-gradient-to-br from-fuchsia-50 to-white',
    badgeClassName: 'border-fuchsia-200 bg-white text-fuchsia-500',
    titleClassName: 'text-fuchsia-700',
    angleClassName: 'text-fuchsia-500/80',
    activeButtonClassName: 'border-fuchsia-300 bg-fuchsia-100 shadow-[0_10px_20px_rgba(217,70,239,0.12)]',
    inactiveButtonClassName: 'border-transparent bg-white hover:border-fuchsia-200 hover:bg-fuchsia-50/60',
    statusActiveClassName: 'bg-fuchsia-200 text-fuchsia-800',
  },
  avatarFear: {
    cardClassName: 'border-orange-200 bg-gradient-to-br from-orange-50 to-white',
    badgeClassName: 'border-orange-200 bg-white text-orange-500',
    titleClassName: 'text-orange-700',
    angleClassName: 'text-orange-500/80',
    activeButtonClassName: 'border-orange-300 bg-orange-100 shadow-[0_10px_20px_rgba(249,115,22,0.12)]',
    inactiveButtonClassName: 'border-transparent bg-white hover:border-orange-200 hover:bg-orange-50/60',
    statusActiveClassName: 'bg-orange-200 text-orange-800',
  },
  avatarLimitingBeliefs: {
    cardClassName: 'border-red-200 bg-gradient-to-br from-red-50 to-white',
    badgeClassName: 'border-red-200 bg-white text-red-500',
    titleClassName: 'text-red-700',
    angleClassName: 'text-red-500/80',
    activeButtonClassName: 'border-red-300 bg-red-100 shadow-[0_10px_20px_rgba(239,68,68,0.12)]',
    inactiveButtonClassName: 'border-transparent bg-white hover:border-red-200 hover:bg-red-50/60',
    statusActiveClassName: 'bg-red-200 text-red-800',
  },
  avatarQuote: {
    cardClassName: 'border-cyan-200 bg-gradient-to-br from-cyan-50 to-white',
    badgeClassName: 'border-cyan-200 bg-white text-cyan-600',
    titleClassName: 'text-cyan-700',
    angleClassName: 'text-cyan-600/80',
    activeButtonClassName: 'border-cyan-300 bg-cyan-100 shadow-[0_10px_20px_rgba(6,182,212,0.12)]',
    inactiveButtonClassName: 'border-transparent bg-white hover:border-cyan-200 hover:bg-cyan-50/60',
    statusActiveClassName: 'bg-cyan-200 text-cyan-800',
  },
  avatarOpportunitiesShortcuts: {
    cardClassName: 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-white',
    badgeClassName: 'border-emerald-200 bg-white text-emerald-600',
    titleClassName: 'text-emerald-700',
    angleClassName: 'text-emerald-600/80',
    activeButtonClassName: 'border-emerald-300 bg-emerald-100 shadow-[0_10px_20px_rgba(16,185,129,0.12)]',
    inactiveButtonClassName: 'border-transparent bg-white hover:border-emerald-200 hover:bg-emerald-50/60',
    statusActiveClassName: 'bg-emerald-200 text-emerald-800',
  },
  avatarResearchABC: {
    cardClassName: 'border-sky-200 bg-gradient-to-br from-sky-50 to-white',
    badgeClassName: 'border-sky-200 bg-white text-sky-600',
    titleClassName: 'text-sky-700',
    angleClassName: 'text-sky-600/80',
    activeButtonClassName: 'border-sky-300 bg-sky-100 shadow-[0_10px_20px_rgba(14,165,233,0.12)]',
    inactiveButtonClassName: 'border-transparent bg-white hover:border-sky-200 hover:bg-sky-50/60',
    statusActiveClassName: 'bg-sky-200 text-sky-800',
  },
};

const createDefaultPlan = (launchType: LaunchType): LaunchPlan => {
  const basePlan = getBasePlan(launchType);
  return {
    avatarHistory: basePlan.avatarHistory,
    socialMediaStrategy: basePlan.socialMediaStrategy,
    launchModelExplanation: basePlan.launchModelExplanation,
    snaStrategy: basePlan.snaStrategy,
    insiderDeliverablesMap: basePlan.insiderDeliverablesMap,
    structure: basePlan.structure.map(phase => ({
    ...phase,
    tasks: (phase.tasks ?? []).map(task => ({
      ...task,
      proofs: [...(task.proofs ?? [])],
    })),
    })),
  };
};

const getPhaseConfig = (launchType: LaunchType) =>
  launchType === 'seed'
    ? {
        offsets: SEED_PHASE_OFFSETS,
        labels: SEED_PHASE_MENU_LABELS,
        order: SEED_TIMELINE_PHASE_ORDER,
      }
    : {
        offsets: CLASSIC_PHASE_OFFSETS,
        labels: CLASSIC_PHASE_MENU_LABELS,
        order: CLASSIC_TIMELINE_PHASE_ORDER,
      };

export default function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [plan, setPlan] = useState<LaunchPlan>(() => createDefaultPlan(INITIAL_BRIEFING.launchType ?? 'classic'));
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
  const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(null);
  const [selectedThemeIds, setSelectedThemeIds] = useState<string[]>([]);
  const [selectedEditorialLineIds, setSelectedEditorialLineIds] = useState<string[]>([]);
  const [selectedQuestionPrompts, setSelectedQuestionPrompts] = useState<ThemeQuestionSelectionMap>({});
  const [activeThemeWorkspace, setActiveThemeWorkspace] = useState<'column-1' | 'column-2' | 'column-3' | 'column-4'>('column-1');
  const [activeThemeCategory, setActiveThemeCategory] = useState<'all' | AvatarThemeField>('all');
  const [rootScriptDurationMinutes, setRootScriptDurationMinutes] = useState<number>(DEFAULT_SCRIPT_DURATION_MINUTES);
  const [rootScriptDraft, setRootScriptDraft] = useState('');
  const [rootScriptApproved, setRootScriptApproved] = useState(false);
  const [rootScriptVersions, setRootScriptVersions] = useState<RootScriptVersion[]>([]);
  const [currentRootScriptVersionId, setCurrentRootScriptVersionId] = useState<string | null>(null);
  const [isEditingRootScript, setIsEditingRootScript] = useState(false);
  const [isSavingRootScript, setIsSavingRootScript] = useState(false);
  const [rootHeadlines, setRootHeadlines] = useState<string[]>([]);
  const [rootHeadlinesFeedback, setRootHeadlinesFeedback] = useState<string | null>(null);
  const [audienceDays, setAudienceDays] = useState<AudienceDay[]>(DEFAULT_AUDIENCE_DAYS);
  const [isGeneratingRootHeadlines, setIsGeneratingRootHeadlines] = useState(false);
  const [isGeneratingRootScript, setIsGeneratingRootScript] = useState(false);
  const [isSpeakingRootScript, setIsSpeakingRootScript] = useState(false);
  const [scriptDurationMinutes, setScriptDurationMinutes] = useState<number>(DEFAULT_SCRIPT_DURATION_MINUTES);
  const [savingPhaseId, setSavingPhaseId] = useState<string | null>(null);
  const [speakingPhaseId, setSpeakingPhaseId] = useState<string | null>(null);
  const [generatingTaskKey, setGeneratingTaskKey] = useState<string | null>(null);
  const [savingTaskKey, setSavingTaskKey] = useState<string | null>(null);
  const [uploadingTaskKey, setUploadingTaskKey] = useState<string | null>(null);
  const briefingPanelRef = useRef<HTMLDivElement | null>(null);
  const rootScriptWorkspaceRef = useRef<HTMLDivElement | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportPreview, setExportPreview] = useState('');
  const [isRootScriptPdfModalOpen, setIsRootScriptPdfModalOpen] = useState(false);
  const [rootScriptPdfUrl, setRootScriptPdfUrl] = useState<string | null>(null);
  const guidanceRef = useRef<GuidanceMap>(guidance);

  useEffect(() => {
    guidanceRef.current = guidance;
  }, [guidance]);

  useEffect(() => {
    const stored = loadLaunchDataFromStorage();
    const storedGuidance = loadGuidanceFromStorage();
    if (stored) {
      setFormDefaults(stored);
      setAvatarStoryDraft(stored.avatarStory || '');
      setLaunchData(stored);
    }
    if (storedGuidance) {
      setGuidance(prev => ensureGuidanceKeys(storedGuidance, getAllGuidanceKeys()));
    }
  }, []);

  const replacePhaseInStructure = (
    structure: LaunchPhase[],
    phaseId: string,
    patch: Partial<LaunchPhase>
  ): LaunchPhase[] => structure.map(phase => (phase.id === phaseId ? { ...phase, ...patch } : phase));

  const getTaskActionKey = (phaseId: string, taskId: string, action: string) =>
    `${phaseId}:${taskId}:${action}`;

  const replaceTaskInStructure = (
    structure: LaunchPhase[],
    phaseId: string,
    taskId: string,
    patch: Partial<PhaseTask>
  ): LaunchPhase[] =>
    structure.map(phase => {
      if (phase.id !== phaseId) return phase;
      return {
        ...phase,
        tasks: (phase.tasks ?? []).map(task => (task.id === taskId ? { ...task, ...patch } : task)),
      };
    });

  const withTimeout = async <T,>(promise: Promise<T>, ms = QUICK_SAVE_TIMEOUT_MS): Promise<T> => {
    return await new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('timeout')), ms);
      promise
        .then(value => {
          clearTimeout(timer);
          resolve(value);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  };

  const sanitizeProofForStorage = (proof: TaskProof): TaskProof => ({
    id: proof.id,
    name: proof.name,
    url: proof.url,
    path: proof.path,
    ...(proof.uploadedAt ? { uploadedAt: proof.uploadedAt } : {}),
  });

  const sanitizeTaskForStorage = (task: PhaseTask): PhaseTask => ({
  id: task.id,
  title: task.title,
  details: task.details,
  ...(typeof task.dueOffsetDays === 'number' ? { dueOffsetDays: task.dueOffsetDays } : {}),
  ...(task.knowledgeBase ? { knowledgeBase: normalizeMarkdownStructure(task.knowledgeBase) } : {}),
  ...(task.contentMode ? { contentMode: task.contentMode } : {}),
  ...(task.contentDraft ? { contentDraft: task.contentDraft } : {}),
    ...(task.contentSavedAt ? { contentSavedAt: task.contentSavedAt } : {}),
    ...(typeof task.proofRequired === 'boolean' ? { proofRequired: task.proofRequired } : {}),
    ...(task.proofs?.length ? { proofs: task.proofs.map(sanitizeProofForStorage) } : { proofs: [] }),
    done: task.done,
    ...(task.doneAt ? { doneAt: task.doneAt } : {}),
  });

  const normalizeTaskMarkdownInStructure = (structure: LaunchPhase[]): LaunchPhase[] =>
    structure.map(phase => ({
      ...phase,
      tasks: (phase.tasks ?? []).map(task => ({
        ...task,
        ...(task.knowledgeBase ? { knowledgeBase: normalizeMarkdownStructure(task.knowledgeBase) } : {}),
      })),
    }));

  const serializePhaseContent = (structure: LaunchPhase[]): PhaseContentMap =>
    structure.reduce<PhaseContentMap>((acc, phase) => {
      if (phase.liveScript || phase.tasks?.length || typeof phase.offsetDays === 'number') {
        acc[phase.id] = {
          updatedAt: phase.liveScriptUpdatedAt ?? new Date().toISOString(),
          ...(phase.liveScript ? { liveScript: phase.liveScript } : {}),
          ...(typeof phase.liveScriptDurationMinutes === 'number'
            ? { durationMinutes: phase.liveScriptDurationMinutes }
            : {}),
          ...(typeof phase.offsetDays === 'number' ? { offsetDays: phase.offsetDays } : {}),
          tasks: (phase.tasks ?? []).map(sanitizeTaskForStorage),
        };
      }
      return acc;
    }, {});
  const mergePhaseContent = (structure: LaunchPhase[], phaseContent?: PhaseContentMap): LaunchPhase[] =>
    structure.map(phase => {
      const stored = phaseContent?.[phase.id];
      if (!stored) {
        return phase;
      }
      return {
        ...phase,
        offsetDays: typeof stored.offsetDays === 'number' ? stored.offsetDays : phase.offsetDays,
        liveScript: stored.liveScript ?? phase.liveScript,
        liveScriptUpdatedAt: stored.updatedAt ?? phase.liveScriptUpdatedAt,
        liveScriptDurationMinutes: stored.durationMinutes ?? phase.liveScriptDurationMinutes,
        tasks: stored.tasks && stored.tasks.length > 0 ? stored.tasks : phase.tasks,
      };
    });
  const applyStoredPhaseContent = useCallback((phaseContent?: PhaseContentMap) => {
    if (!phaseContent) {
      return;
    }

    setPlan(prevPlan => ({
      ...prevPlan,
      structure: mergePhaseContent(prevPlan.structure, phaseContent),
    }));
  }, [setPlan]);
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

  const handleScriptDurationSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextValue = Number(event.target.value);
    if (Number.isNaN(nextValue)) {
      return;
    }
    setScriptDurationMinutes(nextValue);
  };

  const handlePhaseOffsetChange = (phaseId: string, rawOffset: string) => {
    const parsedOffset = Number(rawOffset);
    const nextOffset = Number.isNaN(parsedOffset) ? undefined : parsedOffset;

    setPlan(prev => ({
      ...prev,
      structure: replacePhaseInStructure(prev.structure, phaseId, { offsetDays: nextOffset }),
    }));
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
      const liveScript = await generatePhaseDetails(
        launchData,
        phaseDefinition,
        customGuidance ?? guidance[guidanceKeyForPhase(phaseId)],
        scriptDurationMinutes
      );

      let nextStructure: LaunchPhase[] = [];
      setPlan(prev => {
        nextStructure = replacePhaseInStructure(prev.structure, phaseId, {
          liveScript,
          liveScriptUpdatedAt: new Date().toISOString(),
          liveScriptDurationMinutes: scriptDurationMinutes,
          isGenerating: false,
        });
        return { ...prev, structure: nextStructure };
      });
      await persistPhaseContent(nextStructure);
    } catch (err) {
      console.error(err);
      setError('Erro ao gerar detalhes da fase. Tente novamente.');
      updatePhaseStructure(phaseId, { isGenerating: false });
      throw err;
    }
  };

  const currentLaunchType = useMemo(
    () => launchData?.launchType ?? formDefaults?.launchType ?? INITIAL_BRIEFING.launchType ?? 'classic',
    [launchData?.launchType, formDefaults?.launchType]
  );
  const phaseConfig = useMemo(() => getPhaseConfig(currentLaunchType), [currentLaunchType]);
  const displayStructure = useMemo(() => {
    if (currentLaunchType !== 'seed') {
      return plan.structure;
    }
    return plan.structure.filter(phase => !phase.id.startsWith('CPL'));
  }, [currentLaunchType, plan.structure]);

  const phaseDates = useMemo(() => {
    const base = launchData?.launchDate ? new Date(`${launchData.launchDate}T00:00:00`) : null;
    const isValidBase = base && !Number.isNaN(base.getTime());

    const formatOffsetLabel = (offset: number) => {
      if (!offset) return 'D0';
      return offset > 0 ? `D+${offset}` : `D${offset}`;
    };

    return Object.fromEntries(
      Object.entries(phaseConfig.offsets).map(([phaseId, offset]) => {
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
  }, [launchData?.launchDate, phaseConfig.offsets]);

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

  const buildExportPreview = useCallback(() => {
    const lines: string[] = [];
    const data = launchData;
    const launchType = data?.launchType ?? currentLaunchType;
    const launchTypeLabel = getLaunchTypeLabel(launchType);

    const formatDate = (value?: string | null) => {
      if (!value) {
        return '';
      }
      const parsed = new Date(`${value}T00:00:00`);
      if (Number.isNaN(parsed.getTime())) {
        return value;
      }
      return parsed.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    };

    lines.push(`LANÇAMENTO ${launchTypeLabel.toUpperCase()} · VISÃO COMPLETA`);
    lines.push(`Atualizado em: ${new Date().toLocaleString('pt-BR')}`);
    lines.push('');
    lines.push('=== DIAGNÓSTICO ===');

    if (data) {
      const sections: Array<{ title: string; fields: Array<{ label: string; value: string }> }> = [
        {
          title: 'Produto',
          fields: [
            { label: 'Nome do Produto', value: data.productName },
            { label: 'Nicho', value: data.niche },
            { label: 'Público-Alvo', value: data.targetAudience },
            { label: 'Problema Principal', value: data.mainProblem },
            { label: 'Promessa Principal (ROMA)', value: data.mainBenefit },
            { label: 'Tipo de Lançamento', value: launchTypeLabel },
            { label: 'Modelo do CPL 1', value: data.launchModel === 'right_wrong' ? 'Jeito Errado vs Jeito Certo' : 'Oportunidade / Oportunidade Amplificada' },
            { label: 'Data do Lançamento', value: formatDate(data.launchDate) },
          ],
        },
        {
          title: 'Gatilhos gerais',
          fields: [{ label: 'Gatilhos e explicacoes', value: data.generalTriggers }],
        },
        {
          title: 'Expert e Avatar',
          fields: [
            { label: 'Nome da Expert', value: data.avatarName },
            { label: 'História da Expert', value: data.avatarStory },
            { label: 'Idade', value: data.avatarAge },
            { label: 'Sexo', value: data.avatarGender },
            { label: 'Salário', value: data.avatarSalary },
            { label: 'Profissão', value: data.avatarProfession },
            { label: 'Religião', value: data.avatarReligion },
            { label: 'Orientação Política', value: data.avatarPoliticalOrientation },
            { label: 'Outras', value: data.avatarOtherDetails },
            { label: 'Resumo do Avatar', value: data.avatarSummary },
            { label: 'Dores', value: data.avatarPains },
            { label: 'Desejos', value: data.avatarDesires },
            { label: 'Objeções', value: data.avatarObjections },
            { label: 'Mito Sobre ROMA', value: data.avatarRomaMyth },
            { label: 'Medo', value: data.avatarFear },
            { label: 'CrenÃ§as limitantes', value: data.avatarLimitingBeliefs },
            { label: '"Abre Aspas"', value: data.avatarQuote },
            { label: 'Oportunidades e Atalhos', value: data.avatarOpportunitiesShortcuts },
            { label: 'Pesquisa ABC', value: data.avatarResearchABC },
          ],
        },
        {
          title: 'Oferta',
          fields: [
            { label: 'Preço', value: data.price },
            { label: 'Preço de Âncora', value: data.anchorPrice || '—' },
            { label: 'Bônus', value: data.bonuses },
            { label: 'Garantia', value: data.guarantee },
            { label: 'Formas de Pagamento', value: data.paymentMethods },
            { label: 'Escassez', value: data.scarcity },
            { label: 'Detalhes Extras', value: data.offerDetails },
            { label: 'Solução CPL 3', value: data.cplThreeSolution },
          ],
        },
      ];

      sections.forEach(section => {
        lines.push(`-- ${section.title} --`);
        section.fields.forEach(field => {
          if (field.value) {
            lines.push(`${field.label}: ${field.value}`);
          }
        });
        lines.push('');
      });
    } else {
      lines.push('Nenhum diagnóstico preenchido ainda.');
      lines.push('');
    }

    lines.push('=== FASES ===');

    if (!plan.structure.length) {
      lines.push('Nenhuma fase disponível.');
    } else {
      plan.structure.forEach(phase => {
        lines.push(`[${phase.id}] ${phase.name}`);
        if (phaseDates[phase.id]) {
          lines.push(`Janela: ${phaseDates[phase.id]}`);
        }
        lines.push(`Descrição: ${phase.description}`);

        const scriptText = stripHtml(phase.liveScript);
        if (scriptText) {
          lines.push('Roteiro:');
          lines.push(scriptText);
        }

        if (phase.tasks?.length) {
          lines.push('Tarefas:');
          phase.tasks.forEach((task, index) => {
            const status = task.done ? '✔' : '•';
            lines.push(`${index + 1}. [${status}] ${task.title}`);
            if (task.details) {
              lines.push(`   - ${task.details}`);
            }
          });
        }

        lines.push('');
      });
    }

    if (lines.length > 0) {
      lines[0] = 'LANCAMENTOS · VISÃO COMPLETA';
    }

    return lines.join('\n');
  }, [currentLaunchType, launchData, phaseDates, plan.structure]);

  const navItems = useMemo<NavItem[]>(() => {
    const staticItems: NavItem[] = [
      { id: 'section-launch-date', label: 'Data do lançamento' },
      { id: 'section-expert-info', label: 'Informações da Expert · História' },
      { id: 'section-product-info', label: 'Informações de Produto' },
      { id: 'section-roma-info', label: 'Informações de ROMA' },
      { id: 'section-avatar-info', label: 'Informações de Avatar' },
      { id: 'section-offer-info', label: 'Informações de Oferta' },
      { id: 'section-solution-info', label: 'Informações da Solução' },
      { id: 'section-general-triggers', label: 'Gatilhos Mentais' },
      { id: 'section-timeline-overview', label: 'Linha do tempo' },
      { id: 'section-theme-list', label: 'Lista de temas' },
      { id: 'section-audience-creation', label: 'Criação de Audiência' },
    ];

    const phaseItems: NavItem[] = displayStructure.map(phase => ({
      id: `phase-${phase.id.toLowerCase()}`,
      label: phaseConfig.labels[phase.id] ?? phase.name,
      helper: phaseDates[phase.id],
      phaseId: phase.id,
      description: phase.description,
    }));

    return [...staticItems, ...phaseItems];
  }, [displayStructure, phaseConfig.labels, phaseDates, plan.structure]);

  const selectedPhase = useMemo(
    () => displayStructure.find(phase => phase.id === selectedPhaseId) ?? null,
    [displayStructure, selectedPhaseId]
  );
  const avatarThemeItems = useMemo(() => buildAvatarThemeItems(launchData), [launchData]);
  const avatarThemeGroups = useMemo(
    () =>
      AVATAR_THEME_FIELDS.map(field => ({
        ...field,
        items: avatarThemeItems.filter(item => item.sourceKey === field.key),
      })).filter(group => group.items.length > 0),
    [avatarThemeItems]
  );
  const selectedThemes = useMemo(
    () => avatarThemeItems.filter(item => selectedThemeIds.includes(item.id)),
    [avatarThemeItems, selectedThemeIds]
  );
  const selectedEditorialLines = useMemo(
    () => EDITORIAL_LINE_OPTIONS.filter(option => selectedEditorialLineIds.includes(option.id)),
    [selectedEditorialLineIds]
  );
  const selectedThemeQuestionMenu = useMemo(
    () =>
      selectedThemes.map(theme => ({
        theme,
        sections: QUESTION_MENU_SECTIONS.map(section => ({
          ...section,
          prompts: section.prompts.map(prompt => applyThemeToPrompt(prompt, theme.title)),
        })),
      })),
    [selectedThemes]
  );
  const selectedQuestionPromptBlocks = useMemo(
    () =>
      selectedThemeQuestionMenu.map(block => ({
        theme: block.theme,
        sections: block.sections.map(section => ({
          ...section,
          selectedPrompts: selectedQuestionPrompts[block.theme.id]?.[section.id] ?? [],
          isRequired: REQUIRED_QUESTION_SECTION_IDS.includes(section.id as (typeof REQUIRED_QUESTION_SECTION_IDS)[number]),
        })),
      })),
    [selectedQuestionPrompts, selectedThemeQuestionMenu]
  );
  const missingRequiredQuestionSelections = useMemo(
    () =>
      selectedThemes.flatMap(theme =>
        REQUIRED_QUESTION_SECTION_IDS.flatMap(sectionId => {
          const count = selectedQuestionPrompts[theme.id]?.[sectionId]?.length ?? 0;
          if (count > 0) {
            return [];
          }
          const sectionTitle = QUESTION_MENU_SECTIONS.find(section => section.id === sectionId)?.title ?? sectionId;
          return [`${theme.title}: escolha 1 pergunta em ${sectionTitle}`];
        })
      ),
    [selectedQuestionPrompts, selectedThemes]
  );
  const canGenerateRootScript =
    Boolean((launchData?.mainBenefit ?? formDefaults?.mainBenefit ?? '').trim()) &&
    selectedThemes.length > 0 &&
    selectedEditorialLines.length > 0 &&
    missingRequiredQuestionSelections.length === 0;
  const selectedPhaseGuidanceKey = selectedPhase ? guidanceKeyForPhase(selectedPhase.id) : null;
  const selectedPhaseGuidance = selectedPhaseGuidanceKey ? guidance[selectedPhaseGuidanceKey] : undefined;
  const selectedPhaseGuidanceStatus = selectedPhaseGuidanceKey
    ? {
        saving: guidanceSaving[selectedPhaseGuidanceKey] ?? false,
        processing: guidanceProcessing[selectedPhaseGuidanceKey] ?? false,
      }
    : { saving: false, processing: false };

  const loadRootScriptVersions = useCallback(async (targetBriefingId: string) => {
    const versionsSnapshot = await getDocs(
      query(
        collection(db, 'launchBriefings', targetBriefingId, 'rootScripts'),
        orderBy('createdAt', 'desc'),
        limit(80)
      )
    );

    const nextVersions: RootScriptVersion[] = versionsSnapshot.docs.map(versionDoc => {
      const data = versionDoc.data() as Omit<RootScriptVersion, 'id'>;
      return {
        id: versionDoc.id,
        title: data.title || `Roteiro ${versionDoc.id.slice(0, 6)}`,
        content: data.content || '',
        status: data.status || 'review',
        approved: Boolean(data.approved),
        headlines: Array.isArray(data.headlines) ? data.headlines : [],
        durationMinutes: typeof data.durationMinutes === 'number' ? data.durationMinutes : DEFAULT_SCRIPT_DURATION_MINUTES,
        themeTitles: Array.isArray(data.themeTitles) ? data.themeTitles : [],
        editorialLineTitles: Array.isArray(data.editorialLineTitles) ? data.editorialLineTitles : [],
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        createdAtClient: data.createdAtClient,
      };
    });

    setRootScriptVersions(nextVersions);
  }, []);

  useEffect(() => {
    const fetchLatestBriefing = async () => {
      try {
        const storedGuidanceLocal = loadGuidanceFromStorage();
        const snapshot = await getDocs(
          query(collection(db, 'launchBriefings'), orderBy('updatedAt', 'desc'), limit(1))
        );

        if (snapshot.empty) {
          setRootScriptVersions([]);
          setCurrentRootScriptVersionId(null);
          const storedLocal = loadLaunchDataFromStorage();
          if (storedLocal) {
            setFormDefaults(storedLocal);
            setAvatarStoryDraft(storedLocal.avatarStory || '');
            setLaunchData(storedLocal);
            setPlan(createDefaultPlan(storedLocal.launchType ?? 'classic'));
            if (storedGuidanceLocal) {
              setGuidance(prev => ensureGuidanceKeys(storedGuidanceLocal, getAllGuidanceKeys()));
            }
            return;
          }

          const normalized = normalizeLaunchData(IA_FABIANA_BRIEFING);
          setFormDefaults(normalized);
          setAvatarStoryDraft(normalized.avatarStory || '');
          setLaunchData(normalized);
          setPlan(createDefaultPlan(normalized.launchType ?? 'classic'));
          if (storedGuidanceLocal) {
            setGuidance(prev => ensureGuidanceKeys(storedGuidanceLocal, getAllGuidanceKeys()));
          }
          saveLaunchDataToStorage(normalized);
          return;
        }

        const docSnapshot = snapshot.docs[0];
        const data = docSnapshot.data() as StoredBriefing;
        const {
          checklist: storedChecklist,
          guidance: storedGuidance,
          phaseContent: storedPhaseContent,
          rootScriptDraft: storedRootScriptDraft,
          rootScriptApproved: storedRootScriptApproved,
          rootScriptHeadlines: storedRootScriptHeadlines,
          rootScriptDurationMinutes: storedRootScriptDurationMinutes,
          rootScriptActiveVersionId: storedRootScriptActiveVersionId,
          audienceDays: storedAudienceDays,
          createdAt,
          updatedAt,
          ...launchFields
        } = data;

        setBriefingId(docSnapshot.id);
        setChecklist(mergeChecklist(storedChecklist));
        const normalized = normalizeLaunchData(launchFields);
        const basePlan = createDefaultPlan(normalized.launchType ?? 'classic');
        const mergedPlan = {
          ...basePlan,
          structure: mergePhaseContent(basePlan.structure, storedPhaseContent),
        };
        const mergedPhaseIds = mergedPlan.structure.map(phase => phase.id);
        setPlan(mergedPlan);
        setFormDefaults(normalized);
        setAvatarStoryDraft(normalized.avatarStory || '');
        setLaunchData(normalized);
        setRootScriptDraft(storedRootScriptDraft ?? '');
        setRootScriptApproved(Boolean(storedRootScriptApproved));
        setRootHeadlines(Array.isArray(storedRootScriptHeadlines) ? storedRootScriptHeadlines : []);
        setCurrentRootScriptVersionId(storedRootScriptActiveVersionId ?? null);
        if (Array.isArray(storedAudienceDays) && storedAudienceDays.length > 0) {
          setAudienceDays(storedAudienceDays);
        }
        if (typeof storedRootScriptDurationMinutes === 'number' && ROOT_SCRIPT_DURATION_OPTIONS.includes(storedRootScriptDurationMinutes)) {
          setRootScriptDurationMinutes(storedRootScriptDurationMinutes);
        }
        await loadRootScriptVersions(docSnapshot.id);
        saveLaunchDataToStorage(normalized);
        const allKeys = [
          ...collectFieldKeys(),
          ...collectPhaseKeys(mergedPhaseIds),
        ];
        setGuidance(prev => {
          const base = mergeGuidanceSources(storedGuidance ?? prev, storedGuidanceLocal, allKeys);
          let next = ensureGuidanceKeys(base, allKeys);
          next = applyPhaseGuidanceDefaults(next, mergedPhaseIds);
          saveGuidanceToStorage(next);
          return next;
        });
      } catch (fetchError) {
        console.error('Erro ao carregar briefing anterior', fetchError);
        setRootScriptVersions([]);
        setCurrentRootScriptVersionId(null);
        const storedLocal = loadLaunchDataFromStorage();
        const storedGuidanceLocal = loadGuidanceFromStorage();
        if (storedGuidanceLocal) {
          setGuidance(prev => ensureGuidanceKeys(storedGuidanceLocal, getAllGuidanceKeys()));
        }
        if (storedLocal) {
          setFormDefaults(storedLocal);
          setAvatarStoryDraft(storedLocal.avatarStory || '');
          setLaunchData(storedLocal);
          setPlan(createDefaultPlan(storedLocal.launchType ?? 'classic'));
        }
      }
    };

    fetchLatestBriefing();
  }, [loadRootScriptVersions]);

  useEffect(() => {
    setGuidance(prev => {
      let next = ensureGuidanceKeys(prev, getAllGuidanceKeys());
      next = applyPhaseGuidanceDefaults(next, plan.structure.map(phase => phase.id));
      return next;
    });
  }, [getAllGuidanceKeys, plan.structure]);

  useEffect(() => {
    if (!displayStructure.length) {
      return;
    }
    if (!selectedPhaseId || !displayStructure.some(phase => phase.id === selectedPhaseId)) {
      setSelectedPhaseId(displayStructure[0].id);
    }
  }, [displayStructure, selectedPhaseId]);

  useEffect(() => {
    const availableIds = new Set(avatarThemeItems.map(item => item.id));
    setSelectedThemeIds(prev => {
      const next = prev.filter(id => availableIds.has(id));
      return next.length === prev.length ? prev : next;
    });
  }, [avatarThemeItems]);

  useEffect(() => {
    const availableThemeIds = new Set(selectedThemes.map(theme => theme.id));
    setSelectedQuestionPrompts(prev => {
      const nextEntries = Object.entries(prev).filter(([themeId]) => availableThemeIds.has(themeId));
      if (nextEntries.length === Object.keys(prev).length) {
        return prev;
      }
      return Object.fromEntries(nextEntries);
    });
  }, [selectedThemes]);

  const toggleThemeSelection = (themeId: string) => {
    setSelectedThemeIds(prev =>
      prev.includes(themeId) ? prev.filter(id => id !== themeId) : [...prev, themeId]
    );
  };

  const toggleEditorialLineSelection = (lineId: string) => {
    setSelectedEditorialLineIds(prev =>
      prev.includes(lineId) ? prev.filter(id => id !== lineId) : [...prev, lineId]
    );
  };

  const clearThemeSelections = () => {
    setSelectedThemeIds([]);
  };

  const clearEditorialLineSelections = () => {
    setSelectedEditorialLineIds([]);
  };

  const selectAllThemes = () => {
    setSelectedThemeIds(avatarThemeItems.map(item => item.id));
  };

  const selectAllEditorialLines = () => {
    setSelectedEditorialLineIds(EDITORIAL_LINE_OPTIONS.map(option => option.id));
  };

  const handleRootScriptDurationSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextValue = Number(event.target.value);
    if (Number.isFinite(nextValue) && ROOT_SCRIPT_DURATION_OPTIONS.includes(nextValue)) {
      setRootScriptDurationMinutes(nextValue);
    }
  };

  const toggleQuestionPromptSelection = (themeId: string, sectionId: string, prompt: string) => {
    const isRequired = REQUIRED_QUESTION_SECTION_IDS.includes(sectionId as (typeof REQUIRED_QUESTION_SECTION_IDS)[number]);

    setSelectedQuestionPrompts(prev => {
      const themeSelections = prev[themeId] ?? {};
      const currentSectionSelections = themeSelections[sectionId] ?? [];
      let nextSectionSelections: string[];

      if (isRequired) {
        nextSectionSelections = currentSectionSelections.includes(prompt) ? [] : [prompt];
      } else {
        nextSectionSelections = currentSectionSelections.includes(prompt)
          ? currentSectionSelections.filter(item => item !== prompt)
          : [...currentSectionSelections, prompt];
      }

      return {
        ...prev,
        [themeId]: {
          ...themeSelections,
          [sectionId]: nextSectionSelections,
        },
      };
    });
  };

  const extractNarrationText = (rawText: string) =>
    rawText
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/^#{1,6}\s*/gm, '')
      .replace(/^\s*[-*+]\s+/gm, '')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\s+/g, ' ')
      .trim();

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }

      if (rootScriptPdfUrl && typeof window !== 'undefined') {
        window.URL.revokeObjectURL(rootScriptPdfUrl);
      }
    };
  }, [rootScriptPdfUrl]);

  const ensureBriefingDocument = async () => {
    if (briefingId) {
      return briefingId;
    }

    const baseData = normalizeLaunchData(launchData ?? formDefaults ?? INITIAL_BRIEFING);
    const createdId = await persistBriefing(baseData);
    setBriefingId(createdId);
    return createdId;
  };

  const uploadExpertReferenceImage = async (
    file: File,
    referenceType: 'photo-reference' | 'look-reference' | 'environment-reference'
  ): Promise<string> => {
    const maxSizeMb = 12;
    if (file.size > maxSizeMb * 1024 * 1024) {
      throw new Error(`Arquivo muito grande. Envie imagem de até ${maxSizeMb}MB.`);
    }

    const ensuredId = await ensureBriefingDocument();
    const safeName = file.name.replace(/[^\w.\-]/g, '_');
    const storagePath = `launchBriefings/${ensuredId}/expert/${referenceType}/${Date.now()}-${safeName}`;
    const fileRef = ref(storage, storagePath);
    await uploadBytes(fileRef, file);
    return getDownloadURL(fileRef);
  };

  const handleUploadExpertPhoto = async (file: File): Promise<string> =>
    uploadExpertReferenceImage(file, 'photo-reference');

  const handleUploadExpertLookImage = async (file: File): Promise<string> =>
    uploadExpertReferenceImage(file, 'look-reference');

  const handleUploadExpertEnvironmentImage = async (file: File): Promise<string> =>
    uploadExpertReferenceImage(file, 'environment-reference');

  const persistRootScriptVersion = useCallback(
    async (params: {
      draft: string;
      approved: boolean;
      headlines: string[];
      durationMinutes: number;
      title: string;
      themeTitles: string[];
      editorialLineTitles: string[];
      status: RootScriptVersionStatus;
      versionId?: string | null;
    }) => {
      const ensuredId = await ensureBriefingDocument();
      const versionPayload = {
        title: params.title,
        content: params.draft,
        approved: params.approved,
        headlines: params.headlines,
        durationMinutes: params.durationMinutes,
        themeTitles: params.themeTitles,
        editorialLineTitles: params.editorialLineTitles,
        status: params.status,
        createdAtClient: new Date().toISOString(),
        updatedAt: serverTimestamp(),
      };

      if (params.versionId) {
        await updateDoc(doc(db, 'launchBriefings', ensuredId, 'rootScripts', params.versionId), versionPayload);
        await loadRootScriptVersions(ensuredId);
        return params.versionId;
      }

      const createdDoc = await addDoc(collection(db, 'launchBriefings', ensuredId, 'rootScripts'), {
        ...versionPayload,
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, 'launchBriefings', ensuredId), {
        rootScriptActiveVersionId: createdDoc.id,
        updatedAt: serverTimestamp(),
      });

      await loadRootScriptVersions(ensuredId);
      setCurrentRootScriptVersionId(createdDoc.id);
      return createdDoc.id;
    },
    [loadRootScriptVersions]
  );

  const persistPhaseContent = async (structure: LaunchPhase[]) => {
    const ensuredId = await ensureBriefingDocument();
    await updateDoc(doc(db, 'launchBriefings', ensuredId), {
      phaseContent: serializePhaseContent(structure),
      updatedAt: serverTimestamp(),
    });
  };

  const persistRootScriptState = async (
    draft: string,
    approved: boolean,
    headlines: string[],
    activeVersionId?: string | null
  ) => {
    const ensuredId = await ensureBriefingDocument();
    await updateDoc(doc(db, 'launchBriefings', ensuredId), {
      rootScriptDraft: draft,
      rootScriptApproved: approved,
      rootScriptHeadlines: headlines,
      rootScriptDurationMinutes,
      rootScriptActiveVersionId: activeVersionId === undefined ? currentRootScriptVersionId : activeVersionId,
      updatedAt: serverTimestamp(),
    });
  };

  const persistAudienceDays = async (days: AudienceDay[]) => {
    const ensuredId = await ensureBriefingDocument();
    await updateDoc(doc(db, 'launchBriefings', ensuredId), {
      audienceDays: days,
      updatedAt: serverTimestamp(),
    });
  };

  const persistBriefing = async (data: LaunchData, guidanceOverride?: GuidanceMap) => {
    const normalizedData = normalizeAvatarKnowledgeBaseForStorage(data);
    const normalizedChecklist = mergeChecklist(checklist);
    const normalizedGuidance = normalizeGuidanceMapForStorage(guidanceOverride ?? guidanceRef.current);
    setChecklist(normalizedChecklist);

    const payload = {
      ...normalizedData,
      checklist: normalizedChecklist,
      guidance: normalizedGuidance,
      phaseContent: serializePhaseContent(plan.structure),
      rootScriptDraft,
      rootScriptApproved,
      rootScriptHeadlines: rootHeadlines,
      rootScriptDurationMinutes,
      rootScriptActiveVersionId: currentRootScriptVersionId,
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

    const normalized = normalizeAvatarKnowledgeBaseForStorage(normalizeLaunchData(data));
    const previousType = launchData?.launchType ?? formDefaults?.launchType ?? INITIAL_BRIEFING.launchType ?? 'classic';
    if (normalized.launchType !== previousType) {
      setPlan(createDefaultPlan(normalized.launchType));
      setSelectedPhaseId(null);
    }
    setLaunchData(normalized);
    setFormDefaults(normalized);
    setAvatarStoryDraft(normalized.avatarStory || '');
    saveLaunchDataToStorage(normalized);

    try {
      const savedId = await withTimeout(persistBriefing(normalized), BRIEFING_SAVE_TIMEOUT_MS);
      setBriefingId(savedId);
    } catch (err) {
      console.error(err);
      const message = getFirebaseErrorMessage(
        err,
        'Ocorreu um erro ao salvar seu diagnostico. Por favor, tente novamente.'
      );
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateGuidanceValue = (key: string, field: keyof GuidanceEntry, value: string) => {
    setGuidance(prev => {
      const next = {
        ...prev,
        [key]: {
          ...(prev[key] ?? createEmptyGuidanceEntry()),
          [field]: value,
        },
      };
      guidanceRef.current = next;
      saveGuidanceToStorage(next);
      return next;
    });
  };

  const handleSaveGuidanceEntry = async (key: string) => {
    const current = guidanceRef.current[key] ?? createEmptyGuidanceEntry();
    const stamped: GuidanceEntry = normalizeGuidanceEntryForStorage({
      ...current,
      updatedAt: new Date().toISOString(),
    });
    const updatedGuidance = normalizeGuidanceMapForStorage({ ...guidanceRef.current, [key]: stamped });
    setGuidance(updatedGuidance);
    guidanceRef.current = updatedGuidance;
    saveGuidanceToStorage(updatedGuidance);

    setGuidanceSaving(prev => ({ ...prev, [key]: true }));
    const fallbackTimer = setTimeout(() => {
      setGuidanceSaving(prev => ({ ...prev, [key]: false }));
    }, QUICK_SAVE_TIMEOUT_MS + 1000);

    try {
      let ensuredBriefingId = briefingId;

      if (!ensuredBriefingId) {
        const baseData = normalizeLaunchData(launchData ?? formDefaults ?? INITIAL_BRIEFING);
        ensuredBriefingId = await withTimeout(
          persistBriefing(baseData, updatedGuidance),
          QUICK_SAVE_TIMEOUT_MS
        );
        setBriefingId(ensuredBriefingId);
      }

      if (!ensuredBriefingId) {
        throw new Error('Não foi possível criar o briefing para salvar as instruções.');
      }

      await withTimeout(
        updateDoc(doc(db, 'launchBriefings', ensuredBriefingId), {
          guidance: updatedGuidance,
          updatedAt: serverTimestamp(),
        }),
        QUICK_SAVE_TIMEOUT_MS
      );
    } catch (err) {
      console.error('Erro ao salvar instruções personalizadas', err);
      setError(
        getFirebaseErrorMessage(err, 'Não foi possível salvar as instruções agora. Tente novamente.')
      );
    } finally {
      clearTimeout(fallbackTimer);
      setGuidanceSaving(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleProcessGuidanceEntry = async (key: string) => {
    const entry = guidanceRef.current[key] ?? createEmptyGuidanceEntry();

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
        const nextData = { ...baseData, [field]: generated };
        setLaunchData(nextData);
        setFormDefaults(nextData);
        if (field === 'avatarStory') {
          setAvatarStoryDraft(generated);
        }
        saveLaunchDataToStorage(nextData);
        const savedId = await persistBriefing(nextData);
        setBriefingId(savedId);
      } else if (key.startsWith(PHASE_GUIDANCE_PREFIX)) {
        const phaseId = key.replace(PHASE_GUIDANCE_PREFIX, '');
        await generatePhaseWithGuidance(phaseId, entry);
      }
    } catch (err) {
      console.error('Erro ao processar instruções personalizadas', err);
      const message = err instanceof Error && err.message ? err.message : 'Não foi possível processar este bloco. Tente novamente.';
      setError(message);
    } finally {
      setGuidanceProcessing(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleSaveMainBenefit = (mainBenefit: string) => {
    setError(null);

    const baseData = normalizeLaunchData(launchData ?? formDefaults ?? INITIAL_BRIEFING);
    const nextData: LaunchData = { ...baseData, mainBenefit };

    // Update UI immediately and sync remote in background.
    setLaunchData(nextData);
    setFormDefaults(nextData);
    saveLaunchDataToStorage(nextData);

    if (briefingId) {
      withTimeout(
        updateDoc(doc(db, 'launchBriefings', briefingId), {
          mainBenefit,
          updatedAt: serverTimestamp(),
        })
      ).catch(err => {
        console.error(err);
        setError(
          getFirebaseErrorMessage(
            err,
            'ROMA atualizada localmente, mas falhou a sincronização. Tente novamente.'
          )
        );
      });
      return;
    }

    withTimeout(
      addDoc(collection(db, 'launchBriefings'), {
        ...nextData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
      QUICK_SAVE_TIMEOUT_MS
    )
      .then(docRef => setBriefingId(docRef.id))
      .catch(err => {
        console.error(err);
        setError(
          getFirebaseErrorMessage(err, 'ROMA atualizada localmente, mas não foi salva no servidor.')
        );
      });
  };

  const handleToggleTaskDone = async (phaseId: string, taskId: string) => {
    let nextStructure: LaunchPhase[] = [];

    setPlan(prev => {
      nextStructure = prev.structure.map(phase => {
        if (phase.id !== phaseId) {
          return phase;
        }

        const nextTasks = (phase.tasks ?? []).map(task => {
          if (task.id !== taskId) {
            return task;
          }
          const nextDone = !task.done;
          return {
            ...task,
            done: nextDone,
            doneAt: nextDone ? new Date().toISOString() : undefined,
          };
        });

        return { ...phase, tasks: nextTasks };
      });

      return { ...prev, structure: nextStructure };
    });

    try {
      await persistPhaseContent(nextStructure);
    } catch (err) {
      console.error('Erro ao atualizar etapa da fase', err);
      setError('Nao foi possivel salvar o status da etapa. Tente novamente.');
    }
  };

  const handleUpdateTaskFields = (phaseId: string, taskId: string, patch: Partial<PhaseTask>) => {
    setPlan(prev => ({
      ...prev,
      structure: replaceTaskInStructure(prev.structure, phaseId, taskId, patch),
    }));
  };

  const handleTaskDraftChange = (phaseId: string, taskId: string, draft: string) => {
    handleUpdateTaskFields(phaseId, taskId, { contentDraft: draft });
  };

  const handleGenerateTaskDraft = async (phaseId: string, taskId: string) => {
    if (!launchData) {
      setError('Preencha e salve o diagnostico antes de gerar conteudo da etapa.');
      return;
    }

    const phaseDefinition = plan.structure.find(phase => phase.id === phaseId);
    const taskDefinition = phaseDefinition?.tasks?.find(task => task.id === taskId);
    if (!phaseDefinition || !taskDefinition) {
      return;
    }

    if (!taskDefinition.contentMode || taskDefinition.contentMode === 'none') {
      setError('Esta etapa nao exige geracao de texto ou imagem.');
      return;
    }

    const actionKey = getTaskActionKey(phaseId, taskId, 'generate');
    setGeneratingTaskKey(actionKey);
    setError(null);

    try {
      const draft = await generateTaskContentDraft(launchData, phaseDefinition, taskDefinition);
      setPlan(prev => ({
        ...prev,
        structure: replaceTaskInStructure(prev.structure, phaseId, taskId, { contentDraft: draft }),
      }));
    } catch (err) {
      console.error('Erro ao gerar conteudo da etapa', err);
      setError('Nao foi possivel gerar o conteudo da etapa. Tente novamente.');
    } finally {
      setGeneratingTaskKey(current => (current === actionKey ? null : current));
    }
  };

  const handleSaveTaskDraft = async (phaseId: string, taskId: string) => {
    const actionKey = getTaskActionKey(phaseId, taskId, 'save');
    setSavingTaskKey(actionKey);
    setError(null);

    try {
      let nextStructure: LaunchPhase[] = [];
      setPlan(prev => {
        nextStructure = replaceTaskInStructure(prev.structure, phaseId, taskId, {
          contentSavedAt: new Date().toISOString(),
        });
        return { ...prev, structure: nextStructure };
      });
      await persistPhaseContent(nextStructure);
    } catch (err) {
      console.error('Erro ao salvar conteudo da etapa', err);
      setError('Nao foi possivel salvar o conteudo da etapa. Tente novamente.');
    } finally {
      setSavingTaskKey(current => (current === actionKey ? null : current));
    }
  };

  const handleSaveTaskEdits = async (phaseId: string, taskId: string) => {
    const actionKey = getTaskActionKey(phaseId, taskId, 'save-task');
    setSavingTaskKey(actionKey);
    setError(null);

    try {
      const normalizedStructure = normalizeTaskMarkdownInStructure(plan.structure);
      setPlan(prev => ({ ...prev, structure: normalizedStructure }));
      await persistPhaseContent(normalizedStructure);
    } catch (err) {
      console.error('Erro ao salvar etapa', err);
      setError('Nao foi possivel salvar as alteracoes da etapa. Tente novamente.');
    } finally {
      setSavingTaskKey(current => (current === actionKey ? null : current));
    }
  };

  const handleUploadTaskProof = async (phaseId: string, taskId: string, file?: File | null) => {
    if (!file) {
      return;
    }

    const actionKey = getTaskActionKey(phaseId, taskId, 'upload');
    setUploadingTaskKey(actionKey);
    setError(null);

    try {
      const currentBriefingId = await ensureBriefingDocument();
      const safeName = file.name.replace(/[^\w.\-]/g, '_');
      const storagePath = `launchBriefings/${currentBriefingId}/phases/${phaseId}/tasks/${taskId}/${Date.now()}-${safeName}`;
      const fileRef = ref(storage, storagePath);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);

      let nextStructure: LaunchPhase[] = [];
      setPlan(prev => {
        const phase = prev.structure.find(item => item.id === phaseId);
        const task = phase?.tasks?.find(item => item.id === taskId);
        const nextProofs = [
          ...(task?.proofs ?? []),
          {
            id: `${Date.now()}`,
            name: file.name,
            url,
            path: storagePath,
            uploadedAt: new Date().toISOString(),
          },
        ];
        nextStructure = replaceTaskInStructure(prev.structure, phaseId, taskId, { proofs: nextProofs });
        return { ...prev, structure: nextStructure };
      });

      await persistPhaseContent(nextStructure);
    } catch (err) {
      console.error('Erro ao anexar prova da etapa', err);
      setError('Nao foi possivel anexar a prova da etapa. Verifique permissao do Storage.');
    } finally {
      setUploadingTaskKey(current => (current === actionKey ? null : current));
    }
  };

  const handleSavePhaseContent = async (phaseId: string) => {
    try {
      setSavingPhaseId(phaseId);
      setError(null);
      const normalizedStructure = normalizeTaskMarkdownInStructure(plan.structure);
      setPlan(prev => ({ ...prev, structure: normalizedStructure }));
      await persistPhaseContent(normalizedStructure);
    } catch (err) {
      console.error('Erro ao salvar roteiro da fase', err);
      setError('Nao foi possivel salvar o roteiro da fase. Tente novamente.');
    } finally {
      setSavingPhaseId(current => (current === phaseId ? null : current));
    }
  };

  const handleGenerateRootScript = async () => {
    const baseData = launchData ?? formDefaults;
    if (!baseData) {
      setError('Preencha e salve o diagnostico antes de gerar o script do raiz.');
      return;
    }

    if (!baseData.mainBenefit?.trim()) {
      setError('Preencha a ROMA em Informacoes da ROMA antes de gerar o script do raiz.');
      return;
    }

    if (selectedThemes.length === 0) {
      setError('Marque pelo menos um tema na Lista de temas.');
      return;
    }

    if (selectedEditorialLines.length === 0) {
      setError('Marque pelo menos uma linha editorial.');
      return;
    }

    if (missingRequiredQuestionSelections.length > 0) {
      setError(`Complete a caixa de perguntas antes de gerar: ${missingRequiredQuestionSelections.join(' | ')}`);
      return;
    }

    try {
      setIsGeneratingRootScript(true);
      setError(null);
      const hadPreviousDraft = Boolean(rootScriptDraft.trim());
      const selectedThemeTitles = selectedThemes.map(theme => theme.title);
      const selectedEditorialTitles = selectedEditorialLines.map(line => line.title);
      const script = await generateRootScript(baseData, {
        durationMinutes: rootScriptDurationMinutes,
        requestToken: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        regenerationHint: hadPreviousDraft
          ? 'Gerar uma NOVA versao do roteiro do raiz com abordagem diferente da versao anterior, mantendo ROMA e selecoes atuais.'
          : undefined,
        editorialLines: selectedEditorialTitles,
        themes: selectedQuestionPromptBlocks.map(block => ({
          title: block.theme.title,
          sourceLabel: block.theme.sourceLabel,
          sourceAngle: block.theme.sourceAngle,
          questionSections: block.sections
            .filter(section => section.selectedPrompts.length > 0)
            .map(section => ({
              title: section.title,
              prompts: section.selectedPrompts,
            })),
        })),
      });
      setRootScriptDraft(script);
      setRootScriptApproved(false);
      setIsEditingRootScript(true);
      setRootHeadlines([]);
      const versionTitle = selectedThemeTitles.length > 0
        ? `Raiz: ${selectedThemeTitles.slice(0, 2).join(' + ')}`
        : `Raiz ${new Date().toLocaleDateString('pt-BR')}`;
      const nextVersionId = await persistRootScriptVersion({
        draft: script,
        approved: false,
        headlines: [],
        durationMinutes: rootScriptDurationMinutes,
        title: versionTitle,
        themeTitles: selectedThemeTitles,
        editorialLineTitles: selectedEditorialTitles,
        status: 'review',
      });
      setCurrentRootScriptVersionId(nextVersionId);
      setRootHeadlinesFeedback(
        hadPreviousDraft
          ? 'Nova versao do roteiro gerada. Aprove e salve para liberar a geracao de headlines.'
          : 'Roteiro gerado. Aprove e salve para liberar a geracao de headlines.'
      );
      await persistRootScriptState(script, false, [], nextVersionId);
    } catch (err) {
      console.error('Erro ao gerar script do raiz', err);
      setError('Nao foi possivel gerar o script do raiz. Tente novamente.');
    } finally {
      setIsGeneratingRootScript(false);
    }
  };

  const handleRootScriptDraftChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nextValue = event.target.value;
    setRootScriptDraft(nextValue);
    setRootHeadlinesFeedback(null);

    if (rootScriptApproved) {
      setRootScriptApproved(false);
      setRootHeadlines([]);
    }
  };

  const handleApproveRootScript = async () => {
    if (!rootScriptDraft.trim()) {
      setError('Gere ou escreva o script do raiz antes de aprovar.');
      setRootHeadlinesFeedback('Sem roteiro para aprovar. Gere o script antes.');
      return;
    }

    try {
      setIsSavingRootScript(true);
      setError(null);
      const ensuredVersionId = await persistRootScriptVersion({
        versionId: currentRootScriptVersionId,
        draft: rootScriptDraft,
        approved: true,
        headlines: rootHeadlines,
        durationMinutes: rootScriptDurationMinutes,
        title: rootScriptVersions.find(version => version.id === currentRootScriptVersionId)?.title || `Raiz ${new Date().toLocaleDateString('pt-BR')}`,
        themeTitles: rootScriptVersions.find(version => version.id === currentRootScriptVersionId)?.themeTitles || selectedThemes.map(theme => theme.title),
        editorialLineTitles: rootScriptVersions.find(version => version.id === currentRootScriptVersionId)?.editorialLineTitles || selectedEditorialLines.map(line => line.title),
        status: 'approved',
      });
      setCurrentRootScriptVersionId(ensuredVersionId);
      await persistRootScriptState(rootScriptDraft, true, rootHeadlines, ensuredVersionId);
      setRootScriptApproved(true);
      setIsEditingRootScript(false);
      setRootHeadlinesFeedback('Script aprovado e salvo. Agora clique em Gerar 5 headlines.');
    } catch (err) {
      console.error('Erro ao aprovar script do raiz', err);
      setError('Nao foi possivel aprovar e salvar o script do raiz. Tente novamente.');
    } finally {
      setIsSavingRootScript(false);
    }
  };

  const handleGenerateRootHeadlines = async () => {
    const baseData = launchData ?? formDefaults;
    if (!baseData) {
      setError('Preencha e salve o diagnostico antes de gerar headlines.');
      setRootHeadlinesFeedback('Nao foi possivel gerar headlines: diagnostico nao salvo.');
      return;
    }

    if (!rootScriptApproved) {
      setError('Aprove e salve o script do raiz antes de gerar headlines.');
      setRootHeadlinesFeedback('Aprovacao pendente: clique em Aprovar e salvar antes das headlines.');
      return;
    }

    if (!rootScriptDraft.trim()) {
      setError('Nao existe script aprovado para gerar headlines.');
      setRootHeadlinesFeedback('Nenhum roteiro disponivel para gerar headlines.');
      return;
    }

    try {
      setIsGeneratingRootHeadlines(true);
      setError(null);
      setRootHeadlinesFeedback('Gerando 5 headlines...');
      const nextHeadlines = await generateRootHeadlines(baseData, rootScriptDraft);
      setRootHeadlines(nextHeadlines);
      const ensuredVersionId = await persistRootScriptVersion({
        versionId: currentRootScriptVersionId,
        draft: rootScriptDraft,
        approved: true,
        headlines: nextHeadlines,
        durationMinutes: rootScriptDurationMinutes,
        title: rootScriptVersions.find(version => version.id === currentRootScriptVersionId)?.title || `Raiz ${new Date().toLocaleDateString('pt-BR')}`,
        themeTitles: rootScriptVersions.find(version => version.id === currentRootScriptVersionId)?.themeTitles || selectedThemes.map(theme => theme.title),
        editorialLineTitles: rootScriptVersions.find(version => version.id === currentRootScriptVersionId)?.editorialLineTitles || selectedEditorialLines.map(line => line.title),
        status: 'approved',
      });
      setCurrentRootScriptVersionId(ensuredVersionId);
      await persistRootScriptState(rootScriptDraft, true, nextHeadlines, ensuredVersionId);
      if (nextHeadlines.length > 0) {
        setRootHeadlinesFeedback(`${nextHeadlines.length} headlines geradas com sucesso.`);
      } else {
        setRootHeadlinesFeedback('A geracao terminou sem headlines. Tente novamente.');
      }
    } catch (err) {
      console.error('Erro ao gerar headlines do script do raiz', err);
      setError('Nao foi possivel gerar as headlines. Tente novamente.');
      setRootHeadlinesFeedback('Falha ao gerar headlines. Verifique a conexao e tente novamente.');
    } finally {
      setIsGeneratingRootHeadlines(false);
    }
  };

  const handleTogglePhaseAudio = (phase: LaunchPhase) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setError('Seu navegador nao suporta reproducao de audio por voz sintetizada.');
      return;
    }

    const synth = window.speechSynthesis;

    if (speakingPhaseId === phase.id) {
      synth.cancel();
      setSpeakingPhaseId(null);
      return;
    }

    if (!phase.liveScript) {
      setError('Gere o roteiro da fase antes de ouvir o audio.');
      return;
    }

    const spokenText = extractNarrationText(phase.liveScript);

    if (!spokenText) {
      setError('Nao foi possivel extrair texto para audio nesta fase.');
      return;
    }

    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(spokenText);
    utterance.lang = 'pt-BR';
    utterance.rate = 0.98;
    utterance.pitch = 1;

    const voices = synth.getVoices();
    const ptVoice =
      voices.find(voice => voice.lang.toLowerCase().startsWith('pt-br')) ??
      voices.find(voice => voice.lang.toLowerCase().startsWith('pt'));
    if (ptVoice) {
      utterance.voice = ptVoice;
    }

    utterance.onend = () => setSpeakingPhaseId(null);
    utterance.onerror = () => setSpeakingPhaseId(null);

    setError(null);
    setSpeakingPhaseId(phase.id);
    synth.speak(utterance);
  };

  const handleToggleRootScriptAudio = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setError('Seu navegador nao suporta reproducao de audio por voz sintetizada.');
      return;
    }

    const synth = window.speechSynthesis;

    if (isSpeakingRootScript) {
      synth.cancel();
      setIsSpeakingRootScript(false);
      return;
    }

    if (!rootScriptDraft.trim()) {
      setError('Gere o script do raiz antes de ouvir o roteiro.');
      return;
    }

    const spokenText = extractNarrationText(rootScriptDraft);

    if (!spokenText) {
      setError('Nao foi possivel extrair texto para audio no script do raiz.');
      return;
    }

    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(spokenText);
    utterance.lang = 'pt-BR';
    utterance.rate = 0.98;
    utterance.pitch = 1;

    const voices = synth.getVoices();
    const ptVoice =
      voices.find(voice => voice.lang.toLowerCase().startsWith('pt-br')) ??
      voices.find(voice => voice.lang.toLowerCase().startsWith('pt'));
    if (ptVoice) {
      utterance.voice = ptVoice;
    }

    utterance.onend = () => setIsSpeakingRootScript(false);
    utterance.onerror = () => setIsSpeakingRootScript(false);

    setError(null);
    setIsSpeakingRootScript(true);
    synth.speak(utterance);
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
      const phaseId = targetId.replace('phase-', '').toUpperCase();
      setSelectedPhaseId(phaseId);
      setTimeout(() => {
        const workspace = document.getElementById('phase-workspace');
        workspace?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      return;
    }

    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleOpenExportModal = () => {
    const preview = buildExportPreview();
    setExportPreview(preview);
    setIsExportModalOpen(true);
  };

  const normalizeRootScriptForPdf = (rawText: string) =>
    rawText
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/`(.+?)`/g, '$1')
      .replace(/^###\s*/gm, '')
      .replace(/^##\s*/gm, '')
      .replace(/^#\s*/gm, '')
      .replace(/^\s*[-*+]\s+/gm, '- ')
      .trim();

  const buildRootScriptPdfBlob = () => {
    const doc = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 44;
    const lineHeight = 16;
    const maxWidth = pageWidth - margin * 2;
    let cursorY = margin;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text('Script do Raiz', margin, cursorY);
    cursorY += 22;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Duracao selecionada: ${rootScriptDurationMinutes} minutos`, margin, cursorY);
    cursorY += 20;

    doc.setFontSize(11);
    const cleanText = normalizeRootScriptForPdf(rootScriptDraft);
    const lines = doc.splitTextToSize(cleanText, maxWidth);

    lines.forEach((line: string) => {
      if (cursorY > pageHeight - margin) {
        doc.addPage();
        cursorY = margin;
      }
      doc.text(line, margin, cursorY);
      cursorY += lineHeight;
    });

    return doc.output('blob');
  };

  const handleOpenRootScriptPdfPreview = () => {
    if (!rootScriptDraft.trim()) {
      setError('Gere o script do raiz antes de visualizar em PDF.');
      return;
    }

    try {
      const pdfBlob = buildRootScriptPdfBlob();
      if (rootScriptPdfUrl && typeof window !== 'undefined') {
        window.URL.revokeObjectURL(rootScriptPdfUrl);
      }

      const nextUrl = window.URL.createObjectURL(pdfBlob);
      setRootScriptPdfUrl(nextUrl);
      setIsRootScriptPdfModalOpen(true);
    } catch (err) {
      console.error('Erro ao montar visualizacao em PDF', err);
      setError('Nao foi possivel abrir a visualizacao em PDF.');
    }
  };

  const handleDownloadRootScriptPdf = () => {
    if (!rootScriptDraft.trim()) {
      setError('Gere o script do raiz antes de baixar em PDF.');
      return;
    }

    try {
      const pdfBlob = buildRootScriptPdfBlob();
      const fileUrl = window.URL.createObjectURL(pdfBlob);
      const anchor = document.createElement('a');
      anchor.href = fileUrl;
      anchor.download = `script-raiz-${rootScriptDurationMinutes}min.pdf`;
      anchor.click();
      window.URL.revokeObjectURL(fileUrl);
    } catch (err) {
      console.error('Erro ao baixar PDF do script do raiz', err);
      setError('Nao foi possivel baixar o PDF do script do raiz.');
    }
  };

  const handleDownloadRootScriptMarkdown = () => {
    if (!rootScriptDraft.trim()) {
      setError('Gere o script do raiz antes de baixar em Markdown.');
      return;
    }
    const blob = new Blob([rootScriptDraft], { type: 'text/markdown;charset=utf-8' });
    const fileUrl = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = fileUrl;
    anchor.download = `script-raiz-${rootScriptDurationMinutes}min.md`;
    anchor.click();
    window.URL.revokeObjectURL(fileUrl);
  };

  const handleOpenRootScriptVersion = async (version: RootScriptVersion) => {
    if (!version.content?.trim()) {
      setError('Essa versao nao possui conteudo para abrir.');
      return;
    }

    setRootScriptDraft(version.content);
    setRootScriptApproved(version.approved);
    setRootHeadlines(version.headlines);
    setRootScriptDurationMinutes(
      ROOT_SCRIPT_DURATION_OPTIONS.includes(version.durationMinutes)
        ? version.durationMinutes
        : DEFAULT_SCRIPT_DURATION_MINUTES
    );
    setCurrentRootScriptVersionId(version.id);
    setIsEditingRootScript(true);
    setRootHeadlinesFeedback(`Versao carregada: ${version.title}`);

    try {
      await persistRootScriptState(version.content, version.approved, version.headlines, version.id);
    } catch (err) {
      console.error('Erro ao sincronizar versao aberta', err);
    }

    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        rootScriptWorkspaceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
    }
  };

  const handleMoveRootScriptVersionStatus = async (
    version: RootScriptVersion,
    nextStatus: RootScriptVersionStatus
  ) => {
    try {
      const ensuredId = await ensureBriefingDocument();
      await updateDoc(doc(db, 'launchBriefings', ensuredId, 'rootScripts', version.id), {
        status: nextStatus,
        approved: nextStatus === 'approved' || nextStatus === 'published' ? true : version.approved,
        updatedAt: serverTimestamp(),
      });
      await loadRootScriptVersions(ensuredId);
    } catch (err) {
      console.error('Erro ao atualizar status do script', err);
      setError('Nao foi possivel mover o card no board do script do raiz.');
    }
  };

  const handleDeleteRootScriptVersion = async (version: RootScriptVersion) => {
    try {
      const ensuredId = await ensureBriefingDocument();
      await deleteDoc(doc(db, 'launchBriefings', ensuredId, 'rootScripts', version.id));

      const isActiveVersion = currentRootScriptVersionId === version.id;
      if (isActiveVersion) {
        setRootScriptDraft('');
        setRootScriptApproved(false);
        setRootHeadlines([]);
        setIsEditingRootScript(false);
        setCurrentRootScriptVersionId(null);
        setRootHeadlinesFeedback('Card excluido do Scrumban.');
        await persistRootScriptState('', false, [], null);
      }

      await loadRootScriptVersions(ensuredId);
    } catch (err) {
      console.error('Erro ao excluir card do Scrumban', err);
      setError('Nao foi possivel excluir o card do Scrumban.');
    }
  };

  const handleClearRootScript = async () => {
    setRootScriptDraft('');
    setRootScriptApproved(false);
    setRootHeadlines([]);
    setIsEditingRootScript(false);
    setCurrentRootScriptVersionId(null);
    setRootHeadlinesFeedback('Roteiro limpo. Gere uma nova versao quando quiser.');

    try {
      await persistRootScriptState('', false, [], null);
    } catch (err) {
      console.error('Erro ao limpar roteiro do raiz', err);
      setError('Nao foi possivel limpar o roteiro do raiz.');
    }
  };

  const handleSendRootScriptToScrumban = async () => {
    if (!rootScriptDraft.trim()) {
      setError('Gere ou abra um roteiro antes de enviar para o Scrumban.');
      return;
    }

    try {
      const currentVersion = rootScriptVersions.find(version => version.id === currentRootScriptVersionId);
      const ensuredVersionId = await persistRootScriptVersion({
        versionId: currentRootScriptVersionId,
        draft: rootScriptDraft,
        approved: rootScriptApproved,
        headlines: rootHeadlines,
        durationMinutes: rootScriptDurationMinutes,
        title: currentVersion?.title || `Raiz ${new Date().toLocaleDateString('pt-BR')}`,
        themeTitles: currentVersion?.themeTitles || selectedThemes.map(theme => theme.title),
        editorialLineTitles: currentVersion?.editorialLineTitles || selectedEditorialLines.map(line => line.title),
        status: 'review',
      });

      setCurrentRootScriptVersionId(ensuredVersionId);
      await persistRootScriptState(rootScriptDraft, rootScriptApproved, rootHeadlines, ensuredVersionId);
      setRootHeadlinesFeedback('Roteiro enviado para o Scrumban em Em revisao.');
    } catch (err) {
      console.error('Erro ao enviar roteiro para o Scrumban', err);
      setError('Nao foi possivel enviar o roteiro para o Scrumban.');
    }
  };

  const formatRootScriptVersionDate = (version: RootScriptVersion) => {
    if (!version.createdAtClient) {
      return 'Sem data';
    }
    const parsed = new Date(version.createdAtClient);
    if (Number.isNaN(parsed.getTime())) {
      return 'Sem data';
    }
    return parsed.toLocaleString('pt-BR');
  };

  const handleDownloadExport = () => {
    const content = (exportPreview || buildExportPreview()).trim();
    if (!content) {
      return;
    }

    if (typeof window === 'undefined') {
      return;
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    const exportType = currentLaunchType === 'seed' ? 'semente' : 'classico';
    anchor.download = `lancamento-${exportType}-${new Date().toISOString().slice(0, 10)}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const buildCategoryExportContent = useCallback((sectionId: string) => {
    const data = launchData ?? formDefaults ?? INITIAL_BRIEFING;
    const titleMap: Record<string, string> = {
      'section-launch-date': 'Data do lancamento',
      'section-product-info': 'Informacoes de Produto',
      'section-roma-info': 'Informacoes de ROMA',
      'section-general-triggers': 'Gatilhos Mentais',
      'section-expert-info': 'Informacoes da Expert · Historia',
      'section-avatar-info': 'Informacoes do Avatar',
      'section-offer-info': 'Informacoes de Oferta',
      'section-solution-info': 'Informacoes da Solucao',
      'section-timeline-overview': 'Linha do tempo',
      'section-theme-list': 'Lista de temas',
    };

    const lines: string[] = [
      `Categoria: ${titleMap[sectionId] ?? sectionId}`,
      `Exportado em: ${new Date().toLocaleString('pt-BR')}`,
      '',
    ];

    switch (sectionId) {
      case 'section-launch-date':
        lines.push(`Data do lancamento: ${data.launchDate || 'nao informado'}`);
        lines.push(`Tipo de lancamento: ${data.launchType || 'classic'}`);
        lines.push(`Modelo CPL 1: ${data.launchModel || 'opportunity'}`);
        break;
      case 'section-product-info':
        lines.push(`Produto: ${data.productName || 'nao informado'}`);
        lines.push(`Nicho: ${data.niche || 'nao informado'}`);
        lines.push(`Publico-alvo: ${data.targetAudience || 'nao informado'}`);
        lines.push(`Problema principal: ${data.mainProblem || 'nao informado'}`);
        break;
      case 'section-roma-info':
        lines.push(`ROMA: ${data.mainBenefit || 'nao informado'}`);
        break;
      case 'section-general-triggers':
        lines.push(data.generalTriggers || 'nao informado');
        break;
      case 'section-expert-info':
        lines.push(`Nome da expert: ${data.avatarName || 'nao informado'}`);
        lines.push(`Historia: ${data.avatarStory || 'nao informado'}`);
        break;
      case 'section-avatar-info':
        lines.push(`Idade: ${data.avatarAge || 'nao informado'}`);
        lines.push(`Sexo: ${data.avatarGender || 'nao informado'}`);
        lines.push(`Salario: ${data.avatarSalary || 'nao informado'}`);
        lines.push(`Profissao: ${data.avatarProfession || 'nao informado'}`);
        lines.push(`Religiao: ${data.avatarReligion || 'nao informado'}`);
        lines.push(`Orientacao politica: ${data.avatarPoliticalOrientation || 'nao informado'}`);
        lines.push(`Outras: ${data.avatarOtherDetails || 'nao informado'}`);
        lines.push(`Resumo: ${data.avatarSummary || 'nao informado'}`);
        lines.push(`Dores: ${data.avatarPains || 'nao informado'}`);
        lines.push(`Desejos: ${data.avatarDesires || 'nao informado'}`);
        lines.push(`Objecoes: ${data.avatarObjections || 'nao informado'}`);
        lines.push(`Mito ROMA: ${data.avatarRomaMyth || 'nao informado'}`);
        lines.push(`Medo: ${data.avatarFear || 'nao informado'}`);
        lines.push(`Crencas limitantes: ${data.avatarLimitingBeliefs || 'nao informado'}`);
        lines.push(`Abre aspas: ${data.avatarQuote || 'nao informado'}`);
        lines.push(`Oportunidades e atalhos: ${data.avatarOpportunitiesShortcuts || 'nao informado'}`);
        lines.push(`Pesquisa ABC: ${data.avatarResearchABC || 'nao informado'}`);
        break;
      case 'section-offer-info':
        lines.push(`Preco: ${data.price || 'nao informado'}`);
        lines.push(`Preco ancora: ${data.anchorPrice || 'nao informado'}`);
        lines.push(`Bonus: ${data.bonuses || 'nao informado'}`);
        lines.push(`Garantia: ${data.guarantee || 'nao informado'}`);
        lines.push(`Pagamento: ${data.paymentMethods || 'nao informado'}`);
        lines.push(`Escassez: ${data.scarcity || 'nao informado'}`);
        lines.push(`Detalhes da oferta: ${data.offerDetails || 'nao informado'}`);
        lines.push(`Solucao CPL3: ${data.cplThreeSolution || 'nao informado'}`);
        break;
      case 'section-solution-info':
        lines.push(`Titulo: ${publikaSummary.title || 'nao informado'}`);
        lines.push(`Subtitulo: ${publikaSummary.subtitle || 'nao informado'}`);
        lines.push(`Tagline: ${publikaSummary.tagline || 'nao informado'}`);
        lines.push(`Descricao: ${publikaSummary.description || 'nao informado'}`);
        lines.push('Highlights:');
        if (publikaSummary.highlights?.length) {
          publikaSummary.highlights.forEach((item, index) => lines.push(`${index + 1}. ${item}`));
        } else {
          lines.push('nenhum highlight informado');
        }
        break;
      case 'section-timeline-overview':
        phaseConfig.order.forEach(phaseId => {
          lines.push(`${phaseConfig.labels[phaseId] ?? phaseId}: ${phaseDates[phaseId] ?? 'nao informado'}`);
        });
        break;
      case 'section-theme-list':
        lines.push(`Temas selecionados: ${selectedThemes.map(item => item.title).join(' | ') || 'nenhum'}`);
        lines.push(`Linhas editoriais: ${selectedEditorialLines.map(item => item.title).join(' | ') || 'nenhuma'}`);
        lines.push('');
        lines.push('Script do raiz:');
        lines.push(rootScriptDraft || 'nao gerado');
        lines.push('');
        lines.push('Headlines:');
        if (rootHeadlines.length) {
          rootHeadlines.forEach((headline, index) => lines.push(`${index + 1}. ${headline}`));
        } else {
          lines.push('nenhuma headline gerada');
        }
        break;
      default:
        lines.push('Categoria sem dados para exportacao.');
    }

    return lines.join('\n').trim();
  }, [
    formDefaults,
    launchData,
    phaseConfig.labels,
    phaseConfig.order,
    phaseDates,
    publikaSummary,
    rootHeadlines,
    rootScriptDraft,
    selectedEditorialLines,
    selectedThemes,
  ]);

  const handleDownloadCategory = useCallback((sectionId: string) => {
    const content = buildCategoryExportContent(sectionId);
    if (!content) {
      return;
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${sectionId}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [buildCategoryExportContent]);
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
    <div ref={briefingPanelRef} className="rounded-3xl border-2 border-slate-200 bg-white/95 p-6 shadow-[0_14px_40px_rgba(15,23,42,0.08)] space-y-10">
      <div className={`${isSolutionSection ? 'hidden' : 'space-y-8'}`}>
        <LaunchForm
          onSubmit={handleSaveBriefing}
          onDownloadSection={handleDownloadCategory}
          onSaveMainBenefit={handleSaveMainBenefit}
          onUploadExpertPhoto={handleUploadExpertPhoto}
          onUploadExpertLookImage={handleUploadExpertLookImage}
          onUploadExpertEnvironmentImage={handleUploadExpertEnvironmentImage}
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
          <div className="bg-white p-6 rounded-2xl border-2 border-indigo-200 shadow-[0_10px_30px_rgba(99,102,241,0.12)]">
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
        <div className="rounded-3xl border-2 border-teal-200 bg-teal-50/40 p-6 shadow-inner shadow-teal-100">
          <PublikaEditor
            summary={publikaSummary}
            modules={publikaModules}
            onSummaryChange={handlePublikaSummaryChange}
            onCreditPackChange={handlePublikaCreditPackChange}
            onHighlightChange={handlePublikaHighlightChange}
            onModuleChange={handlePublikaModuleChange}
          />
        </div>

        <div className="rounded-3xl border-2 border-emerald-200 bg-emerald-50/30 p-8 shadow-[0_12px_35px_rgba(16,185,129,0.12)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-teal-500/80">Solução proprietária</p>
              <h3 className="text-2xl font-black text-slate-900">Pré-visualização da Publika.AI</h3>
              <p className="text-sm text-slate-500 mt-1">Acompanhe o resultado final enquanto edita os campos acima.</p>
            </div>
            <button
              type="button"
              onClick={() => handleDownloadCategory('section-solution-info')}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-600 hover:border-teal-300 hover:text-teal-700"
            >
              Download categoria
            </button>
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
            LANÇAMENTO <span className="text-indigo-600">{getLaunchTypeLabel(currentLaunchType).toUpperCase()}</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-slate-600 max-w-2xl mx-auto"
          >
            Transforme seu conhecimento em um império digital. Gere toda a estrutura do seu 
            <strong> Lançamento {getLaunchTypeLabel(currentLaunchType)}</strong> em segundos.
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
                    className="flex-shrink-0 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-600"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <section id="section-timeline-overview" className="space-y-6">
              <div className="rounded-3xl border-2 border-indigo-200 bg-gradient-to-br from-white to-indigo-50 p-6 shadow-[0_12px_30px_rgba(79,70,229,0.12)]">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.4em] text-indigo-500/80">Linha do tempo</p>
                    <h3 className="text-3xl font-black text-slate-900 mt-2">
                      {formattedLaunchDate ?? 'Defina a data oficial no formulário'}
                    </h3>
                    <p className="text-sm text-slate-500 mt-2">
                      Todos os marcos abaixo são calculados automaticamente a partir desta data.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDownloadCategory('section-timeline-overview')}
                    className="rounded-full border border-slate-300 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-600 hover:border-indigo-300 hover:text-indigo-700"
                  >
                    Download categoria
                  </button>
                </div>
              </div>

              <div className="rounded-3xl border border-indigo-100 bg-white p-5 shadow-[0_8px_24px_rgba(79,70,229,0.08)]">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500">Como ler esta linha do tempo</p>
                {currentLaunchType === 'seed' ? (
                  <div className="mt-3 space-y-3 text-sm text-slate-600">
                    <p>
                      <span className="font-black text-slate-900">Visao Semente:</span> a estrutura parte da{' '}
                      <span className="font-semibold text-indigo-700">CLI em D-14</span>, passa pelo{' '}
                      <span className="font-semibold text-indigo-700">AL em D-7</span>, chega no{' '}
                      <span className="font-semibold text-indigo-700">Webinario em D0</span>, segue com{' '}
                      <span className="font-semibold text-indigo-700">Carrinho em D0</span>, depois{' '}
                      <span className="font-semibold text-indigo-700">Entrega em D+2</span> e fecha com{' '}
                      <span className="font-semibold text-indigo-700">Debriefing em D+7</span>.
                    </p>
                    <p>
                      Em resumo: primeiro voce constroi a lista, depois aquece os inscritos, faz a aula ao vivo no dia oficial,
                      aproveita a janela imediata de vendas, entrega rapido para gerar resultado e finaliza documentando os aprendizados.
                    </p>
                  </div>
                ) : (
                  <div className="mt-3 space-y-3 text-sm text-slate-600">
                    <p>
                      <span className="font-black text-slate-900">Visao Classico:</span> a estrutura comeca no{' '}
                      <span className="font-semibold text-indigo-700">AL em D-21</span>, avanca para{' '}
                      <span className="font-semibold text-indigo-700">CPL1 em D-14</span>,{' '}
                      <span className="font-semibold text-indigo-700">CPL2 em D-10</span> e{' '}
                      <span className="font-semibold text-indigo-700">CPL3 em D-7</span>, chega na abertura do carrinho com{' '}
                      <span className="font-semibold text-indigo-700">L1 em D0</span>, continua no meio com{' '}
                      <span className="font-semibold text-indigo-700">L2 em D+2</span> e fecha com{' '}
                      <span className="font-semibold text-indigo-700">L3 em D+5</span>.
                    </p>
                    <p>
                      Em resumo: primeiro voce aquece a audiencia, depois conduz os tres CPLs para gerar desejo e convencimento,
                      abre o carrinho no dia oficial e trabalha recuperacao, objecoes e urgencia ate o fechamento final.
                    </p>
                  </div>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {phaseConfig.order.map(phaseId => (
                  <div key={phaseId} className="rounded-2xl border-2 border-slate-200 bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.08)]">
                    <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">{phaseConfig.labels[phaseId] ?? phaseId}</p>
                    <p className="text-base font-semibold text-slate-800 mt-2">{phaseDates[phaseId]}</p>
                  </div>
                ))}
              </div>
            </section>

            <section id="section-theme-list" className="space-y-6">
              <div className="rounded-3xl border-2 border-sky-200 bg-gradient-to-br from-white via-sky-50 to-cyan-50 p-6 shadow-[0_12px_30px_rgba(14,165,233,0.12)]">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.4em] text-sky-500/80">Lista de temas</p>
                    <h3 className="mt-2 text-3xl font-black text-slate-900">Temas e estruturas de texto</h3>
                    <p className="mt-2 max-w-3xl text-sm text-slate-600">
                      A primeira coluna nasce automaticamente dos campos do avatar. Depois voce marca uma ou mais linhas
                      editoriais e usa a estrutura de roteiro para transformar os temas em conteudo.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-sky-100 bg-white/80 px-4 py-3 text-sm text-slate-600">
                    <p className="font-semibold text-slate-900">{avatarThemeItems.length} temas capturados do avatar</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.25em] text-sky-500">Dores, desejos, objecoes, mito, medo, crencas, fala, atalhos e pesquisa</p>
                    <button
                      type="button"
                      onClick={() => handleDownloadCategory('section-theme-list')}
                      className="mt-3 rounded-full border border-slate-300 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-600 hover:border-sky-300 hover:text-sky-700"
                    >
                      Download categoria
                    </button>
                  </div>
                </div>
              </div>

              {!avatarThemeItems.length ? (
                <div className="rounded-3xl border-2 border-dashed border-slate-300 bg-white p-8 text-center shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">Aguardando base do avatar</p>
                  <h4 className="mt-3 text-2xl font-black text-slate-900">Preencha os campos do avatar para montar a lista de temas</h4>
                  <p className="mt-3 text-sm text-slate-500">
                    Use os blocos de dores, desejos, objecoes, mito sobre ROMA, medo, crencas limitantes, abre aspas,
                    oportunidades e atalhos e pesquisa ABC. Cada linha preenchida vira uma opcao marcavel aqui.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white p-3 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                    <div className="flex min-w-max gap-2">
                      {(
                        [
                          {
                            id: 'column-1' as const,
                            label: 'Coluna 1',
                            title: 'Temas',
                            count: `${selectedThemes.length}/${avatarThemeItems.length}`,
                            pills: selectedThemes.map(t => ({ id: t.id, label: t.title })),
                          },
                          {
                            id: 'column-2' as const,
                            label: 'Coluna 2',
                            title: 'Linha editorial',
                            count: `${selectedEditorialLines.length}/${EDITORIAL_LINE_OPTIONS.length}`,
                            pills: selectedEditorialLines.map(l => ({ id: l.id, label: l.title })),
                          },
                          {
                            id: 'column-3' as const,
                            label: 'Coluna 3',
                            title: 'Perguntas',
                            count: `${selectedQuestionPromptBlocks.length} tema(s)`,
                            pills: selectedQuestionPromptBlocks.map(b => ({ id: b.theme.id, label: b.theme.title })),
                          },
                          {
                            id: 'column-4' as const,
                            label: 'Coluna 4',
                            title: 'Estrutura',
                            count: `${selectedQuestionPromptBlocks.length} tema(s)`,
                            pills: selectedQuestionPromptBlocks.map(b => ({ id: b.theme.id, label: b.theme.title })),
                          },
                        ] as const
                      ).map(item => {
                        const isActive = activeThemeWorkspace === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setActiveThemeWorkspace(item.id)}
                            className={`flex min-w-[200px] flex-col rounded-2xl border px-4 py-3 text-left transition ${
                              isActive
                                ? 'border-sky-300 bg-sky-50 shadow-[0_10px_20px_rgba(14,165,233,0.12)]'
                                : 'border-slate-200 bg-slate-50/70 hover:border-slate-300 hover:bg-white'
                            }`}
                          >
                            <span className={`text-[10px] font-black uppercase tracking-[0.25em] ${isActive ? 'text-sky-600' : 'text-slate-400'}`}>{item.label}</span>
                            <span className="mt-2 text-sm font-black text-slate-900">{item.title}</span>
                            <span className="mt-1 text-xs font-semibold text-slate-500">{item.count}</span>
                            <div className="mt-2 flex min-h-[44px] flex-wrap gap-1 overflow-hidden">
                              {item.pills.length === 0 ? (
                                <span className="self-center text-[10px] text-slate-300">Nenhum selecionado</span>
                              ) : (
                                item.pills.slice(0, 8).map(pill => (
                                  <span
                                    key={pill.id}
                                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold leading-tight ${
                                      isActive ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-500'
                                    }`}
                                  >
                                    {pill.label.length > 20 ? pill.label.slice(0, 20) + '…' : pill.label}
                                  </span>
                                ))
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {activeThemeWorkspace === 'column-1' && (
                    <div className="rounded-3xl border-2 border-slate-200 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Coluna 1</p>
                        <h4 className="mt-2 text-xl font-black text-slate-900">Temas vindos do avatar</h4>
                        <p className="mt-2 text-sm text-slate-500">Multipla escolha: marque um ou mais temas.</p>
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={selectAllThemes}
                            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 hover:border-sky-200 hover:text-sky-600"
                          >
                            Marcar todos
                          </button>
                          <button
                            type="button"
                            onClick={clearThemeSelections}
                            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 hover:border-slate-300 hover:text-slate-700"
                          >
                            Limpar
                          </button>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-[0.25em] text-slate-500">
                            {selectedThemes.length}/{avatarThemeItems.length}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 max-w-sm">
                        <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.22em] text-slate-400" htmlFor="theme-category-filter">
                          Filtrar categoria de temas
                        </label>
                        <select
                          id="theme-category-filter"
                          title="Filtrar categoria de temas"
                          value={activeThemeCategory}
                          onChange={event => setActiveThemeCategory(event.target.value as 'all' | AvatarThemeField)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-[0_8px_20px_rgba(15,23,42,0.04)] focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200"
                        >
                          <option value="all">Todos ({avatarThemeItems.length})</option>
                          {AVATAR_THEME_FIELDS.map(field => {
                            const groupCount = avatarThemeGroups.find(g => g.key === field.key)?.items.length ?? 0;
                            const selectedCount = selectedThemes.filter(t => t.sourceKey === field.key).length;
                            if (groupCount === 0) return null;
                            return (
                              <option key={field.key} value={field.key}>
                                {field.label} ({selectedCount}/{groupCount})
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div className="mt-5 space-y-4 max-h-[840px] overflow-y-auto pr-1">
                        {activeThemeCategory === 'all' ? (
                          <div className="space-y-2">
                            {avatarThemeItems.map(item => {
                              const isActive = selectedThemeIds.includes(item.id);
                              const style = THEME_VISUAL_STYLES[item.sourceKey];
                              return (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => toggleThemeSelection(item.id)}
                                  className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                                    isActive
                                      ? style.activeButtonClassName
                                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                                      <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                                        Origem: {item.sourceLabel}
                                      </p>
                                    </div>
                                    <span
                                      className={`mt-0.5 rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${
                                        isActive ? style.statusActiveClassName : 'bg-slate-100 text-slate-400'
                                      }`}
                                    >
                                      {isActive ? 'Marcado' : 'Livre'}
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          avatarThemeGroups.filter(group => group.key === activeThemeCategory).map(group => {
                            const style = THEME_VISUAL_STYLES[group.key];
                            return (
                            <div key={group.key} className={`rounded-2xl border p-4 shadow-[0_8px_24px_rgba(15,23,42,0.05)] ${style.cardClassName}`}>
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <p className={`text-sm font-black uppercase tracking-[0.24em] ${style.titleClassName}`}>{group.label}</p>
                                  <p className={`mt-1 text-xs ${style.angleClassName}`}>{group.angle}</p>
                                </div>
                                <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${style.badgeClassName}`}>
                                  {group.items.length}
                                </span>
                              </div>
                              <div className="mt-3 space-y-2">
                                {group.items.map(item => {
                                  const isActive = selectedThemeIds.includes(item.id);
                                  return (
                                    <button
                                      key={item.id}
                                      type="button"
                                      onClick={() => toggleThemeSelection(item.id)}
                                      className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                                        isActive
                                          ? style.activeButtonClassName
                                          : style.inactiveButtonClassName
                                      }`}
                                    >
                                      <div className="flex items-start justify-between gap-3">
                                        <div>
                                          <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                                          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                                            Origem: {item.sourceLabel}
                                          </p>
                                        </div>
                                        <span
                                          className={`mt-0.5 rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${
                                            isActive ? style.statusActiveClassName : 'bg-slate-100 text-slate-400'
                                          }`}
                                        >
                                          {isActive ? 'Marcado' : 'Livre'}
                                        </span>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        }))}
                      </div>
                    </div>
                  )}

                  {activeThemeWorkspace === 'column-2' && (
                    <div className="rounded-3xl border-2 border-slate-200 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Coluna 2</p>
                        <h4 className="mt-2 text-xl font-black text-slate-900">Escolher linha editorial</h4>
                        <p className="mt-2 text-sm text-slate-500">
                          Multipla escolha: marque os formatos que melhor combinam com os temas e com a fase do lancamento.
                        </p>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={selectAllEditorialLines}
                          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 hover:border-indigo-200 hover:text-indigo-600"
                        >
                          Marcar todas
                        </button>
                        <button
                          type="button"
                          onClick={clearEditorialLineSelections}
                          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 hover:border-slate-300 hover:text-slate-700"
                        >
                          Limpar
                        </button>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-[0.25em] text-slate-500">
                          {selectedEditorialLines.length}/{EDITORIAL_LINE_OPTIONS.length}
                        </span>
                      </div>
                      <div className="mt-5 space-y-3 max-h-[520px] overflow-y-auto pr-1">
                        {EDITORIAL_LINE_OPTIONS.map(option => {
                          const isActive = selectedEditorialLineIds.includes(option.id);
                          return (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => toggleEditorialLineSelection(option.id)}
                              className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                                isActive
                                  ? 'border-indigo-300 bg-indigo-50 shadow-[0_10px_20px_rgba(99,102,241,0.12)]'
                                  : 'border-slate-200 bg-slate-50/60 hover:border-slate-300 hover:bg-white'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-900">{option.title}</p>
                                  <p className="mt-2 text-sm text-slate-600">{option.description}</p>
                                </div>
                                <span
                                  className={`rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${
                                    isActive ? 'bg-indigo-200 text-indigo-800' : 'bg-slate-100 text-slate-400'
                                  }`}
                                >
                                  {isActive ? 'Marcada' : 'Livre'}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {selectedEditorialLines.length > 0 && (
                        <div className="mt-5 space-y-3">
                          {selectedEditorialLines.map(option => (
                            <div key={option.id} className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4">
                              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500">Leitura da linha</p>
                              <h5 className="mt-2 text-lg font-black text-slate-900">{option.title}</h5>
                              <p className="mt-2 text-sm text-slate-600">{option.benefits}</p>
                              <p className="mt-3 text-sm text-slate-600">
                                <span className="font-semibold text-slate-900">Como fazer:</span> {option.howTo}
                              </p>
                              <p className="mt-3 text-sm text-slate-600">
                                <span className="font-semibold text-slate-900">Melhor uso:</span> {option.bestUse}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {activeThemeWorkspace === 'column-3' && (
                    <div className="space-y-5 rounded-3xl border-2 border-slate-200 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Coluna 3</p>
                        <h4 className="mt-2 text-xl font-black text-slate-900">Cardapio de perguntas</h4>
                        <p className="mt-2 text-sm text-slate-500">
                          Monte as perguntas do roteiro para alimentar a estrutura e o script final.
                        </p>
                      </div>

                      {selectedThemes.length > 0 || selectedEditorialLines.length > 0 ? (
                        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600">Selecao ativa</p>
                          <div className="mt-3">
                            <p className="text-sm font-semibold text-slate-900">Temas marcados</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {selectedThemes.length > 0 ? (
                                selectedThemes.map(theme => (
                                  <span
                                    key={theme.id}
                                    className="rounded-full bg-white px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-emerald-700"
                                  >
                                    {theme.title}
                                  </span>
                                ))
                              ) : (
                                <span className="text-sm text-slate-500">Nenhum tema marcado ainda.</span>
                              )}
                            </div>
                          </div>
                          <div className="mt-4">
                            <p className="text-sm font-semibold text-slate-900">Linhas editoriais marcadas</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {selectedEditorialLines.length > 0 ? (
                                selectedEditorialLines.map(line => (
                                  <span
                                    key={line.id}
                                    className="rounded-full bg-white px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-indigo-700"
                                  >
                                    {line.title}
                                  </span>
                                ))
                              ) : (
                                <span className="text-sm text-slate-500">Nenhuma linha editorial marcada ainda.</span>
                              )}
                            </div>
                          </div>
                          {launchData?.avatarSummary && (
                            <p className="mt-3 rounded-2xl bg-white/80 px-3 py-3 text-sm text-slate-600">
                              <span className="font-semibold text-slate-900">Resumo do avatar:</span> {launchData.avatarSummary}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-4 text-sm text-slate-500">
                          Marque um ou mais temas e uma ou mais linhas editoriais para montar o roteiro.
                        </div>
                      )}

                      <div className="mt-5 space-y-4 max-h-[560px] overflow-y-auto pr-1">
                        {selectedQuestionPromptBlocks.length > 0 ? (
                          selectedQuestionPromptBlocks.map(block => (
                            <div key={block.theme.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Tema ativo</p>
                              <h5 className="mt-2 text-sm font-black uppercase tracking-[0.2em] text-slate-900">{block.theme.title}</h5>

                              <div className="mt-3 space-y-3">
                                {block.sections.map(section => {
                                  const sectionStyle = QUESTION_SECTION_VISUAL_STYLES[section.id] ?? QUESTION_SECTION_DEFAULT_STYLE;
                                  return (
                                  <div key={`${block.theme.id}-${section.id}`} className={`rounded-2xl border p-3 ${sectionStyle.containerClassName}`}>
                                    <p className={`text-xs font-semibold uppercase tracking-[0.25em] ${sectionStyle.titleClassName}`}>{section.title}</p>
                                    <div className="mt-3 grid gap-2">
                                      {section.prompts.map(prompt => (
                                        <button
                                          key={`${block.theme.id}-${section.id}-${prompt}`}
                                          type="button"
                                          onClick={() => toggleQuestionPromptSelection(block.theme.id, section.id, prompt)}
                                          className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                                            section.selectedPrompts.includes(prompt)
                                              ? sectionStyle.activeButtonClassName
                                              : sectionStyle.inactiveButtonClassName
                                          }`}
                                        >
                                          <div className="flex items-start justify-between gap-3">
                                            <span>{prompt}</span>
                                            <span
                                              className={`rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${
                                                section.selectedPrompts.includes(prompt)
                                                  ? sectionStyle.activeBadgeClassName
                                                  : 'bg-slate-100 text-slate-400'
                                              }`}
                                            >
                                              {section.selectedPrompts.includes(prompt) ? 'Escolhida' : 'Livre'}
                                            </span>
                                          </div>
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )})}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
                            O cardapio de perguntas aparece quando pelo menos um tema for marcado.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeThemeWorkspace === 'column-4' && (
                    <div className="space-y-5 rounded-3xl border-2 border-slate-200 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Coluna 4</p>
                        <h4 className="mt-2 text-xl font-black text-slate-900">Estrutura de roteiro</h4>
                        <p className="mt-2 text-sm text-slate-500">
                          Estruture o roteiro por tema marcando as perguntas em cada bloco.
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Estrutura de roteiro</p>
                        <div className="mt-4 space-y-4">
                          {selectedQuestionPromptBlocks.length > 0 ? (
                            selectedQuestionPromptBlocks.map(block => {
                              const contextPrompt = block.sections.find(section => section.id === 'contexto')?.selectedPrompts[0];
                              const benefitPrompt = block.sections.find(section => section.id === 'beneficios')?.selectedPrompts[0];
                              const howPrompt = block.sections.find(section => section.id === 'como-fazer')?.selectedPrompts[0];
                              const extraPrompts = block.sections
                                .filter(section => !section.isRequired)
                                .flatMap(section => section.selectedPrompts.map(prompt => `${section.title}: ${prompt}`));

                              return (
                                <div
                                  key={block.theme.id}
                                  className="rounded-2xl border border-white bg-white p-4"
                                >
                                  <h5 className="text-base font-black text-slate-900">Aplicacao para: {block.theme.title}</h5>
                                  <div className="mt-3 space-y-3">
                                    {SCRIPT_STRUCTURE_STEPS.map(step => (
                                      <div key={`${block.theme.id}-${step.id}`} className="rounded-2xl bg-slate-50 p-4">
                                        <h6 className="text-sm font-black text-slate-900">{step.title}</h6>
                                        <ul className="mt-3 space-y-2 text-sm text-slate-600">
                                          {step.id === 'introducao' && step.items.map(item => (
                                            <li key={`${block.theme.id}-${step.id}-${item}`} className="rounded-xl bg-white px-3 py-2">
                                              {item}
                                            </li>
                                          ))}
                                          {step.id === 'contexto' && (
                                            <>
                                              <li className="rounded-xl bg-indigo-50 px-3 py-2 text-indigo-900">
                                                Pergunta guia escolhida: {contextPrompt ?? 'Escolha 1 pergunta de Contexto no cardapio.'}
                                              </li>
                                              {step.items.map(item => (
                                                <li key={`${block.theme.id}-${step.id}-${item}`} className="rounded-xl bg-white px-3 py-2">
                                                  {item.replace('esse tema', block.theme.title)}
                                                </li>
                                              ))}
                                            </>
                                          )}
                                          {step.id === 'beneficios' && (
                                            <>
                                              <li className="rounded-xl bg-indigo-50 px-3 py-2 text-indigo-900">
                                                Pergunta guia escolhida: {benefitPrompt ?? 'Escolha 1 pergunta de Beneficios no cardapio.'}
                                              </li>
                                              {step.items.map(item => (
                                                <li key={`${block.theme.id}-${step.id}-${item}`} className="rounded-xl bg-white px-3 py-2">
                                                  {item.replace('esse tema', block.theme.title)}
                                                </li>
                                              ))}
                                            </>
                                          )}
                                          {step.id === 'como' && (
                                            <>
                                              <li className="rounded-xl bg-indigo-50 px-3 py-2 text-indigo-900">
                                                Pergunta guia escolhida: {howPrompt ?? 'Escolha 1 pergunta de Como fazer no cardapio.'}
                                              </li>
                                              {step.items.map(item => (
                                                <li key={`${block.theme.id}-${step.id}-${item}`} className="rounded-xl bg-white px-3 py-2">
                                                  {item.replace('esse tema', block.theme.title)}
                                                </li>
                                              ))}
                                            </>
                                          )}
                                        </ul>
                                      </div>
                                    ))}

                                    {extraPrompts.length > 0 && (
                                      <div className="rounded-2xl bg-slate-50 p-4">
                                        <h6 className="text-sm font-black text-slate-900">5. Elementos complementares</h6>
                                        <ul className="mt-3 space-y-2 text-sm text-slate-600">
                                          {extraPrompts.map(item => (
                                            <li key={`${block.theme.id}-${item}`} className="rounded-xl bg-white px-3 py-2">
                                              {item}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
                              A estrutura aparece quando houver ao menos um tema marcado.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Script do raiz — painel full-width abaixo das 4 colunas */}
              <div className="rounded-3xl border-2 border-indigo-100 bg-white p-6 shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Script do raiz</p>
                    <h4 className="mt-2 text-2xl font-black text-slate-900">Gerar roteiro alinhado a ROMA</h4>
                    <p className="mt-2 text-sm text-slate-500">O roteiro sempre usa a ROMA preenchida em Informacoes da ROMA como promessa central.</p>
                  </div>
                  <label className="flex-shrink-0 flex flex-col gap-2 text-sm font-semibold text-slate-700">
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Tempo do raiz</span>
                    <select value={rootScriptDurationMinutes} onChange={handleRootScriptDurationSelect} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-400">
                      {ROOT_SCRIPT_DURATION_OPTIONS.map(option => (
                        <option key={option} value={option}>{option} minutos</option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button type="button" onClick={handleGenerateRootScript} disabled={!canGenerateRootScript || isGeneratingRootScript} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-60">
                    {isGeneratingRootScript ? 'Gerando roteiro...' : 'Gerar script do raiz'}
                  </button>
                  <button type="button" onClick={handleApproveRootScript} disabled={!rootScriptDraft.trim() || isSavingRootScript} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-emerald-300 bg-emerald-50 px-5 py-2.5 text-sm font-bold text-emerald-800 hover:border-emerald-400 hover:bg-emerald-100 disabled:opacity-60">
                    {isSavingRootScript ? 'Salvando...' : rootScriptApproved ? 'Aprovado e salvo' : 'Aprovar e salvar'}
                  </button>
                  <button type="button" onClick={() => setIsEditingRootScript(prev => !prev)} disabled={!rootScriptDraft.trim()} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-slate-50 px-5 py-2.5 text-sm font-bold text-slate-800 hover:border-slate-400 hover:bg-slate-100 disabled:opacity-60">
                    {isEditingRootScript ? 'Visualizar markdown' : 'Editar texto'}
                  </button>
                  <button type="button" onClick={handleGenerateRootHeadlines} disabled={!rootScriptApproved || isGeneratingRootHeadlines} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-amber-300 bg-amber-50 px-5 py-2.5 text-sm font-bold text-amber-800 hover:border-amber-400 hover:bg-amber-100 disabled:opacity-60">
                    {isGeneratingRootHeadlines ? 'Gerando headlines...' : 'Gerar 5 headlines'}
                  </button>
                  <button type="button" onClick={handleToggleRootScriptAudio} disabled={!rootScriptDraft.trim()} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-fuchsia-300 bg-fuchsia-50 px-5 py-2.5 text-sm font-bold text-fuchsia-800 hover:border-fuchsia-400 hover:bg-fuchsia-100 disabled:opacity-60">
                    {isSpeakingRootScript ? 'Parar audio' : 'Ouvir roteiro'}
                  </button>
                  <button type="button" onClick={handleOpenRootScriptPdfPreview} disabled={!rootScriptDraft.trim()} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-sky-300 bg-sky-50 px-5 py-2.5 text-sm font-bold text-sky-800 hover:border-sky-400 hover:bg-sky-100 disabled:opacity-60">
                    Visualizar PDF
                  </button>
                  <button type="button" onClick={handleDownloadRootScriptPdf} disabled={!rootScriptDraft.trim()} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-teal-300 bg-teal-50 px-5 py-2.5 text-sm font-bold text-teal-800 hover:border-teal-400 hover:bg-teal-100 disabled:opacity-60">
                    Baixar PDF
                  </button>
                  <button type="button" onClick={handleDownloadRootScriptMarkdown} disabled={!rootScriptDraft.trim()} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-violet-300 bg-violet-50 px-5 py-2.5 text-sm font-bold text-violet-800 hover:border-violet-400 hover:bg-violet-100 disabled:opacity-60">
                    Baixar Markdown
                  </button>
                  <button type="button" onClick={handleClearRootScript} disabled={!rootScriptDraft.trim() && rootHeadlines.length === 0} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-rose-300 bg-rose-50 px-5 py-2.5 text-sm font-bold text-rose-800 hover:border-rose-400 hover:bg-rose-100 disabled:opacity-60">
                    Limpar roteiro
                  </button>
                  <button type="button" onClick={handleSendRootScriptToScrumban} disabled={!rootScriptDraft.trim()} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-indigo-300 bg-indigo-50 px-5 py-2.5 text-sm font-bold text-indigo-800 hover:border-indigo-400 hover:bg-indigo-100 disabled:opacity-60">
                    Enviar para Scrumban
                  </button>
                </div>

                <div ref={rootScriptWorkspaceRef} className="mt-5">
                  {rootScriptDraft ? (
                    <div className="space-y-3">
                      {isEditingRootScript ? (
                        <textarea
                          title="Editor do script do raiz em markdown"
                          placeholder="Edite aqui o roteiro em markdown antes de aprovar"
                          value={rootScriptDraft}
                          onChange={handleRootScriptDraftChange}
                          rows={24}
                          className="w-full rounded-3xl border-2 border-slate-200 bg-white px-6 py-5 text-sm leading-relaxed text-slate-700 focus:ring-2 focus:ring-indigo-300"
                        />
                      ) : (
                        <div className="rounded-3xl border-2 border-slate-200 bg-white p-6">
                          <ReactMarkdown components={ROOT_SCRIPT_MARKDOWN_COMPONENTS}>{rootScriptDraft}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
                      Nenhum script do raiz gerado ainda. Marque temas, escolha perguntas e clique em Gerar script do raiz.
                    </div>
                  )}
                </div>

                <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-amber-700">Headlines possiveis</p>
                  {rootHeadlinesFeedback && (
                    <p className="mb-3 rounded-xl border border-amber-200 bg-white px-3 py-2 text-xs font-semibold text-amber-800">
                      {rootHeadlinesFeedback}
                    </p>
                  )}
                  {rootHeadlines.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                      {rootHeadlines.map((headline, index) => (
                        <div key={`${headline}-${index}`} className="flex flex-col rounded-2xl border border-amber-100 bg-white px-4 py-3 text-sm text-amber-900 shadow-sm">
                          <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.25em] text-amber-400">Opcao {index + 1}</span>
                          {headline}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-amber-800">
                      Apos aprovar o roteiro, clique em Gerar 5 headlines para receber opcoes atrativas com curiosidade.
                    </p>
                  )}
                </div>

                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Scrumban do Script de Raiz</p>
                      <h5 className="mt-2 text-lg font-black text-slate-900">Historico de versoes por status</h5>
                      <p className="mt-1 text-sm text-slate-600">Cada clique em "Gerar script do raiz" cria um novo card no board.</p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                      {rootScriptVersions.length} versoes
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-4">
                    {ROOT_SCRIPT_SCRUMBAN_COLUMNS.map((column, columnIndex) => {
                      const columnItems = rootScriptVersions.filter(version => version.status === column.key);
                      const nextColumn = ROOT_SCRIPT_SCRUMBAN_COLUMNS[columnIndex + 1];

                      return (
                        <div key={column.key} className={`rounded-2xl border p-3 ${column.className}`}>
                          <div className="mb-3 flex items-center justify-between gap-2">
                            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-700">{column.label}</p>
                            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                              {columnItems.length}
                            </span>
                          </div>

                          <div className="space-y-2">
                            {columnItems.length > 0 ? (
                              columnItems.map(version => (
                                <div
                                  key={version.id}
                                  className={`rounded-xl border bg-white p-3 shadow-sm ${
                                    currentRootScriptVersionId === version.id ? 'border-indigo-300' : 'border-slate-200'
                                  }`}
                                >
                                  <p className="text-sm font-black text-slate-900">{version.title}</p>
                                  <p className="mt-1 text-[11px] text-slate-500">{formatRootScriptVersionDate(version)}</p>
                                  <div className="mt-2 flex flex-wrap gap-1">
                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                                      {ROOT_SCRIPT_STATUS_LABELS[version.status]}
                                    </span>
                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                                      {version.durationMinutes} min
                                    </span>
                                  </div>
                                  {version.themeTitles.length > 0 && (
                                    <p className="mt-2 text-[11px] text-slate-600">
                                      Temas: {version.themeTitles.slice(0, 2).join(' | ')}
                                    </p>
                                  )}
                                  <div className="mt-3 flex flex-wrap gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenRootScriptVersion(version)}
                                      className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-600 hover:border-indigo-300 hover:text-indigo-700"
                                    >
                                      Abrir
                                    </button>
                                    {nextColumn && (
                                      <button
                                        type="button"
                                        onClick={() => handleMoveRootScriptVersionStatus(version, nextColumn.key)}
                                        className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-600 hover:border-emerald-300 hover:text-emerald-700"
                                      >
                                        Mover para {nextColumn.label}
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteRootScriptVersion(version)}
                                      className="rounded-full border border-rose-200 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-rose-600 hover:border-rose-300 hover:bg-rose-50"
                                    >
                                      Excluir
                                    </button>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="rounded-xl border border-dashed border-slate-300 bg-white px-3 py-4 text-xs text-slate-500">
                                Sem cards nesta coluna.
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>

            <section id="section-audience-creation" className="space-y-6">
              <div className="rounded-3xl border-2 border-emerald-200 bg-gradient-to-br from-white via-emerald-50 to-teal-50 p-6 shadow-[0_12px_30px_rgba(16,185,129,0.10)]">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.4em] text-emerald-500/80">Criação de Audiência</p>
                    <h3 className="mt-2 text-3xl font-black text-slate-900">Checklist de presença digital</h3>
                    <p className="mt-2 max-w-3xl text-sm text-slate-600">
                      Prepare sua presença nas redes sociais antes da captação de leads. Marque cada tarefa conforme for executando.
                    </p>
                  </div>
                  <div className="flex-shrink-0 rounded-2xl border border-emerald-100 bg-white/80 px-4 py-3 text-sm text-slate-600">
                    <p className="font-semibold text-slate-900">
                      {audienceDays.flatMap(d => d.tasks).filter(t => t.done).length}
                      {' '}de{' '}
                      {audienceDays.flatMap(d => d.tasks).length} tarefas concluídas
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.25em] text-emerald-600">Instagram · Facebook · YouTube</p>
                  </div>
                </div>
              </div>

              <AudienceCreationPanel
                days={audienceDays}
                launchData={launchData}
                onChange={days => {
                  setAudienceDays(days);
                  persistAudienceDays(days).catch(console.error);
                }}
              />
            </section>

            <section className="space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.4em] text-indigo-500/80">Briefing</p>

              {isRootScriptPdfModalOpen && rootScriptPdfUrl && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4 py-8">
                  <div className="w-full max-w-6xl rounded-3xl bg-white p-5 shadow-2xl space-y-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-sky-500/80">Visualizacao em PDF</p>
                        <h3 className="text-2xl font-black text-slate-900">Script do raiz</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={handleDownloadRootScriptPdf}
                          className="inline-flex items-center justify-center rounded-full border border-teal-200 bg-white px-5 py-2 text-xs font-black uppercase tracking-[0.25em] text-teal-700 hover:border-teal-300 hover:bg-teal-50"
                        >
                          Baixar PDF
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsRootScriptPdfModalOpen(false)}
                          className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2 text-xs font-black uppercase tracking-[0.25em] text-slate-700 hover:border-slate-400"
                        >
                          Fechar
                        </button>
                      </div>
                    </div>

                    <iframe
                      title="Preview PDF Script do Raiz"
                      src={rootScriptPdfUrl}
                      className="h-[70vh] w-full rounded-2xl border border-slate-200"
                    />
                  </div>
                </div>
              )}

              {isExportModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4 py-8">
                  <div className="w-full max-w-4xl rounded-3xl bg-white p-6 shadow-2xl space-y-4">
                    <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-indigo-500/80">Visualização</p>
                        <h3 className="text-2xl font-black text-slate-900">Resumo completo das informações e fases</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsExportModalOpen(false)}
                        className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 hover:text-slate-800"
                      >
                        Fechar
                      </button>
                    </div>
                    <p className="text-sm text-slate-500">
                      Revise tudo antes de baixar. O arquivo inclui os dados do diagnóstico e cada fase do plano, em ordem cronológica.
                    </p>
                    <textarea
                      rows={18}
                      readOnly
                      value={exportPreview || buildExportPreview()}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-mono text-slate-700"
                    />
                    <div className="flex flex-wrap gap-3 justify-end">
                      <button
                        type="button"
                        onClick={handleDownloadExport}
                        className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-xs font-black uppercase tracking-[0.3em] text-white hover:bg-slate-800"
                      >
                        Download completo
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsExportModalOpen(false)}
                        className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-xs font-black uppercase tracking-[0.3em] text-slate-700 hover:border-indigo-200 hover:text-indigo-600"
                      >
                        Fechar janela
                      </button>
                    </div>
                  </div>
                </div>
              )}
                  <h2 className="text-3xl font-black text-slate-900">Diagnóstico estratégico</h2>
                  <p className="text-sm text-slate-500 mt-1">Preencha uma vez e reaproveite em cada fase do lançamento.</p>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleOpenExportModal}
                    className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2 text-xs font-black uppercase tracking-[0.3em] text-slate-700 transition hover:border-indigo-200 hover:text-indigo-600"
                  >
                    Visualizar & baixar
                  </button>
                </div>
              </div>
              {briefingPanel}
            </section>

            <section id="phase-workspace" className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.4em] text-indigo-500/80">Fases</p>
                <h2 className="text-3xl font-black text-slate-900">Central de comandos</h2>
                <p className="text-sm text-slate-500 mt-1">Selecione uma fase no menu lateral, defina instruções e gere os roteiros abaixo.</p>
              </div>

              {selectedPhase ? (
                <div className="space-y-6 rounded-3xl border-2 border-slate-300 bg-white/95 p-8 shadow-[0_16px_40px_rgba(15,23,42,0.10)]">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.4em] text-indigo-400">{phaseConfig.labels[selectedPhase.id] ?? selectedPhase.id}</p>
                      <h3 className="text-2xl font-black text-slate-900">{selectedPhase.name}</h3>
                      <p className="text-sm text-slate-500 mt-1">{selectedPhase.description}</p>
                      {phaseDates[selectedPhase.id] && (
                        <p className="text-xs font-semibold text-indigo-500 mt-2">{phaseDates[selectedPhase.id]}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/60 px-4 py-3">
                      <label className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500">
                        Offset D
                      </label>
                      <input
                        type="number"
                        value={selectedPhase.offsetDays ?? ''}
                        onChange={event => handlePhaseOffsetChange(selectedPhase.id, event.target.value)}
                        placeholder={`${phaseConfig.offsets[selectedPhase.id] ?? 0}`}
                        className="w-20 rounded-full border border-indigo-200 bg-white px-3 py-1 text-xs font-semibold text-indigo-900"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => selectedPhase && generatePhaseWithGuidance(selectedPhase.id)}
                        disabled={selectedPhase.isGenerating || !launchData}
                        className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-black uppercase tracking-[0.3em] text-white hover:bg-slate-800 disabled:opacity-60"
                      >
                        {selectedPhase.isGenerating ? 'Gerando...' : 'Gerar texto da live'}
                      </button>
                      <button
                        type="button"
                        onClick={() => selectedPhase && handleTogglePhaseAudio(selectedPhase)}
                        disabled={!selectedPhase.liveScript && speakingPhaseId !== selectedPhase.id}
                        className="inline-flex items-center justify-center rounded-full border border-fuchsia-200 bg-white px-6 py-3 text-xs font-black uppercase tracking-[0.25em] text-fuchsia-700 hover:border-fuchsia-300 hover:bg-fuchsia-50 disabled:opacity-60"
                      >
                        {speakingPhaseId === selectedPhase.id ? 'Parar audio' : 'Ouvir roteiro'}
                      </button>
                      <button
                        type="button"
                        onClick={() => selectedPhase && handleSavePhaseContent(selectedPhase.id)}
                        disabled={savingPhaseId === selectedPhase.id}
                        className="inline-flex items-center justify-center rounded-full border border-emerald-200 bg-white px-6 py-3 text-xs font-black uppercase tracking-[0.25em] text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50 disabled:opacity-60"
                      >
                        {savingPhaseId === selectedPhase.id ? 'Salvando fase...' : 'Salvar fase'}
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <label className="space-y-2 text-sm text-slate-600">
                      <span className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">Pontos importantes</span>
                      <textarea
                        rows={4}
                        value={selectedPhaseGuidance?.keyPoints ?? ''}
                        onChange={event => selectedPhaseGuidanceKey && updateGuidanceValue(selectedPhaseGuidanceKey, 'keyPoints', event.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-400"
                      />
                    </label>
                    <label className="space-y-2 text-sm text-slate-600">
                      <span className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">Estrutura / gatilhos</span>
                      <textarea
                        rows={4}
                        value={selectedPhaseGuidance?.framework ?? ''}
                        onChange={event => selectedPhaseGuidanceKey && updateGuidanceValue(selectedPhaseGuidanceKey, 'framework', event.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-400"
                      />
                    </label>
                  </div>

                  <div>
                    <button
                      type="button"
                      disabled={!selectedPhaseGuidanceKey || selectedPhaseGuidanceStatus.saving}
                      onClick={() => selectedPhaseGuidanceKey && handleSaveGuidanceEntry(selectedPhaseGuidanceKey)}
                      className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-5 py-2 text-xs font-black uppercase tracking-[0.3em] text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 disabled:opacity-60"
                    >
                      {selectedPhaseGuidanceStatus.saving ? 'Salvando...' : 'Salvar instruções'}
                    </button>
                  </div>

                  <div className="space-y-3 rounded-3xl border-2 border-emerald-300 bg-emerald-50/70 p-4 shadow-[0_8px_24px_rgba(16,185,129,0.14)]">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.4em] text-emerald-700">
                        Etapas operacionais da fase
                      </p>
                      <span className="text-xs font-semibold text-emerald-700">
                        {(selectedPhase.tasks ?? []).filter(task => task.done).length}/{(selectedPhase.tasks ?? []).length} concluÃ­das
                      </span>
                    </div>
                    {(selectedPhase.tasks ?? []).length ? (
                      <div className="space-y-4">
                        {(selectedPhase.tasks ?? []).map((task, index) => (
                          <div
                            key={task.id}
                            className={`w-full rounded-2xl border-2 px-4 py-4 text-left shadow-[0_6px_20px_rgba(16,185,129,0.10)] transition ${
                              task.done
                                ? 'border-emerald-300 bg-emerald-50/40 text-emerald-900'
                                : 'border-emerald-200 bg-white text-slate-700 hover:border-emerald-300'
                            }`}
                          >
                            <div className="mb-3 inline-flex rounded-full border border-emerald-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-emerald-700">
                              Etapa {index + 1}
                            </div>
                            <div className="flex items-start justify-between gap-3">
                              <input
                                value={task.title}
                                onChange={event => handleUpdateTaskFields(selectedPhase.id, task.id, { title: event.target.value })}
                                className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-300"
                              />
                              <button
                                type="button"
                                onClick={() => handleToggleTaskDone(selectedPhase.id, task.id)}
                                className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${
                                  task.done
                                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                                    : 'border-slate-300 bg-white text-slate-600'
                                }`}
                              >
                                {task.done ? 'OK' : 'Marcar OK'}
                              </button>
                            </div>
                            <textarea
                              rows={2}
                              value={task.details}
                              onChange={event => handleUpdateTaskFields(selectedPhase.id, task.id, { details: event.target.value })}
                              className="mt-2 w-full rounded-lg border border-emerald-100 bg-white px-3 py-2 text-xs text-slate-700 focus:ring-2 focus:ring-emerald-300"
                            />
                            <textarea
                              rows={3}
                              value={task.knowledgeBase ?? ''}
                              onChange={event => handleUpdateTaskFields(selectedPhase.id, task.id, { knowledgeBase: event.target.value })}
                              placeholder="Base de conhecimento usada para executar esta etapa... Markdown aceito: #, ##, -, 1., >"
                              className="mt-2 w-full rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-900 focus:ring-2 focus:ring-emerald-300"
                            />
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                                D offset
                              </label>
                              <input
                                type="number"
                                value={task.dueOffsetDays ?? 0}
                                onChange={event =>
                                  handleUpdateTaskFields(selectedPhase.id, task.id, {
                                    dueOffsetDays: Number.isNaN(Number(event.target.value))
                                      ? undefined
                                      : Number(event.target.value),
                                  })
                                }
                                className="w-20 rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700"
                              />
                              <select
                                value={task.contentMode ?? 'none'}
                                onChange={event =>
                                  handleUpdateTaskFields(selectedPhase.id, task.id, {
                                    contentMode: event.target.value as PhaseTask['contentMode'],
                                  })
                                }
                                className="rounded-full border border-fuchsia-200 bg-white px-3 py-1 text-xs font-semibold text-fuchsia-700"
                              >
                                <option value="none">Sem geracao</option>
                                <option value="text">Gera texto</option>
                                <option value="image">Gera imagem</option>
                              </select>
                              <label className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-sky-700">
                                <input
                                  type="checkbox"
                                  checked={Boolean(task.proofRequired)}
                                  onChange={event =>
                                    handleUpdateTaskFields(selectedPhase.id, task.id, { proofRequired: event.target.checked })
                                  }
                                />
                                Exige prova
                              </label>
                              <button
                                type="button"
                                onClick={() => handleSaveTaskEdits(selectedPhase.id, task.id)}
                                disabled={savingTaskKey === getTaskActionKey(selectedPhase.id, task.id, 'save-task')}
                                className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700 disabled:opacity-60"
                              >
                                {savingTaskKey === getTaskActionKey(selectedPhase.id, task.id, 'save-task')
                                  ? 'Salvando etapa...'
                                  : 'Salvar etapa'}
                              </button>
                            </div>
                            {task.contentMode && task.contentMode !== 'none' && (
                              <div className="mt-3 space-y-2">
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleGenerateTaskDraft(selectedPhase.id, task.id)}
                                    disabled={generatingTaskKey === getTaskActionKey(selectedPhase.id, task.id, 'generate')}
                                    className="rounded-full border border-fuchsia-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-fuchsia-700 disabled:opacity-60"
                                  >
                                    {generatingTaskKey === getTaskActionKey(selectedPhase.id, task.id, 'generate')
                                      ? 'Gerando...'
                                      : task.contentMode === 'image'
                                        ? 'Gerar imagem com IA'
                                        : 'Gerar texto com IA'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSaveTaskDraft(selectedPhase.id, task.id)}
                                    disabled={
                                      savingTaskKey === getTaskActionKey(selectedPhase.id, task.id, 'save') ||
                                      !task.contentDraft?.trim()
                                    }
                                    className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700 disabled:opacity-60"
                                  >
                                    {savingTaskKey === getTaskActionKey(selectedPhase.id, task.id, 'save')
                                      ? 'Salvando...'
                                      : 'Salvar conteudo'}
                                  </button>
                                </div>
                                <textarea
                                  rows={task.contentMode === 'image' ? 6 : 5}
                                  value={task.contentDraft ?? ''}
                                  onChange={event => handleTaskDraftChange(selectedPhase.id, task.id, event.target.value)}
                                  placeholder={
                                    task.contentMode === 'image'
                                      ? 'Briefing/prompt de imagem gerado pela IA...'
                                      : 'Texto operacional gerado pela IA...'
                                  }
                                  className="w-full rounded-xl border border-fuchsia-100 bg-white px-3 py-2 text-xs text-slate-700 focus:ring-2 focus:ring-fuchsia-300"
                                />
                                {task.contentSavedAt && (
                                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
                                    Salvo em {new Date(task.contentSavedAt).toLocaleString('pt-BR')}
                                  </p>
                                )}
                              </div>
                            )}
                            {task.proofRequired && (
                              <div className="mt-3 space-y-2">
                                <label className="inline-flex cursor-pointer items-center rounded-full border border-sky-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-sky-700">
                                  <input
                                    type="file"
                                    className="hidden"
                                    onChange={event => handleUploadTaskProof(selectedPhase.id, task.id, event.target.files?.[0])}
                                  />
                                  {uploadingTaskKey === getTaskActionKey(selectedPhase.id, task.id, 'upload')
                                    ? 'Enviando prova...'
                                    : 'Anexar prova'}
                                </label>
                                {(task.proofs ?? []).length > 0 && (
                                  <div className="space-y-1">
                                    {(task.proofs ?? []).map(proof => (
                                      <a
                                        key={proof.id}
                                        href={proof.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block text-[11px] font-semibold text-sky-700 underline"
                                      >
                                        {proof.name}
                                      </a>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-emerald-800/80">
                        As etapas desta fase ja carregam automaticamente ao abrir.
                      </p>
                    )}
                  </div>

                  <div className="rounded-3xl border-2 border-indigo-200 bg-indigo-50/80 p-4 shadow-[0_8px_24px_rgba(79,70,229,0.14)] flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.4em] text-indigo-500">Aviso de duração</p>
                      <p className="text-sm font-semibold text-indigo-900">Cada novo roteiro deve durar cerca de {scriptDurationMinutes} minutos.</p>
                      <p className="text-xs text-indigo-700 mt-1">Este box acompanha todas as gerações para garantir o tempo solicitado.</p>
                    </div>
                    <label className="text-sm font-semibold text-indigo-900 flex flex-col gap-1">
                      <span className="text-xs font-bold tracking-[0.3em] text-indigo-500">Tempo desejado</span>
                      <select
                        value={scriptDurationMinutes}
                        onChange={handleScriptDurationSelect}
                        className="rounded-2xl border border-indigo-200 bg-white px-4 py-2 text-sm font-semibold text-indigo-900 focus:ring-2 focus:ring-indigo-400"
                      >
                        {SCRIPT_DURATION_OPTIONS.map(option => (
                          <option key={option} value={option}>
                            {option} minutos
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="space-y-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">Script completo para live</p>
                    {selectedPhase.liveScript ? (
                      <div className="space-y-4">
                        <div className="rounded-3xl border-2 border-indigo-200 bg-indigo-50/70 px-4 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-indigo-600">
                          Tempo solicitado: aproximadamente {selectedPhase.liveScriptDurationMinutes ?? scriptDurationMinutes} minutos.
                        </div>
                        <div
                          className="prose prose-slate max-w-none rounded-3xl border-2 border-slate-200 bg-slate-50 p-6 text-sm leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: selectedPhase.liveScript }}
                        />
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">Nenhum roteiro gerado ainda. Use os botões acima para criar sua primeira versão.</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
                  Clique em uma fase na navegação lateral para liberar este painel.
                </div>
              )}
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
