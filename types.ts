
export type AspectRatio = "1:1" | "9:16" | "4:3" | "16:9" | "3:4";

export interface HistoryEntry {
  imageUrl: string;
  customPrompt?: string;
  timestamp: number;
}

export interface NodeResult {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  status: 'idle' | 'processing' | 'completed' | 'error';
  aspectRatio: AspectRatio;
  customPrompt?: string;
  history: HistoryEntry[];
}

export interface ProductSource {
  base64: string;
  mimeType: string;
  file: File;
}
