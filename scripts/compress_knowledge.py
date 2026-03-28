"""
ナレッジベースを圧縮するスクリプト

全文だとトークン数が多すぎるため、各動画から冒頭部分を抽出して
コンパクトなナレッジベースを作成する。

使い方:
  python compress_knowledge.py
"""

from __future__ import annotations

from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
TRANSCRIPTS_DIR = PROJECT_ROOT / "data" / "transcripts"
KNOWLEDGE_BASE_FILE = PROJECT_ROOT / "data" / "knowledge_base.txt"

# 各動画から抽出する最大行数
MAX_LINES_PER_VIDEO = 60


def main():
    print("ナレッジベースを圧縮中...")

    files = sorted(TRANSCRIPTS_DIR.glob("*.txt"))
    if not files:
        print("文字起こしファイルが見つかりません。")
        return

    sections = []
    sections.append("=" * 60)
    sections.append("戸塚宏 発言記録集（圧縮版）")
    sections.append("令和ヨットスクール YouTubeチャンネルより")
    sections.append("=" * 60)
    sections.append("")

    for filepath in files:
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()

        lines = content.split("\n")

        # ヘッダーからタイトルを取得
        title = "不明"
        for line in lines:
            if line.startswith("# 動画タイトル:"):
                title = line.replace("# 動画タイトル:", "").strip()
                break

        # 本文（タイムスタンプ行）を抽出
        body_lines = [l for l in lines if l.startswith("[")]
        if not body_lines:
            continue

        # 冒頭MAX_LINES_PER_VIDEO行を使用
        selected = body_lines[:MAX_LINES_PER_VIDEO]

        sections.append(f"--- 動画: {title} ---")
        sections.append("\n".join(selected))
        sections.append("")

    result = "\n".join(sections)

    # トークン数推定
    estimated_tokens = int(len(result) / 1.5)
    print(f"  {len(files)} 件の動画を処理")
    print(f"  各動画から最大 {MAX_LINES_PER_VIDEO} 行を抽出")
    print(f"  推定トークン数: 約 {estimated_tokens:,} トークン")

    with open(KNOWLEDGE_BASE_FILE, "w", encoding="utf-8") as f:
        f.write(result)

    print(f"  ファイルサイズ: {KNOWLEDGE_BASE_FILE.stat().st_size:,} bytes")
    print(f"\n保存完了: {KNOWLEDGE_BASE_FILE}")


if __name__ == "__main__":
    main()
