import { z } from "zod";

export const registerSchema = z.object({
  username: z.string().min(3).max(24),
  fullName: z.string().min(2).max(100),
  email: z.string().email(),
  countryCode: z.string().min(1).max(5), // e.g., "+966", "+1"
  phoneNumber: z.string().min(5).max(15),
  password: z.string().min(6),
  avatarUrl: z.string().url().optional(),
});

export const loginSchema = z.object({
  usernameOrEmail: z.string().min(1),
  password: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

