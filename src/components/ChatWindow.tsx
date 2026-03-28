"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Message } from "@/types";
import Header from "./Header";
import LoginForm from "./LoginForm";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";

const STORAGE_KEY = "totsuka_chat_history";

const WELCOME_MESSAGE: Message = {
  role: "assistant",
  content:
    "おう、何か用か？\n聞きたいことがあるならはっきり言え。俺は回りくどいのは嫌いだ。",
};

export default function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 認証状態チェック
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/check");
        const data = await res.json();
        setIsAuthenticated(data.authenticated);
      } catch {
        setIsAuthenticated(false);
      }
    }
    checkAuth();
  }, []);

  // ローカルストレージから会話履歴を復元
  useEffect(() => {
    if (!isAuthenticated) return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, [isAuthenticated]);

  // 会話履歴をローカルストレージに保存
  useEffect(() => {
    if (!isAuthenticated) return;
    if (messages.length <= 1) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // ignore
    }
  }, [messages, isAuthenticated]);

  // 自動スクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(
    async (content: string) => {
      const userMessage: Message = { role: "user", content };
      const newMessages = [...messages, userMessage];
      setMessages(newMessages);
      setIsLoading(true);

      // APIに送る会話履歴（ウェルカムメッセージを除く）
      const apiMessages = newMessages.filter(
        (_, i) => !(i === 0 && newMessages[0] === WELCOME_MESSAGE)
      );

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: apiMessages }),
        });

        if (res.status === 401) {
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        if (!res.body) throw new Error("No response body");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let assistantContent = "";

        // ストリーミング中のアシスタントメッセージを追加
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "" },
        ]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                assistantContent += parsed.text;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    role: "assistant",
                    content: assistantContent,
                  };
                  return updated;
                });
              }
              if (parsed.error) {
                assistantContent +=
                  "\n\nちょっと調子が悪いな。もう一回聞いてくれ。";
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    role: "assistant",
                    content: assistantContent,
                  };
                  return updated;
                });
              }
            } catch {
              // ignore parse errors
            }
          }
        }
      } catch {
        setMessages((prev) => [
          ...prev.slice(0, -1).length === prev.length
            ? prev
            : prev.slice(0, -1),
          {
            role: "assistant" as const,
            content:
              "通信がうまくいかなかったようだ。もう一回試してみろ。",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages]
  );

  function handleClear() {
    setMessages([WELCOME_MESSAGE]);
    localStorage.removeItem(STORAGE_KEY);
  }

  function handleLogin() {
    setIsAuthenticated(true);
  }

  // 認証チェック中
  if (isAuthenticated === null) {
    return (
      <div className="flex flex-col h-screen bg-stone-100">
        <Header onClear={handleClear} isAuthenticated={false} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-stone-500">読み込み中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-stone-100">
      <Header onClear={handleClear} isAuthenticated={isAuthenticated} />

      {!isAuthenticated ? (
        <LoginForm onLogin={handleLogin} />
      ) : (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <div className="max-w-3xl mx-auto">
              {messages.map((msg, i) => (
                <MessageBubble
                  key={i}
                  role={msg.role}
                  content={msg.content}
                  isStreaming={
                    isLoading && i === messages.length - 1 && msg.role === "assistant"
                  }
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input */}
          <MessageInput onSend={handleSend} disabled={isLoading} />
        </>
      )}
    </div>
  );
}
