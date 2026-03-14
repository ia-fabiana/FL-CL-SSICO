export interface LaunchData {
  productName: string;
  niche: string;
  targetAudience: string;
  mainProblem: string;
  mainBenefit: string;
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
  scripts?: {
    title: string;
    content: string;
    type: 'video' | 'email' | 'ad' | 'social' | 'heygen';
  }[];
  isGenerating?: boolean;
}

export interface LaunchPlan {
  avatarHistory: string;
  socialMediaStrategy: string;
  launchModelExplanation: string;
  snaStrategy: string;
  insiderDeliverablesMap: string;
  structure: LaunchPhase[];
}
