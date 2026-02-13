import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { verifyOtp } from "@/lib/authTokens";
import type { ApiResponseDTO, VerifyEmailRequestDTO, VerifyEmailResponseDTO } from "@/types";
import { rateLimitOrThrow } from "@/lib/rateLimit";
import { handleApiError } from "@/lib/apiHandler";

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponseDTO<VerifyEmailResponseDTO>>> {
  try {
    await rateLimitOrThrow({
      request,
      keyPrefix: "rl:auth:verify-otp",
      points: 10,
      duration: 60,
    });

    const { email, otp }: VerifyEmailRequestDTO = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, error: "Email and OTP are required" },
        { status: 400 }
      );
    }

    const userResult = await db.queryAsync(
      `SELECT id, email_verified, otp_code_hash, otp_expires_at FROM users WHERE email = $1`,
      [email.toLowerCase()]
    );
    const user = userResult.rows[0];

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid email or OTP" },
        { status: 400 }
      );
    }

    if (user.email_verified) {
      return NextResponse.json({
        success: true,
        data: { message: "Email already verified" },
      });
    }

    if (!user.otp_code_hash || !user.otp_expires_at) {
      return NextResponse.json(
        { success: false, error: "OTP expired or missing" },
        { status: 400 }
      );
    }

    const expiresAt = new Date(user.otp_expires_at);
    if (expiresAt.getTime() < Date.now()) {
      return NextResponse.json(
        { success: false, error: "OTP expired" },
        { status: 400 }
      );
    }

    const isValid = await verifyOtp(otp, user.otp_code_hash);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Invalid OTP" },
        { status: 400 }
      );
    }

    await db.queryAsync(
      `UPDATE users SET email_verified = $1, otp_code_hash = $2, otp_expires_at = $3, updated_at = $4 WHERE id = $5`,
      [true, null, null, new Date(), user.id]
    );

    return NextResponse.json({
      success: true,
      data: { message: "Email verified successfully" },
    });
  } catch (error: unknown) {
    return handleApiError(error, request);
  }
}
