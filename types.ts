export enum ModelType {
  FLASH = 'gemini-2.5-flash',
  PRO = 'gemini-3-pro-preview',
  IMAGE_GEN = 'gemini-2.5-flash-image',
}

export type Theme = 'light' | 'dark' | 'system';

export interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: number;
  isThinking?: boolean;
  thinkingTime?: number; // in ms
  attachments?: Attachment[];
  generatedImage?: string; // base64 data for AI generated images
}

export interface Attachment {
  type: 'image' | 'file';
  data: string; // base64
  mimeType: string;
  fileName?: string; // For display purposes
}

export interface ChatState {
  messages: Message[];
  isGenerating: boolean;
  model: ModelType;
  enableThinking: boolean;
  thinkingBudget: number;
}