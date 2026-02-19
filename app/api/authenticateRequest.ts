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

  try {
    const { payload } = await jwtVerify(token, secret);
    const userId = Number(payload.userId);
    if (Number.isNaN(userId)) {
      throw new AuthRequestError("Token missing valid userId claim", 401);
    }
    return userId;
  } catch (err: unknown) {
    if (err instanceof AuthRequestError) throw err;
    throw new AuthRequestError("Invalid or expired authentication token", 401);
  }
}
