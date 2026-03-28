"use client";

import { useState, FormEvent } from "react";

interface LoginFormProps {
  onLogin: () => void;
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!password.trim()) {
      setError("パスワードを入力してください");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (data.success) {
        onLogin();
      } else {
        setError(data.error || "パスワードが正しくありません");
      }
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-56px)] bg-stone-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow-lg p-8 w-full max-w-sm"
      >
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🧓</div>
          <h2 className="text-xl font-bold text-stone-800">
            戸塚宏エージェント
          </h2>
          <p className="text-stone-500 text-sm mt-1">
            パスワードを入力してください
          </p>
        </div>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="パスワード"
          className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500 mb-4 text-stone-800"
          disabled={isLoading}
          autoFocus
        />

        {error && (
          <p className="text-red-500 text-sm mb-4">{error}</p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-stone-800 text-white py-3 rounded-lg font-medium hover:bg-stone-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "認証中..." : "入室する"}
        </button>
      </form>
    </div>
  );
}
