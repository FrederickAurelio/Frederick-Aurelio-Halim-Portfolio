export type MessageRole = "user" | "assistant" | "error";

export type MessageStatus = "complete" | "streaming" | "error";

export type ChatMessage = {
  id: string;
  role: MessageRole;
  content: string;
  status: MessageStatus;
  createdAt: number;
};

export type ChatStatus = "idle" | "submitting" | "streaming";

export type ChatApiMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ChatApiRequest = {
  messages: ChatApiMessage[];
};

export type ChatApiResponse = {
  content: string;
};
