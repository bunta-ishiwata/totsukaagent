"""
文字起こしデータを統合してナレッジベースを構築するスクリプト

使い方:
  python build_knowledge.py

data/transcripts/ の文字起こしファイルを読み込み、
data/knowledge_base.txt として統合・出力します。
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import List, Dict, Tuple

PROJECT_ROOT = Path(__file__).resolve().parent.parent
TRANSCRIPTS_DIR = PROJECT_ROOT / "data" / "transcripts"
METADATA_FILE = PROJECT_ROOT / "data" / "metadata.json"
KNOWLEDGE_BASE_FILE = PROJECT_ROOT / "data" / "knowledge_base.txt"


def load_metadata() -> dict:
    """メタデータを読み込む"""
    if not METADATA_FILE.exists():
        return {}
    with open(METADATA_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
    return {v["id"]: v for v in data}


def load_transcripts() -> list[tuple[str, str, str]]:
    """
    文字起こしファイルを読み込む
    Returns: [(video_id, title, content), ...]
    """
    transcripts = []

    if not TRANSCRIPTS_DIR.exists():
        print("data/transcripts/ ディレクトリが見つかりません。")
        print("先に fetch_transcripts.py を実行してください。")
        return transcripts

    files = sorted(TRANSCRIPTS_DIR.glob("*.txt"))
    if not files:
        print("文字起こしファイルが見つかりません。")
        print("先に fetch_transcripts.py を実行してください。")
        return transcripts

    for filepath in files:
        video_id = filepath.stem
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()

        # ヘッダーからタイトルを抽出
        title = "不明"
        lines = content.split("\n")
        for line in lines:
            if line.startswith("# 動画タイトル:"):
                title = line.replace("# 動画タイトル:", "").strip()
                break

        # ヘッダー行を除去（# で始まる行と空行）
        body_lines = []
        header_done = False
        for line in lines:
            if not header_done:
                if line.startswith("#") or line.strip() == "":
                    continue
                header_done = True
            body_lines.append(line)

        body = "\n".join(body_lines).strip()
        if body:
            transcripts.append((video_id, title, body))

    return transcripts


def build_knowledge_base(transcripts: list[tuple[str, str, str]]) -> str:
    """ナレッジベースのテキストを構築する"""
    sections = []

    sections.append("=" * 60)
    sections.append("戸塚博 発言記録集")
    sections.append("令和ヨットスクール YouTubeチャンネルより")
    sections.append("=" * 60)
    sections.append("")

    for video_id, title, content in transcripts:
        sections.append(f"--- 動画: {title} ---")
        sections.append(content)
        sections.append("")

    return "\n".join(sections)


def estimate_tokens(text: str) -> int:
    """おおよそのトークン数を推定（日本語: 約1.5文字/トークン）"""
    return int(len(text) / 1.5)


def main():
    print("ナレッジベースを構築中...")

    # 文字起こし読み込み
    transcripts = load_transcripts()
    if not transcripts:
        return

    print(f"  {len(transcripts)} 件の文字起こしを読み込みました。")

    # ナレッジベース構築
    knowledge = build_knowledge_base(transcripts)

    # トークン数推定
    estimated_tokens = estimate_tokens(knowledge)
    print(f"  推定トークン数: 約 {estimated_tokens:,} トークン")

    if estimated_tokens > 50000:
        print("  ⚠ トークン数が多いため、システムプロンプトに全文を含められない可能性があります。")
        print("  重要な発言を厳選するか、RAGの導入を検討してください。")

    # 保存
    KNOWLEDGE_BASE_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(KNOWLEDGE_BASE_FILE, "w", encoding="utf-8") as f:
        f.write(knowledge)

    print(f"\n保存完了: {KNOWLEDGE_BASE_FILE}")
    print(f"ファイルサイズ: {KNOWLEDGE_BASE_FILE.stat().st_size:,} bytes")


if __name__ == "__main__":
    main()
