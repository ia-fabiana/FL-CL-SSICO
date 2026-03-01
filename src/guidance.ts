import { GuidanceEntry, GuidanceMap, LaunchData } from './types';

export const GUIDED_FIELD_CONFIG = [
  {
    field: 'avatarStory',
    sectionId: 'section-expert-info',
    label: 'História do Avatar',
    prompt: 'Transforme os pontos fornecidos em uma narrativa envolvente que explique quem é o avatar hoje, seus desafios e motivações.',
  },
  {
    field: 'mainProblem',
    sectionId: 'section-product-info',
    label: 'Problema Principal',
    prompt: 'Explique claramente a dor central que o produto resolve, usando linguagem acessível e conexão emocional.',
  },
  {
    field: 'mainBenefit',
    sectionId: 'section-product-info',
    label: 'Promessa Principal',
    prompt: 'Descreva o benefício máximo que o avatar alcançará após aplicar a metodologia.',
  },
  {
    field: 'avatarPainPoints',
    sectionId: 'section-avatar-info',
    label: 'Dores e Sintomas',
    prompt: 'Liste as principais dores e sintomas do avatar com exemplos práticos do dia a dia.',
  },
  {
    field: 'avatarObjections',
    sectionId: 'section-avatar-info',
    label: 'Objeções e Medos',
    prompt: 'Traga as objeções declaradas do avatar e os medos que impedem a decisão.',
  },
  {
    field: 'avatarDesiredState',
    sectionId: 'section-avatar-info',
    label: 'Visão de Futuro',
    prompt: 'Descreva como ficará a vida do avatar após aplicar o método, destacando conquistas tangíveis.',
  },
  {
    field: 'bonuses',
    sectionId: 'section-offer-info',
    label: 'Bônus Exclusivos',
    prompt: 'Escreva a descrição dos bônus, destacando benefícios e gatilhos de valor.',
  },
  {
    field: 'offerDetails',
    sectionId: 'section-offer-info',
    label: 'Detalhes da Oferta',
    prompt: 'Recapitule pontos extras da oferta para reforçar valor percebido e urgência.',
  },
  {
    field: 'cplThreeSolution',
    sectionId: 'section-offer-info',
    label: 'Âncora do CPL 3',
    prompt: 'Descreva a prova ou demonstração usada no CPL 3 para destravar a decisão.',
  },
] as const;

export type GuidedFieldKey = typeof GUIDED_FIELD_CONFIG[number]['field'];

export const guidanceKeyForField = (field: GuidedFieldKey) => `field:${field}`;
export const guidanceKeyForPhase = (phaseId: string) => `phase:${phaseId}`;

export const createEmptyGuidanceEntry = (): GuidanceEntry => ({
  keyPoints: '',
  framework: '',
});

export const ensureGuidanceKeys = (map: GuidanceMap | undefined, keys: string[]): GuidanceMap => {
  const source = map ?? {};
  let changed = false;
  const next: GuidanceMap = { ...source };
  keys.forEach(key => {
    if (!next[key]) {
      next[key] = createEmptyGuidanceEntry();
      changed = true;
    }
  });
  return changed ? next : source;
};

export const getFieldPrompt = (field: GuidedFieldKey) => {
  const config = GUIDED_FIELD_CONFIG.find(entry => entry.field === field);
  return config?.prompt ?? '';
};

export const collectFieldKeys = () => GUIDED_FIELD_CONFIG.map(entry => guidanceKeyForField(entry.field));

export const collectPhaseKeys = (planIds: string[]) => planIds.map(id => guidanceKeyForPhase(id));

export const getLaunchDataSnapshot = (data: LaunchData | null | undefined) => ({
  productName: data?.productName ?? '',
  niche: data?.niche ?? '',
  targetAudience: data?.targetAudience ?? '',
  avatarName: data?.avatarName ?? '',
  mainProblem: data?.mainProblem ?? '',
  mainBenefit: data?.mainBenefit ?? '',
  avatarStory: data?.avatarStory ?? '',
  avatarPainPoints: data?.avatarPainPoints ?? '',
  avatarObjections: data?.avatarObjections ?? '',
  avatarDesiredState: data?.avatarDesiredState ?? '',
  cplThreeSolution: data?.cplThreeSolution ?? '',
  price: data?.price ?? '',
  anchorPrice: data?.anchorPrice ?? '',
  guarantee: data?.guarantee ?? '',
  bonuses: data?.bonuses ?? '',
  paymentMethods: data?.paymentMethods ?? '',
  scarcity: data?.scarcity ?? '',
  offerDetails: data?.offerDetails ?? '',
  launchModel: data?.launchModel ?? 'opportunity',
});
