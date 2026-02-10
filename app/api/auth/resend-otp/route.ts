import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { generateOtp, getOtpExpiry, hashOtp } from "@/lib/authTokens";
import type { ApiResponseDTO, ResendOtpRequestDTO, ResendOtpResponseDTO } from "@/types";

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponseDTO<ResendOtpResponseDTO>>> {
  try {
    const { email }: ResendOtpRequestDTO = await request.json();

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

    if (!user) {
      return NextResponse.json({
        success: true,
        data: { message: "If the email exists, a new OTP has been sent" },
      });
    }

    if (user.email_verified) {
      return NextResponse.json({
        success: true,
        data: { message: "Email already verified" },
      });
    }

    const otp = generateOtp();
    const otpHash = await hashOtp(otp);
    const otpExpiresAt = getOtpExpiry();

    await db.queryAsync(
      `UPDATE users SET otp_code_hash = $1, otp_expires_at = $2, updated_at = $3 WHERE id = $4`,
      [otpHash, otpExpiresAt, new Date(), user.id]
    );

    if (process.env.NODE_ENV === "development") {
      console.log(`[OTP] Resent verification code for ${normalizedEmail}: ${otp}`);
    }

    return NextResponse.json({
      success: true,
      data: { message: "If the email exists, a new OTP has been sent" },
    });
  } catch (error: unknown) {
    console.error("Resend OTP error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
