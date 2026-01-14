
export type AspectRatio = "1:1" | "9:16" | "4:3" | "16:9" | "3:4";

export interface NodeResult {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  status: 'idle' | 'processing' | 'completed' | 'error';
  aspectRatio: AspectRatio;
  customPrompt?: string;
}

export interface ProductSource {
  base64: string;
  mimeType: string;
  file: File;
}
