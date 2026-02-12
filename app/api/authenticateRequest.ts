import { jwtVerify } from "jose";
import type { NextRequest } from "next/server";

export class AuthRequestError extends Error {
  status: number;
  json: { error: string; message: string };

  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
    this.json = { error: "Unauthorized", message };
  }
}

export async function authenticateRequest(request: NextRequest): Promise<number> {
  let token = request.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) {
    const url = new URL(request.url);
    token = url.searchParams.get("token") ?? undefined;
  }

  if (!token) {
    throw new AuthRequestError("Missing authentication token", 401);
  }

  const secret = new TextEncoder().encode(process.env.AUTH_SECRET || "secret");

  let payload: Record<string, unknown>;

  try {
    const verified = await jwtVerify(token, secret);
    payload = verified.payload;
  } catch {
    throw new AuthRequestError("Invalid or expired token", 401);
  }

  const userId = Number(payload.userId);
  if (Number.isNaN(userId)) {
    throw new AuthRequestError("Token missing userId claim", 401);
  }

  return userId;
}
