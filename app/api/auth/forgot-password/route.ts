import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { generateResetToken, hashResetToken } from "@/lib/authTokens";
import type {
  ApiResponseDTO,
  ForgotPasswordResponseDTO,
} from "@/types";
import { rateLimitOrThrow } from "@/lib/rateLimit";
import { handleApiError, parseRequestBody, AppError } from "@/lib/apiHandler";
import { forgotPasswordSchema } from "@/lib/validation/schemas";
import { sendTemplatedEmail } from "@/lib/email/service";

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

    const body = await request.json();
    console.log("Request body:", body);

    const result = forgotPasswordSchema.safeParse(body);
    if (!result.success) {
      console.log("Validation error:", result.error.issues);
      throw new AppError("Invalid request body", 400, result.error.issues[0]?.message);
    }

    const { email } = result.data;

    const normalizedEmail = email.toLowerCase();

    const userResult = await db.queryAsync(
      `SELECT id, email_verified FROM users WHERE email = $1`,
      [normalizedEmail]
    );
    const user = userResult.rows[0];

    if (!user) {
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

    await sendTemplatedEmail({
      to: normalizedEmail,
      template: "password-reset",
      data: { token },
    });
    console.error("sendTemplatedEmail returned for:", normalizedEmail);

    return NextResponse.json({
      success: true,
      data: { message: "If the email exists, a reset link has been sent" },
    });
  } catch (error: unknown) {
    return handleApiError(error, request);
  }
}
