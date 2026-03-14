export type LaunchType = 'classic' | 'seed';

export interface LaunchData {
  avatarName: string;
  productName: string;
  niche: string;
  targetAudience: string;
  mainProblem: string;
  mainBenefit: string;
  avatarStory: string;
  avatarAge: string;
  avatarGender: string;
  avatarSalary: string;
  avatarProfession: string;
  avatarReligion: string;
  avatarPoliticalOrientation: string;
  avatarOtherDetails: string;
  avatarSummary: string;
  avatarPains: string;
  avatarDesires: string;
  avatarObjections: string;
  avatarRomaMyth: string;
  avatarFear: string;
  avatarLimitingBeliefs: string;
  avatarQuote: string;
  avatarOpportunitiesShortcuts: string;
  avatarResearchABC: string;
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
  launchType: LaunchType;
  generalTriggers: string;
}

export interface LaunchPhase {
  id: string;
  name: string;
  description: string;
  offsetDays?: number;
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
  offsetDays?: number;
  tasks?: PhaseTask[];
}

export type PhaseContentMap = Record<string, StoredPhaseContent>;

export type TaskContentMode = 'none' | 'text' | 'image';

export interface TaskProof {
  id: string;
  name: string;
  url: string;
  path: string;
  uploadedAt?: string;
}

export interface PhaseTask {
  id: string;
  title: string;
  details: string;
  dueOffsetDays?: number;
  knowledgeBase?: string;
  contentMode?: TaskContentMode;
  contentDraft?: string;
  contentSavedAt?: string;
  proofRequired?: boolean;
  proofs?: TaskProof[];
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
  checklist?: ChecklistData;
  guidance?: GuidanceMap;
  phaseContent?: PhaseContentMap;
  rootScriptDraft?: string;
  rootScriptApproved?: boolean;
  rootScriptHeadlines?: string[];
  rootScriptDurationMinutes?: number;
  audienceDays?: AudienceDay[];
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type AudiencePlatform = 'instagram' | 'facebook' | 'youtube' | 'geral';

export interface AudienceSubTask {
  id: string;
  title: string;
  done: boolean;
  doneAt?: string;
}

export interface AudienceTask {
  id: string;
  title: string;
  platform: AudiencePlatform;
  notes?: string;
  done: boolean;
  doneAt?: string;
  subTasks?: AudienceSubTask[];
}

export interface AudienceDay {
  id: string;
  date?: string;
  label: string;
  tasks: AudienceTask[];
}
