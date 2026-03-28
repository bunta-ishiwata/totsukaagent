export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface AuthResponse {
  success: boolean;
  error?: string;
}

export interface ChatRequest {
  messages: Message[];
}
