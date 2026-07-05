export type OpenRouterMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export type OpenRouterConfig = {
  apiKey: string;
  model: string;
  httpReferer?: string;
  appTitle?: string;
};

export type OpenRouterChatRequest = {
  model: string;
  messages: OpenRouterMessage[];
  stream: true;
  reasoning: {
    effort: "high";
  };
};

export type OpenRouterStreamDelta = {
  content?: string | null;
  reasoning?: string | null;
  reasoning_content?: string | null;
  reasoning_details?: OpenRouterReasoningDetail[];
};

export type OpenRouterReasoningDetail = {
  type: string;
  text?: string;
  summary?: string;
  data?: string;
};

export type OpenRouterStreamChunk = {
  id?: string;
  choices?: Array<{
    delta?: OpenRouterStreamDelta;
    finish_reason?: string | null;
  }>;
  error?: {
    code?: number;
    message: string;
  };
};
