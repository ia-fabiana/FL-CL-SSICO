export interface LaunchData {
  avatarName: string;
  productName: string;
  niche: string;
  targetAudience: string;
  mainProblem: string;
  mainBenefit: string;
  avatarStory: string;
  avatarPainPoints: string;
  avatarObjections: string;
  avatarDesiredState: string;
  cplThreeSolution: string;
  price: string;
  anchorPrice?: string;
  guarantee: string;
  bonuses: string;
  paymentMethods: string;
  scarcity: string;
  launchDate: string;
  offerDetails: string;
  launchModel: 'opportunity' | 'right_wrong';
}

export interface LaunchPhase {
  id: string;
  name: string;
  description: string;
  liveScript?: string;
  liveScriptUpdatedAt?: string;
  liveScriptDurationMinutes?: number;
  isGenerating?: boolean;
  tasks?: PhaseTask[];
  isGeneratingTasks?: boolean;
}

export interface LaunchPlan {
  avatarHistory: string;
  socialMediaStrategy: string;
  launchModelExplanation: string;
  snaStrategy: string;
  insiderDeliverablesMap: string;
  structure: LaunchPhase[];
}

export interface StoredPhaseContent {
  liveScript?: string;
  updatedAt?: string;
  durationMinutes?: number;
  tasks?: PhaseTask[];
}

export type PhaseContentMap = Record<string, StoredPhaseContent>;

export interface PhaseTask {
  id: string;
  title: string;
  details: string;
  dueOffsetDays?: number;
  done: boolean;
  doneAt?: string;
}

export interface GuidanceEntry {
  keyPoints: string;
  framework: string;
  updatedAt?: string;
}

export type GuidanceMap = Record<string, GuidanceEntry>;

export type ChecklistStatus = 'pending' | 'approved';

export type ChecklistBlockId =
  | 'B0'
  | 'B1'
  | 'B2'
  | 'B3'
  | 'B4'
  | 'B5'
  | 'B6'
  | 'B7'
  | 'B8'
  | 'B9';

export interface ChecklistBlock {
  id: ChecklistBlockId;
  title: string;
  description: string;
  status: ChecklistStatus;
  approvedAt?: string;
}

export interface ChecklistFields {
  romaFinal: string;
  avatar: string;
  precoAtual: string;
  precoFuturo: string;
  bonus: string;
  tecnicaPEC: string;
  metodoREP: string;
  conteudoCampeao: string;
  eventoEfeitoW: string;
  eventosAtivacaoTrial: string;
  canaisOficiais: string;
}

export interface ChecklistData {
  blocks: ChecklistBlock[];
  fields: ChecklistFields;
}

export interface StoredBriefing extends LaunchData {
  checklist: ChecklistData;
  guidance?: GuidanceMap;
  phaseContent?: PhaseContentMap;
  createdAt?: unknown;
  updatedAt?: unknown;
}
