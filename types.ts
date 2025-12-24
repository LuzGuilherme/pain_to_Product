export interface Source {
  title: string;
  uri: string;
}

export interface PainPointResult {
  summary: string;
  rawText: string;
  sources: Source[];
}

export interface AppIdea {
  title: string;
  oneLiner: string;
  problemSolved: string;
  targetAudience: string;
  coreFeatures: string[];
  monetization: string;
  techComplexity: 'Low' | 'Medium' | 'High';
}

export interface BuildPlan {
  roadmap: {
    phase: string;
    duration: string;
    tasks: string[]
  }[];
  prd: string;
  vibeCodingPrompt: string;
}

export enum AppState {
  IDLE = 'IDLE',
  SEARCHING = 'SEARCHING',
  REVIEWING_PAINS = 'REVIEWING_PAINS',
  GENERATING_IDEAS = 'GENERATING_IDEAS',
  DISPLAY_IDEAS = 'DISPLAY_IDEAS',
  GENERATING_PLAN = 'GENERATING_PLAN',
  DISPLAY_PLAN = 'DISPLAY_PLAN',
  HISTORY = 'HISTORY',
  SAVED = 'SAVED',
  ERROR = 'ERROR'
}
