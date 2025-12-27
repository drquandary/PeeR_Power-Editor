
export enum EditorMode {
  WRITE = 'WRITE',
  DE_AI = 'DE_AI',
  REVIEW = 'REVIEW',
  FORMAT = 'FORMAT',
  REORGANIZE = 'REORGANIZE',
  AGENT = 'AGENT',
  DISCOVERY = 'DISCOVERY'
}

export enum JournalStyle {
  GENERAL = 'General Academic',
  NATURE = 'Nature/Science',
  IEEE = 'IEEE',
  APA = 'APA (Psychology/Social Sciences)',
  MLA = 'MLA (Humanities)',
  MEDICAL = 'JAMA/NEJM'
}

export interface PaperSection {
  id: string;
  title: string;
  content: string;
}

export interface CitationPlacement {
  snippet: string;
  explanation: string;
  sectionId: string;
}

export interface RelatedPaper {
  id: string;
  title: string;
  authors: string;
  year: string;
  relevance: string;
  fullReference: string;
  citationMarker: string;
  suggestedPlacements?: CitationPlacement[];
}

export interface AnalysisIssue {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  title: string;
  description: string;
  suggestion?: string;
  replacement?: string;
  snippet?: string;
  location?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  proposals?: AnalysisIssue[];
  timestamp: number;
}

export interface PaperStats {
  wordCount: number;
  aiProbabilityScore: number;
  readabilityScore: number;
}

export interface AnalysisResult {
  stats: PaperStats;
  issues: AnalysisIssue[];
  generalFeedback: string;
  discovery?: RelatedPaper[];
  loading: boolean;
}
