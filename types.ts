export interface DocumentAnalysis {
  summary: string;
  documentType: string;
  keyEntities: Record<string, string | number | boolean>;
  rawText: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export enum AppState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  VIEWING = 'VIEWING',
  ERROR = 'ERROR'
}

export interface UploadedFile {
  file: File;
  mimeType: string;
  // For Images and PDFs
  previewUrl?: string; 
  base64?: string;
  // For extracted text content (DOCX, TXT, HTML, etc.)
  textContent?: string;
}
