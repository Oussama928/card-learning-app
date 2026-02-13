import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import db from "@/lib/db";
import { hashResetToken } from "@/lib/authTokens";
import type {
  ApiResponseDTO,
  ResetPasswordRequestDTO,
  ResetPasswordResponseDTO,
} from "@/types";
import { rateLimitOrThrow } from "@/lib/rateLimit";
import { handleApiError } from "@/lib/apiHandler";

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponseDTO<ResetPasswordResponseDTO>>> {
  try {
    await rateLimitOrThrow({
      request,
      keyPrefix: "rl:auth:reset-password",
      points: 5,
      duration: 60,
    });

    const { token, password }: ResetPasswordRequestDTO = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { success: false, error: "Token and password are required" },
        { status: 400 }
      );
    }

    const tokenHash = hashResetToken(token);

    const userResult = await db.queryAsync(
      `SELECT id, reset_expires_at FROM users WHERE reset_token_hash = $1`,
      [tokenHash]
    );
    const user = userResult.rows[0];

    if (!user || !user.reset_expires_at) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    const expiresAt = new Date(user.reset_expires_at);
    if (expiresAt.getTime() < Date.now()) {
      return NextResponse.json(
        { success: false, error: "Reset token expired" },
        { status: 400 }
      );
    }

    const hashedPassword = await hash(password, 12);

    await db.queryAsync(
      `UPDATE users SET password = $1, reset_token_hash = $2, reset_expires_at = $3, updated_at = $4 WHERE id = $5`,
      [hashedPassword, null, null, new Date(), user.id]
    );

    return NextResponse.json({
      success: true,
      data: { message: "Password reset successfully" },
    });
  } catch (error: unknown) {
    return handleApiError(error, request);
  }
}
