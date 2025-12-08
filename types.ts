
export type SlideLayout = 'TITLE' | 'CONTENT_RIGHT' | 'CONTENT_LEFT' | 'FULL_IMAGE' | 'IMAGE_ONLY';

export interface SlideData {
  id: string;
  title: string;
  content: string[];
  imagePrompt: string;
  imageUrl?: string;
  isGeneratingImage?: boolean;
  layout: SlideLayout;
}

export interface PresentationData {
  topic: string;
  slides: SlideData[];
}

export enum GenerationStatus {
  IDLE = 'IDLE',
  GENERATING_STRUCTURE = 'GENERATING_STRUCTURE',
  GENERATING_IMAGES = 'GENERATING_IMAGES',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}

export interface AIOperationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface HistoryItem {
  id: string;
  topic: string;
  slides: SlideData[];
  updatedAt: number;
}

export type Language = 'zh' | 'en';

// Window augmentation for AI Studio key selection
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio;
  }
}