import { createHash, randomBytes } from "crypto";
import { hash, compare } from "bcryptjs";

export const OTP_LENGTH = 6;

export function generateOtp(): string {
  const min = 10 ** (OTP_LENGTH - 1);
  const max = 10 ** OTP_LENGTH - 1;
  return Math.floor(min + Math.random() * (max - min + 1)).toString();
}

export function getOtpExpiry(minutes = 10): Date {
  return new Date(Date.now() + minutes * 60 * 1000);
}

export async function hashOtp(otp: string): Promise<string> {
  return hash(otp, 12);
}

export async function verifyOtp(otp: string, otpHash: string): Promise<boolean> {
  return compare(otp, otpHash);
}

export function generateResetToken(): { token: string; expiresAt: Date } {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  return { token, expiresAt };
}

export function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
