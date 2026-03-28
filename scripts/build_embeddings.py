"""
文字起こしデータをチャンク分割し、OpenAI Embeddings でベクトル化して保存するスクリプト

使い方:
  export OPENAI_API_KEY=sk-proj-xxxxx
  python build_embeddings.py

data/transcripts/ の文字起こしを読み込み、
data/embeddings.json にベクトルデータを保存します。
"""

from __future__ import annotations

import json
import os
import sys
import time
from pathlib import Path
from typing import List, Dict

try:
    import openai
except ImportError:
    print("openai パッケージがインストールされていません。")
    print("pip install openai を実行してください。")
    sys.exit(1)

PROJECT_ROOT = Path(__file__).resolve().parent.parent
TRANSCRIPTS_DIR = PROJECT_ROOT / "data" / "transcripts"
EMBEDDINGS_FILE = PROJECT_ROOT / "data" / "embeddings.json"

# チャンク設定
CHUNK_LINES = 20  # 1チャンクあたりの行数
CHUNK_OVERLAP = 5  # チャンク間のオーバーラップ行数

# Embedding モデル
EMBEDDING_MODEL = "text-embedding-3-small"


def load_transcripts() -> List[Dict]:
    """文字起こしファイルを読み込んでチャンクに分割する"""
    chunks = []

    files = sorted(TRANSCRIPTS_DIR.glob("*.txt"))
    if not files:
        print("文字起こしファイルが見つかりません。")
        print("先に fetch_transcripts.py を実行してください。")
        return chunks

    for filepath in files:
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()

        lines = content.split("\n")

        # ヘッダーからメタ情報を取得
        title = "不明"
        video_url = ""
        for line in lines:
            if line.startswith("# 動画タイトル:"):
                title = line.replace("# 動画タイトル:", "").strip()
            elif line.startswith("# 動画URL:"):
                video_url = line.replace("# 動画URL:", "").strip()

        # タイムスタンプ行だけ抽出
        body_lines = [l for l in lines if l.startswith("[")]
        if not body_lines:
            continue

        # チャンク分割
        i = 0
        while i < len(body_lines):
            chunk_lines = body_lines[i : i + CHUNK_LINES]
            chunk_text = "\n".join(chunk_lines)

            chunks.append(
                {
                    "text": chunk_text,
                    "title": title,
                    "url": video_url,
                    "source": filepath.stem,
                }
            )

            i += CHUNK_LINES - CHUNK_OVERLAP

    return chunks


def embed_chunks(chunks: List[Dict], api_key: str) -> List[Dict]:
    """OpenAI Embeddings API でチャンクをベクトル化する"""
    client = openai.OpenAI(api_key=api_key)

    # バッチ処理（一度に最大100件）
    batch_size = 50
    all_embeddings = []

    for i in range(0, len(chunks), batch_size):
        batch = chunks[i : i + batch_size]
        texts = [c["text"] for c in batch]

        print(f"  Embedding batch {i // batch_size + 1}/{(len(chunks) - 1) // batch_size + 1} ({len(texts)} chunks)...")

        try:
            response = client.embeddings.create(
                model=EMBEDDING_MODEL,
                input=texts,
            )

            for j, embedding_data in enumerate(response.data):
                chunk = batch[j].copy()
                chunk["embedding"] = embedding_data.embedding
                all_embeddings.append(chunk)

        except Exception as e:
            print(f"  Embedding エラー: {e}")
            # リトライ
            time.sleep(2)
            try:
                response = client.embeddings.create(
                    model=EMBEDDING_MODEL,
                    input=texts,
                )
                for j, embedding_data in enumerate(response.data):
                    chunk = batch[j].copy()
                    chunk["embedding"] = embedding_data.embedding
                    all_embeddings.append(chunk)
            except Exception as e2:
                print(f"  リトライも失敗: {e2}")
                continue

        # レート制限対策
        time.sleep(0.5)

    return all_embeddings


def main():
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        # .env.local からも読む
        env_file = PROJECT_ROOT / ".env.local"
        if env_file.exists():
            with open(env_file, "r") as f:
                for line in f:
                    line = line.strip()
                    if line.startswith("OPENAI_API_KEY="):
                        api_key = line.split("=", 1)[1].strip()
                        break

    if not api_key:
        print("OPENAI_API_KEY が設定されていません。")
        print("export OPENAI_API_KEY=sk-proj-xxx を実行してください。")
        sys.exit(1)

    print("文字起こしデータを読み込み・チャンク分割中...")
    chunks = load_transcripts()
    if not chunks:
        return

    print(f"  {len(chunks)} チャンクに分割しました。")

    print("\nEmbedding を生成中...")
    embedded = embed_chunks(chunks, api_key)
    print(f"  {len(embedded)} チャンクの Embedding を生成しました。")

    # 保存
    EMBEDDINGS_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(EMBEDDINGS_FILE, "w", encoding="utf-8") as f:
        json.dump(embedded, f, ensure_ascii=False)

    file_size = EMBEDDINGS_FILE.stat().st_size
    print(f"\n保存完了: {EMBEDDINGS_FILE}")
    print(f"ファイルサイズ: {file_size:,} bytes ({file_size / 1024 / 1024:.1f} MB)")


if __name__ == "__main__":
    main()
