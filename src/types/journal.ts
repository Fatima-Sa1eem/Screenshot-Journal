export interface ScreenshotItem {
  id: string;
  title: string;
  category: string;
  tags: string[];
  summary: string;
  screenshot: string; // base64 or data URL
  instruction?: string;
  createdAt: string;
  position: {
    x: number;
    y: number;
  };
  aiModel?: string;
  aiStatus?: 'ollama_gemma_2b' | 'fallback_parser';
}

export interface UpdateScreenshotRequest {
  id: string;
  title?: string;
  category?: string;
  tags?: string[];
  summary?: string;
}

export interface ProcessScreenshotRequest {
  screenshot: string; // base64 string
  instruction?: string;
  position?: {
    x: number;
    y: number;
  };
}

export interface OllamaParsedResponse {
  title: string;
  category: string;
  tags: string[];
  summary: string;
}
