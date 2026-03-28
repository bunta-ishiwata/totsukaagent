import OpenAI from "openai";
import { Message } from "@/types";
import { buildSystemPrompt } from "./prompt";
import { searchRelevantChunks, formatSearchResults } from "./rag";

function getClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

const MAX_HISTORY_TURNS = 20;

export async function streamChat(messages: Message[]): Promise<ReadableStream> {
  // 直近のユーザーメッセージからRAG検索
  const lastUserMessage = [...messages]
    .reverse()
    .find((m) => m.role === "user");
  const query = lastUserMessage?.content || "";

  let relevantContent: string;
  try {
    const results = await searchRelevantChunks(query);
    relevantContent = formatSearchResults(results);
  } catch (error) {
    console.warn("RAG search failed, using fallback:", error);
    relevantContent = "（発言記録の検索に失敗しました。キャラクターの設定に基づいて回答してください。）";
  }

  const systemPrompt = buildSystemPrompt(relevantContent);

  // 会話履歴を直近N件に制限
  const recentMessages = messages.slice(-MAX_HISTORY_TURNS * 2);

  const stream = await getClient().chat.completions.create({
    model: "gpt-4o",
    max_tokens: 1024,
    stream: true,
    messages: [
      { role: "system", content: systemPrompt },
      ...recentMessages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ],
  });

  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content;
          if (delta) {
            const data = JSON.stringify({ text: delta });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        const data = JSON.stringify({ error: errorMessage });
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        controller.close();
      }
    },
  });
}
