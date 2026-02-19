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
  type: z.enum(["reminder", "feature", "system", "streak", "tier", "achievement"]),
  content: z.string().min(3).max(1000).trim(),
});

export const createAchievementSchema = z.object({
  name: z.string().min(3).max(255).trim(),
  description: z.string().min(3).max(1000).trim(),
  conditionType: z.enum(["cards_studied_total", "cards_created_total"]),
  target: z.number().int().min(1),
  imageUrl: z.string().max(511).optional().nullable(),
  xpReward: z.number().int().min(0).optional(),
});

export type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;
export type ResendOtpSchema = z.infer<typeof resendOtpSchema>;
export type VerifyOtpSchema = z.infer<typeof verifyOtpSchema>;
export type CreateNotificationSchema = z.infer<typeof createNotificationSchema>;
export type CreateAchievementSchema = z.infer<typeof createAchievementSchema>;
