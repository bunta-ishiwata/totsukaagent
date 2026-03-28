import { NextRequest, NextResponse } from "next/server";
import { checkPassword, generateToken, setSessionCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { success: false, error: "パスワードを入力してください" },
        { status: 400 }
      );
    }

    if (!checkPassword(password)) {
      return NextResponse.json(
        { success: false, error: "パスワードが正しくありません" },
        { status: 401 }
      );
    }

    const token = generateToken();
    await setSessionCookie(token);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: "認証エラーが発生しました" },
      { status: 500 }
    );
  }
}
