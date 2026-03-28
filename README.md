# 🏫 戸塚宏エージェント

> 令和ヨットスクールYouTubeチャンネルの文字起こしをもとに、戸塚宏のキャラクターで会話するAIチャットエージェント

**Tech Stack:** Next.js 15 (App Router) + OpenAI GPT-4o + RAG (Retrieval-Augmented Generation)

---

## デモ画面

### ログイン画面
```
┌──────────────────────────────────────┐
│  🏫 戸塚宏エージェント               │
├──────────────────────────────────────┤
│                                      │
│              🧓                      │
│         戸塚宏エージェント            │
│      パスワードを入力してください     │
│                                      │
│   ┌──────────────────────────────┐  │
│   │ パスワード                    │  │
│   └──────────────────────────────┘  │
│                                      │
│   ┌──────────────────────────────┐  │
│   │         入室する              │  │
│   └──────────────────────────────┘  │
└──────────────────────────────────────┘
```

### チャット画面（会話例）

**ユーザー:** 教育についてどう思いますか？

**戸塚宏:** 今の日本の教育はな、甘すぎるんだよ。子供が何か悪いことしても注意もされず、親も叱らない。それじゃあ子供は自分の行動の責任を学べないだろう。教育ってのはただ優しくすることじゃねえ、時には厳しく、一緒に悩んで、成長を手助けするもんなんだ。

それに学校もなんだか無機質だ。教科書の内容を覚えてテストで点を取る、それだけが教育じゃない。人生にはもっと大事なことがある。嘘が通用しない自然の中で学ぶことや、自分で物事を考えて行動する力を育てることが必要だ。

俺がやってるヨットスクールじゃ、海に出て自然と向き合う。そうすることで本当の自分と向き合えるんだ。これが本来の教育だと俺は信じてる。

---

**ユーザー:** 仏教についてどう思いますか？

**戸塚宏:** 仏教はね、単なる宗教や哲学じゃなくて、科学なんだよ。お釈迦様が苦しみをどうやって解消するかを解明しようとして、そうした科学的なアプローチを取ったんだ。仏教の目的は、シハックから逃れて、正しい苦を発生させることなんだ。それに成功すれば人間はより強くなれる。それが仏教の真髄だと思っているよ。宗教として金儲けに使われるのは違うと思うね。仏教は自分で自分を助ける教えなんだから。

---

## このプロジェクトができるまで ── 開発セッション全記録

このプロジェクトは Claude Code との1セッションで、要件定義から実装・RAG導入・GitHub公開まで一気に完成しました。以下はそのやりとりの全記録です。

---

### Step 1. アイデアを伝える

**ユーザー:**
> 令和ヨットスクールというYouTubeチャンネルがあるのですが、そこで出ているおじいちゃん（戸塚さん）と会話をしているような、その人が話しそうなことでしっかり会話をしてくれるAIエージェントを作りたい。要件定義・基本設計・詳細設計・技術要件・テスト指示書の5つを作ってほしいが、その前に足りない情報があれば逆質問してください。

**Claude が逆質問した内容:**
- エージェントの提供形態は？ → **Webアプリ（チャットUI）**
- 戸塚さんの学習データはどう用意する？ → **YouTube動画の文字起こし**
- ユーザーは誰？ → **身内・少人数**
- 技術スタックの希望は？ → **わからない、おまかせ**
- 文字起こしデータはある？ → **全くない、何とかしたい**
- キャラとして重視したいポイントは？ → **口調・思想の両方バランスよく**
- ガードレールは？ → **特になし、本人に忠実に**
- ホスティングは？ → **おまかせ**

---

### Step 2. 設計書5点を作成

以下の設計書を `docs/` フォルダに生成:

