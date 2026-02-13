import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { generateResetToken, hashResetToken } from "@/lib/authTokens";
import type {
  ApiResponseDTO,
  ForgotPasswordRequestDTO,
  ForgotPasswordResponseDTO,
} from "@/types";
import { rateLimitOrThrow } from "@/lib/rateLimit";
import { handleApiError } from "@/lib/apiHandler";

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponseDTO<ForgotPasswordResponseDTO>>> {
  try {
    await rateLimitOrThrow({
      request,
      keyPrefix: "rl:auth:forgot-password",
      points: 5,
      duration: 60,
    });

    const { email }: ForgotPasswordRequestDTO = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase();

    const userResult = await db.queryAsync(
      `SELECT id, email_verified FROM users WHERE email = $1`,
      [normalizedEmail]
    );
    const user = userResult.rows[0];

    if (!user || !user.email_verified) {
      return NextResponse.json({
        success: true,
        data: { message: "If the email exists, a reset link has been sent" },
      });
    }

    const { token, expiresAt } = generateResetToken();
    const tokenHash = hashResetToken(token);

    await db.queryAsync(
      `UPDATE users SET reset_token_hash = $1, reset_expires_at = $2, updated_at = $3 WHERE id = $4`,
      [tokenHash, expiresAt, new Date(), user.id]
    );

    if (process.env.NODE_ENV === "development") {
      const appUrl = process.env.APP_URL || "http://localhost:3000";
      const resetLink = `${appUrl}/reset-password/${token}`;
      console.log(`[RESET] Password reset link for ${normalizedEmail}: ${resetLink}`);
    }

    return NextResponse.json({
      success: true,
      data: { message: "If the email exists, a reset link has been sent" },
    });
  } catch (error: unknown) {
    return handleApiError(error, request);
  }
}
