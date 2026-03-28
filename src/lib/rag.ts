import fs from "fs";
import path from "path";
import OpenAI from "openai";

interface EmbeddingChunk {
  text: string;
  title: string;
  url: string;
  source: string;
  embedding: number[];
}

interface SearchResult {
  text: string;
  title: string;
  url: string;
  score: number;
}

const EMBEDDINGS_PATH = path.join(process.cwd(), "data", "embeddings.json");
const EMBEDDING_MODEL = "text-embedding-3-small";
const TOP_K = 8; // 返す関連チャンク数

let cachedChunks: EmbeddingChunk[] | null = null;

function loadEmbeddings(): EmbeddingChunk[] {
  if (cachedChunks) return cachedChunks;

  try {
    const data = fs.readFileSync(EMBEDDINGS_PATH, "utf-8");
    cachedChunks = JSON.parse(data);
    return cachedChunks!;
  } catch {
    console.warn("embeddings.json が見つかりません。RAGなしで動作します。");
    return [];
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function searchRelevantChunks(
  query: string
): Promise<SearchResult[]> {
  const chunks = loadEmbeddings();
  if (chunks.length === 0) return [];

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // クエリをEmbedding
  const response = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input: query,
  });

  const queryEmbedding = response.data[0].embedding;

  // コサイン類似度で検索
  const scored = chunks.map((chunk) => ({
    text: chunk.text,
    title: chunk.title,
    url: chunk.url,
    score: cosineSimilarity(queryEmbedding, chunk.embedding),
  }));

  // スコア順にソートしてTOP_K件返す
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, TOP_K);
}

export function formatSearchResults(results: SearchResult[]): string {
  if (results.length === 0) {
    return "（関連する発言記録が見つかりませんでした）";
  }

  const sections = results.map(
    (r) => `【動画: ${r.title}】\n${r.text}`
  );

  return sections.join("\n\n");
}