| ファイル | 内容 |
|---------|------|
| `01_要件定義書.md` | 目的、機能要件、非機能要件、ユースケース |
| `02_基本設計書.md` | システム構成図、画面設計、API設計、データ設計 |
| `03_詳細設計書.md` | ディレクトリ構成、コンポーネント設計、システムプロンプト設計 |
| `04_技術要件書.md` | 技術スタック、環境構築手順、Claude APIコスト見積もり |
| `05_テスト指示書.md` | テスト項目30項目以上、受け入れ基準 |

**設計のポイント:**
- YouTube文字起こしは `youtube-transcript-api`（APIキー不要）+ `yt-dlp` で自動取得
- 技術スタック: Next.js + OpenAI API + Vercel（無料枠で運用可能）
- 月間コスト: 約$12〜18/月（1日20回利用の場合）

---

### Step 3. 「作ってください。作り終えるまで動きを止めないでください」

ここから一気に実装。作成したファイル一覧:

#### アプリケーション本体
```
src/
├── app/
│   ├── page.tsx                    # メインページ
│   ├── layout.tsx                  # ルートレイアウト
│   ├── globals.css                 # グローバルスタイル
│   └── api/
│       ├── chat/route.ts           # チャットAPI（ストリーミング）
│       └── auth/
│           ├── route.ts            # 認証API
│           └── check/route.ts      # 認証状態確認API
├── components/
│   ├── ChatWindow.tsx              # チャット全体の状態管理
│   ├── MessageBubble.tsx           # メッセージ吹き出し
│   ├── MessageInput.tsx            # 入力欄（Enter送信/Shift+Enter改行）
│   ├── LoginForm.tsx               # パスワードログイン
│   └── Header.tsx                  # ヘッダー（会話クリアボタン付き）
├── lib/
│   ├── claude.ts                   # OpenAI APIクライアント（ストリーミング）
│   ├── prompt.ts                   # システムプロンプト構築
│   ├── rag.ts                      # RAGベクトル検索
│   ├── auth.ts                     # 認証ユーティリティ（HMAC）
│   └── rate-limit.ts               # レート制限（1分10回）
└── types/index.ts                  # 型定義
```

#### データ収集スクリプト
```
scripts/
├── fetch_transcripts.py            # YouTube字幕自動取得
├── build_knowledge.py              # ナレッジベース構築
├── compress_knowledge.py           # ナレッジベース圧縮
├── build_embeddings.py             # OpenAI Embeddingsでベクトル化
└── requirements.txt
```

**ビルド結果:**
```
Route (app)
┌ ○ /
├ ○ /_not-found
├ ƒ /api/auth
├ ƒ /api/auth/check
└ ƒ /api/chat
✓ ビルド成功
```

---

### Step 4. OpenAIに変更 & APIキーの取り扱い注意

**ユーザー:** 「openaiでやりたい！ APIキーこれ！！ sk-proj-...」

**Claude:** ⚠️ **APIキーをチャットに貼らないでください！** 第三者に見られると不正利用されます。今すぐ https://platform.openai.com/api-keys でRevokeしてください。

→ Anthropic SDK を OpenAI SDK に差し替え（`@anthropic-ai/sdk` → `openai`）、モデルを `gpt-4o` に変更。

---

### Step 5. 動作確認

ログイン画面が表示され、パスワード `totsuka` でチャット画面へ。

**最初のテスト（APIキーなしの状態）:**
- 「ちょっと調子が悪いな。もう一回聞いてくれ。」← キャラ内エラーメッセージが機能

**APIキー設定後のテスト:**
- 「今の日本の教育についてどう思いますか？」→ 戸塚さんらしい回答が返ってきた ✅
- ストリーミング表示（文字が逐次表示される）✅
- キャラクターの口調（「〜だよ」「〜だろう」「〜なんだ」）✅

---

### Step 6. RAGって何？という話

**ユーザー:** 「これRAGはどういう仕組になってますか？？」

**Claude の説明:**

