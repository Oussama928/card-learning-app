import { hash } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import db from "../../../lib/db";
import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";
import {
  generateOtp,
  getOtpExpiry,
  hashOtp,
} from "../../../lib/authTokens";
import type {
  ApiResponseDTO,
  SignupResponseDTO,
} from "@/types";

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponseDTO<SignupResponseDTO>>> {
  try {
    const formData = await request.formData();

    const email = (formData.get("email") as string)?.trim().toLowerCase();
    const username = (formData.get("username") as string)?.trim();
    const password = (formData.get("password") as string)?.trim();
    const photoFile = formData.get("photo") as Blob | null;

    if (!email || !username || !password) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const existingEmailResult = await db.queryAsync(
      `SELECT id, email_verified, username FROM users WHERE email = $1`,
      [email]
    );
    const existingEmailUser = existingEmailResult.rows[0];

    const existingUsernameResult = await db.queryAsync(
      `SELECT id FROM users WHERE username = $1 AND email <> $2`,
      [username, email]
    );
    const existingUsernameUser = existingUsernameResult.rows[0];

    if (existingUsernameUser) {
      return NextResponse.json(
        { success: false, error: "Username already exists" },
        { status: 409 }
      );
    }

    if (existingEmailUser && existingEmailUser.email_verified) {
      return NextResponse.json(
        { success: false, error: "User already exists" },
        { status: 409 }
      );
    }

    let photoUrl: string | null = null;
    if (photoFile instanceof Blob) {
      try {
        const buffer = Buffer.from(await photoFile.arrayBuffer());
        const processedImage = await sharp(buffer)
          .resize(500, 500)
          .webp()
          .toBuffer();

        const photoName = `${uuidv4()}.webp`;
        const uploadDir = path.join(process.cwd(), "public/uploads");
        await fs.mkdir(uploadDir, { recursive: true });
        const photoPath = path.join(uploadDir, photoName);
        await fs.writeFile(photoPath, processedImage);
        photoUrl = `/uploads/${photoName}`;
      } catch (error: unknown) {
        console.error("Error processing image:", error);
        return NextResponse.json(
          {
            success: false,
            error: error instanceof Error ? error.message : "Failed to process image",
          },
          { status: 500 }
        );
      }
    }

    const otp = generateOtp();
    const otpHash = await hashOtp(otp);
    const otpExpiresAt = getOtpExpiry();

    let userId: string | number | undefined;

    if (existingEmailUser) {
      await db.queryAsync(
        `UPDATE users SET otp_code_hash = $1, otp_expires_at = $2, updated_at = $3 WHERE id = $4`,
        [otpHash, otpExpiresAt, new Date(), existingEmailUser.id]
      );
      userId = existingEmailUser.id;
    } else {
      const hashedPassword = await hash(password, 12);

      const result = await db.queryAsync(
        `INSERT INTO users 
         (email, password, username, image, created_at, updated_at, email_verified, otp_code_hash, otp_expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id`,
        [
          email,
          hashedPassword,
          username,
          photoUrl,
          new Date(),
          new Date(),
          false,
          otpHash,
          otpExpiresAt,
        ]
      );
      userId = result.rows[0].id;
    }

    if (process.env.NODE_ENV === "development") {
      console.log(`[OTP] Email verification code for ${email}: ${otp}`);
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          message: "Verification code sent to email",
          userId: userId?.toString(),
          email,
          requiresVerification: true,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Signup error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
