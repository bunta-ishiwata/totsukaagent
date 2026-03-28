"use client";

interface HeaderProps {
  onClear: () => void;
  isAuthenticated: boolean;
}

export default function Header({ onClear, isAuthenticated }: HeaderProps) {
  return (
    <header className="bg-stone-800 text-white px-4 py-3 flex items-center justify-between shadow-md">
      <h1 className="text-lg font-bold tracking-wide">
        🏫 戸塚宏エージェント
      </h1>
      {isAuthenticated && (
        <button
          onClick={onClear}
          className="text-stone-400 hover:text-white transition-colors p-1"
          title="会話をクリア"
        >
          🗑️
        </button>
      )}
    </header>
  );
}