> 現時点ではRAGは入っていません。`knowledge_base.txt` を丸ごとシステムプロンプトに埋め込んでいるだけです。データが増えるとトークン数が跳ね上がりコストが問題になります。

**今のままで大丈夫な理由:** データが少ない段階では全文埋め込みで十分。

**RAGを入れるとしたら:**
```
ユーザーの質問
    ↓
① Embedding APIでベクトル化
    ↓
② 関連する発言だけを検索
    ↓
③ 関連発言のみをプロンプトに含めGPT-4oへ
```

---

### Step 7. 文字起こし取得

**ユーザー:** 「ちゃんと文字起こし、してる？」

**Claude:** してないです！ まずPythonスクリプトを動かします。

**問題1:** チャンネルURL `@reiwa_yacht_school` が間違い
→ `yt-dlp` で検索して正しいURLを発見:
`https://www.youtube.com/channel/UCwHnTIu0lp_5uS5OJw55vOQ`

**問題2:** `youtube-transcript-api` の新バージョンでAPIが変わっていた
→ `YouTubeTranscriptApi.list_transcripts()` → `YouTubeTranscriptApi().fetch(video_id, languages=["ja"])` に修正

**問題3:** Python 3.9 では `str | None` 構文が使えない
→ `from __future__ import annotations` を追加

**取得結果:**
```
チャンネルの動画一覧を取得中
  301 件の動画が見つかりました。
（年齢制限なし動画のみ字幕取得可能）

===== 完了 =====
成功: 35 件
字幕なし（年齢制限等）: 266 件
```

**ナレッジベース:**
```
35 件の文字起こしを読み込みました。
推定トークン数: 約 117,398 トークン
⚠ トークン数が多い → 圧縮が必要
```

---

### Step 8. RAGを実装

全文ベタ貼りだとトークン数が多すぎ、毎回 $0.05〜0.10 かかることが判明。
→ **RAG（Retrieval-Augmented Generation）を実装**

#### 仕組み

```
【事前準備】
文字起こし(35動画)
    ↓ 20行ごとにチャンク分割
401チャンク
    ↓ OpenAI text-embedding-3-small
embeddings.json (12.5MB) に保存

【会話時】
ユーザーの質問
    ↓ Embedding APIでベクトル化
    ↓ コサイン類似度で上位8チャンクを検索
関連する戸塚さんの発言だけ取得
    ↓
システムプロンプト = キャラ定義 + 関連発言8件
    ↓
GPT-4o で回答生成（ストリーミング）
```

**Embedding 実行結果:**
```
401 チャンクに分割
Embedding batch 1/9 ~ 9/9...
401 チャンクの Embedding 生成完了
ファイルサイズ: 12.5 MB
```

**RAG動作確認:**

> ユーザー: 「仏教についてどう思いますか？」

> 戸塚宏: 「仏教はね、単なる宗教や哲学じゃなくて、科学なんだよ。お釈迦様が苦しみをどうやって解消するかを解明しようとして...」

← 実際の動画（仏教回）の内容に基づいた回答 ✅

**コスト比較:**
| 方式 | 1リクエストあたりトークン | 概算コスト |
|------|----------------------|----------|
| 全文ベタ貼り | ~120,000 tokens | ~$0.06 |
| RAG（8チャンク） | ~5,000 tokens | ~$0.003 |
| **削減率** | | **約95%削減** |

---

### Step 9. GitHubへ公開

APIキーをマスク、大容量ファイルを `.gitignore` に追加してpush。

**`.gitignore` に追加したもの:**
- `.env*.local` — APIキー含むため
- `data/embeddings.json` — 12.5MB
- `data/transcripts/` — 文字起こし生データ
- `data/metadata.json` — 動画一覧

---

## セットアップ手順

### 1. リポジトリをクローン

```bash
git clone https://github.com/bunta-ishiwata/totsukaagent.git
cd totsukaagent
```

### 2. 依存関係インストール

```bash
npm install
```

