import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "戸塚宏エージェント",
  description: "令和ヨットスクール 戸塚宏AIチャット",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">{children}</body>
    </html>
  );
}
