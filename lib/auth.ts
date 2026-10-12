import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Constant-time comparison of a presented token against MCP_SECRET.
 * Both sides are SHA-256 hashed first so the comparison never leaks length.
 */
export function isValidSecret(presented: string | null | undefined, secret = process.env.MCP_SECRET): boolean {
  if (!secret || secret.length < 16 || !presented) return false;
  const a = createHash("sha256").update(presented).digest();
  const b = createHash("sha256").update(secret).digest();
  return timingSafeEqual(a, b);
}

export function bearerToken(req: Request): string | null {
  const h = req.headers.get("authorization") ?? "";
  const m = /^Bearer\s+(.+)$/i.exec(h.trim());
  return m ? m[1].trim() : null;
}
