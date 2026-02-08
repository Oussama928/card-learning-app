import { jwtVerify } from 'jose';
import { NextResponse } from 'next/server';

export async function authenticateRequest(request) {
  // Try Authorization header first
  let token = request.headers.get('authorization')?.replace('Bearer ', '');
  
  // Fallback to query param token (for SSE/WebSocket upgrades)
  if (!token) {
    const url = new URL(request.url);
    token = url.searchParams.get('token');
  }
  
  if (!token) {
    const error = new Error("Unauthorized - Missing authentication token");
    error.status = 401;
    error.json = { error: "Unauthorized", message: "Missing authentication token" };
    throw error;
  }

  let decoded;
  
  try {
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET || 'secret');
    const { payload } = await jwtVerify(token, secret);
    decoded = payload;
  } catch (error) {
    const authError = new Error("Unauthorized - Invalid or expired token");
    authError.status = 401;
    authError.json = { error: "Unauthorized", message: "Invalid or expired token" };
    throw authError;
  }

  const userId = decoded.userId;
  if (!userId) {
    const error = new Error("Unauthorized - Token missing userId");
    error.status = 401;
    error.json = { error: "Unauthorized", message: "Token missing userId claim" };
    throw error;
  }

  return userId;
}