### 3. 環境変数を設定

```bash
cp .env.example .env.local
```

`.env.local` を編集:
```env
OPENAI_API_KEY=sk-proj-your-key-here
AUTH_PASSWORD=your-password
SESSION_SECRET=your-random-secret
```

### 4. 文字起こしデータを取得（初回のみ）

```bash
cd scripts
pip install -r requirements.txt

# YouTube字幕を取得（令和ヨットスクール 301動画）
python fetch_transcripts.py

# Embeddingを生成（OpenAI API使用 / 数分かかる）
python build_embeddings.py
```

### 5. 開発サーバー起動

```bash
cd ..
npm run dev
```

→ http://localhost:3000 にアクセス

---

## アーキテクチャ

```
ブラウザ (Next.js React)
    │
    │ HTTPS
    ▼
Vercel (Next.js App Router)
    ├── /api/auth          パスワード認証（httpOnly Cookie）
    ├── /api/auth/check    認証状態確認
    └── /api/chat          チャット（ストリーミング）
              │
     ┌────────┴──────────┐
     ▼                   ▼
OpenAI GPT-4o      embeddings.json
(ストリーミング)    (ベクトル検索)
     ▲                   │
     │         関連発言8件を取得
     └────────────────────┘
    システムプロンプト = キャラ定義 + 関連発言
```

---

## ファイル構成

```
totsukaagent/
├── src/
│   ├── app/
│   │   ├── page.tsx
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   └── api/
│   │       ├── chat/route.ts        # GPT-4o ストリーミング
│   │       └── auth/
│   │           ├── route.ts
│   │           └── check/route.ts
│   ├── components/
│   │   ├── ChatWindow.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── MessageInput.tsx
│   │   ├── LoginForm.tsx
│   │   └── Header.tsx
│   ├── lib/
│   │   ├── claude.ts               # OpenAI API + RAG統合
│   │   ├── rag.ts                  # コサイン類似度ベクトル検索
│   │   ├── prompt.ts               # システムプロンプト構築
│   │   ├── auth.ts                 # HMAC認証トークン
│   │   └── rate-limit.ts           # レート制限
│   └── types/index.ts
├── scripts/
│   ├── fetch_transcripts.py        # YouTube字幕取得
│   ├── build_knowledge.py          # ナレッジベース構築
│   ├── compress_knowledge.py       # ナレッジベース圧縮
│   ├── build_embeddings.py         # Embedding生成
│   └── requirements.txt
├── data/
│   └── knowledge_base.txt          # サンプルナレッジ（gitで管理）
│   # ↓ 以下は .gitignore（手元で生成してください）
│   # transcripts/                  # 35動画の文字起こし
│   # embeddings.json               # 401チャンク × ベクトル (12.5MB)
│   # metadata.json                 # 動画メタ情報
├── docs/
│   ├── 01_要件定義書.md
│   ├── 02_基本設計書.md
│   ├── 03_詳細設計書.md
│   ├── 04_技術要件書.md
│   └── 05_テスト指示書.md
├── .env.example
└── .gitignore
```

---

## デプロイ（Vercel）

1. [Vercel](https://vercel.com) でこのリポジトリをインポート
2. 環境変数を設定:
   - `OPENAI_API_KEY`
   - `AUTH_PASSWORD`
   - `SESSION_SECRET`
3. `data/embeddings.json` はサーバーサイドで読み込むため、ビルド前に `scripts/build_embeddings.py` を実行してからデプロイするか、Vercel のビルドコマンドに追加する

---

## 注意事項

- このプロジェクトは**身内・少人数利用**を想定しています
- OpenAI APIの利用料金が発生します（RAG導入により1リクエスト約$0.003）
- YouTubeの年齢制限動画は字幕取得不可（301動画中35動画のみ取得可能）
- APIキーは絶対にチャットや公開リポジトリに貼らないでください

---

## License

MIT
