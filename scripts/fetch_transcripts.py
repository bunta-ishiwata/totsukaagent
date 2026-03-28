"""
令和ヨットスクール YouTube チャンネルから文字起こしデータを取得するスクリプト

使い方:
  pip install -r requirements.txt
  python fetch_transcripts.py

チャンネルの動画一覧を取得し、各動画の字幕（文字起こし）を
data/transcripts/ に保存します。
"""

from __future__ import annotations

import json
import os
import re
import subprocess
import sys
from pathlib import Path
from typing import Optional, List, Dict, Tuple

try:
    from youtube_transcript_api import YouTubeTranscriptApi
except ImportError:
    print("youtube-transcript-api がインストールされていません。")
    print("pip install -r requirements.txt を実行してください。")
    sys.exit(1)


# 令和ヨットスクール チャンネルURL
CHANNEL_URL = "https://www.youtube.com/channel/UCwHnTIu0lp_5uS5OJw55vOQ"

# 保存先ディレクトリ
PROJECT_ROOT = Path(__file__).resolve().parent.parent
TRANSCRIPTS_DIR = PROJECT_ROOT / "data" / "transcripts"
METADATA_FILE = PROJECT_ROOT / "data" / "metadata.json"


def get_video_list(channel_url: str) -> list[dict]:
    """yt-dlp を使ってチャンネルの動画一覧を取得する"""
    print(f"チャンネルの動画一覧を取得中: {channel_url}")

    try:
        result = subprocess.run(
            [
                "yt-dlp",
                "--flat-playlist",
                "--dump-json",
                "--no-warnings",
                channel_url,
            ],
            capture_output=True,
            text=True,
            timeout=120,
        )
    except FileNotFoundError:
        print("yt-dlp がインストールされていません。")
        print("pip install yt-dlp を実行してください。")
        sys.exit(1)
    except subprocess.TimeoutExpired:
        print("タイムアウトしました。ネットワーク接続を確認してください。")
        sys.exit(1)

    videos = []
    for line in result.stdout.strip().split("\n"):
        if not line:
            continue
        try:
            data = json.loads(line)
            videos.append(
                {
                    "id": data.get("id", ""),
                    "title": data.get("title", "不明"),
                    "url": f"https://www.youtube.com/watch?v={data.get('id', '')}",
                    "upload_date": data.get("upload_date", ""),
                }
            )
        except json.JSONDecodeError:
            continue

    print(f"  {len(videos)} 件の動画が見つかりました。")
    return videos


def fetch_transcript(video_id: str) -> Optional[str]:
    """動画の文字起こし（字幕）を取得する"""
    try:
        api = YouTubeTranscriptApi()
        snippets = api.fetch(video_id, languages=["ja"])

        lines = []
        for snippet in snippets:
            text = snippet.text.strip()
            if text:
                start = snippet.start
                minutes = int(start // 60)
                seconds = int(start % 60)
                lines.append(f"[{minutes:02d}:{seconds:02d}] {text}")

        if not lines:
            return None

        return "\n".join(lines)

    except Exception as e:
        print(f"  字幕取得エラー (video_id={video_id}): {e}")
        return None


def sanitize_filename(title: str) -> str:
    """ファイル名に使えない文字を除去する"""
    sanitized = re.sub(r'[\\/*?:"<>|]', "", title)
    sanitized = sanitized.strip()
    return sanitized[:100] if len(sanitized) > 100 else sanitized


def main():
    # ディレクトリ作成
    TRANSCRIPTS_DIR.mkdir(parents=True, exist_ok=True)

    # 既存のメタデータを読み込み（重複チェック用）
    existing_ids = set()
    if METADATA_FILE.exists():
        with open(METADATA_FILE, "r", encoding="utf-8") as f:
            existing_metadata = json.load(f)
            existing_ids = {v["id"] for v in existing_metadata}

    # 動画一覧取得
    videos = get_video_list(CHANNEL_URL)
    if not videos:
        print("動画が見つかりませんでした。チャンネルURLを確認してください。")
        print(f"現在のURL: {CHANNEL_URL}")
        print("正しいURLに変更するには、このスクリプトの CHANNEL_URL を編集してください。")
        return

    # 文字起こし取得
    metadata = []
    success_count = 0
    skip_count = 0
    fail_count = 0

    for i, video in enumerate(videos, 1):
        video_id = video["id"]
        title = video["title"]
        print(f"[{i}/{len(videos)}] {title}")

        # 既存チェック
        if video_id in existing_ids:
            filepath = TRANSCRIPTS_DIR / f"{video_id}.txt"
            if filepath.exists():
                print("  → スキップ（取得済み）")
                skip_count += 1
                metadata.append(video)
                continue

        # 文字起こし取得
        transcript = fetch_transcript(video_id)
        if transcript is None:
            print("  → 字幕なし、スキップ")
            fail_count += 1
            video["has_transcript"] = False
            metadata.append(video)
            continue

        # ファイル保存
        filepath = TRANSCRIPTS_DIR / f"{video_id}.txt"
        header = f"# 動画タイトル: {title}\n"
        header += f"# 動画URL: {video['url']}\n"
        header += f"# 公開日: {video.get('upload_date', '不明')}\n"
        header += f"# 動画ID: {video_id}\n\n"

        with open(filepath, "w", encoding="utf-8") as f:
            f.write(header + transcript)

        print(f"  → 保存完了: {filepath.name}")
        success_count += 1
        video["has_transcript"] = True
        metadata.append(video)

    # メタデータ保存
    with open(METADATA_FILE, "w", encoding="utf-8") as f:
        json.dump(metadata, f, ensure_ascii=False, indent=2)

    print("\n===== 完了 =====")
    print(f"成功: {success_count} 件")
    print(f"スキップ（既存）: {skip_count} 件")
    print(f"字幕なし: {fail_count} 件")
    print(f"メタデータ: {METADATA_FILE}")
    print(f"文字起こし: {TRANSCRIPTS_DIR}")


if __name__ == "__main__":
    main()
