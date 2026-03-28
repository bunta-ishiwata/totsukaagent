import { cookies } from "next/headers";
import crypto from "crypto";

const AUTH_PASSWORD = process.env.AUTH_PASSWORD || "";
const SESSION_SECRET = process.env.SESSION_SECRET || "default-secret";
const TOKEN_COOKIE_NAME = "totsuka_session";

export function generateToken(): string {
  const payload = Date.now().toString() + crypto.randomBytes(16).toString("hex");
  const hmac = crypto.createHmac("sha256", SESSION_SECRET);
  hmac.update(payload);
  return payload + "." + hmac.digest("hex");
}

export function verifyToken(token: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payload, signature] = parts;
  const hmac = crypto.createHmac("sha256", SESSION_SECRET);
  hmac.update(payload);
  return hmac.digest("hex") === signature;
}

export function checkPassword(password: string): boolean {
  if (!AUTH_PASSWORD) return false;
  return password === AUTH_PASSWORD;
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(TOKEN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

export async function getSessionToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(TOKEN_COOKIE_NAME)?.value;
}

export async function isAuthenticated(): Promise<boolean> {
  const token = await getSessionToken();
  if (!token) return false;
  return verifyToken(token);
}
