import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { streamChat } from "@/lib/claude";
import { ChatRequest } from "@/types";

export async function POST(request: NextRequest) {
  // 認証チェック
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json(
      { error: "認証が必要です" },
      { status: 401 }
    );
  }

  // レート制限
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  if (!checkRateLimit(ip)) {
    return new Response(
      `data: ${JSON.stringify({ text: "そう急ぐな。少し落ち着いてから聞け。" })}\n\ndata: [DONE]\n\n`,
      {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      }
    );
  }

  try {
    const body: ChatRequest = await request.json();

    if (!body.messages || !Array.isArray(body.messages)) {
      return NextResponse.json(
        { error: "メッセージが必要です" },
        { status: 400 }
      );
    }

    const stream = await streamChat(body.messages);

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(
      `data: ${JSON.stringify({ text: "ちょっと調子が悪いな。もう一回聞いてくれ。" })}\n\ndata: [DONE]\n\n`,
      {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      }
    );
  }
}
