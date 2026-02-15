import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { generateOtp, getOtpExpiry, hashOtp } from "@/lib/authTokens";
import type { ApiResponseDTO, ResendOtpResponseDTO } from "@/types";
import { rateLimitOrThrow } from "@/lib/rateLimit";
import { handleApiError, parseRequestBody } from "@/lib/apiHandler";
import { resendOtpSchema } from "@/lib/validation/schemas";
import { sendTemplatedEmail } from "@/lib/email/service";

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponseDTO<ResendOtpResponseDTO>>> {
  try {
    await rateLimitOrThrow({
      request,
      keyPrefix: "rl:auth:resend-otp",
      points: 5,
      duration: 60,
    });

    const { email } = await parseRequestBody(request, resendOtpSchema);

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

    console.log("About to send email for OTP:", otp, "to", normalizedEmail);
    await sendTemplatedEmail({
      to: normalizedEmail,
      template: "verify-email",
      data: { otp },
    });

    return NextResponse.json({
      success: true,
      data: { message: "If the email exists, a new OTP has been sent" },
    });
  } catch (error: unknown) {
    return handleApiError(error, request);
  }
}
