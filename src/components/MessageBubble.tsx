"use client";

import ReactMarkdown from "react-markdown";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

export default function MessageBubble({
  role,
  content,
  isStreaming,
}: MessageBubbleProps) {
  const isAssistant = role === "assistant";

  return (
    <div
      className={`flex gap-3 mb-4 ${isAssistant ? "justify-start" : "justify-end"}`}
    >
      {isAssistant && (
        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-stone-700 flex items-center justify-center text-lg">
          🧓
        </div>
      )}

      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 ${
          isAssistant
            ? "bg-stone-200 text-stone-900"
            : "bg-stone-700 text-white"
        }`}
      >
        {isAssistant ? (
          <div className="prose prose-sm prose-stone max-w-none [&>p]:mb-2 [&>p:last-child]:mb-0">
            <ReactMarkdown>{content}</ReactMarkdown>
            {isStreaming && (
              <span className="inline-block w-2 h-4 bg-stone-500 animate-pulse ml-0.5" />
            )}
          </div>
        ) : (
          <p className="text-sm whitespace-pre-wrap">{content}</p>
        )}
      </div>

      {!isAssistant && (
        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-lg text-white">
          👤
        </div>
      )}
    </div>
  );
}
