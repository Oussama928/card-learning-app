import { z } from "zod";

export const forgotPasswordSchema = z.object({
  email: z.string().regex(/^[^@\s]+@[^@\s]+\.[^@\s]+$/).trim().toLowerCase(),
});

export const resendOtpSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
});

export const verifyOtpSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  otp: z.string().regex(/^\d{6}$/),
});

export const createNotificationSchema = z.object({
  type: z.enum(["reminder", "feature", "system", "streak"]),
  content: z.string().min(3).max(1000).trim(),
});

export type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;
export type ResendOtpSchema = z.infer<typeof resendOtpSchema>;
export type VerifyOtpSchema = z.infer<typeof verifyOtpSchema>;
export type CreateNotificationSchema = z.infer<typeof createNotificationSchema>;
