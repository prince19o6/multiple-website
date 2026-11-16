import { z } from "zod";

export const dietaryPreferences = [
  "None",
  "PureVeg",
  "Jain",
  "Swaminarayan",
  "Halal",
] as const;

export type DietaryPreference = (typeof dietaryPreferences)[number];

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
const passwordMessage =
  "Password must be at least 8 characters and include at least one uppercase letter, one lowercase letter, one number, and one special character.";

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Full name must be at least 2 characters")
      .max(80, "Full name cannot exceed 80 characters"),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Please provide a valid email address"),
    phoneCountryCode: z
      .string()
      .trim()
      .min(1, "Please select country code")
      .default("+91"),
    phone: z
      .string()
      .trim()
      .min(6, "Phone number must be at least 6 digits")
      .max(15, "Phone number cannot exceed 15 digits")
      .regex(/^[0-9\s\-]+$/, "Phone number must contain only numbers"),
    password: z.string().min(8, "Password must be at least 8 characters").regex(passwordRegex, passwordMessage),
    confirmPassword: z.string(),
    dietaryPreference: z.enum(dietaryPreferences).default("None"),
    marketingOptIn: z.boolean().default(false),
    termsAccepted: z
      .boolean()
      .refine((val) => val === true, "You must accept the Terms and Conditions and Privacy Policy"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please provide a valid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().default(false),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please provide a valid email address"),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset token is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters").regex(passwordRegex, passwordMessage),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters").regex(passwordRegex, passwordMessage),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const updateProfileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(80, "Full name cannot exceed 80 characters"),
  phoneCountryCode: z.string().trim().default("+91"),
  phone: z
    .string()
    .trim()
    .min(6, "Phone number must be at least 6 digits")
    .max(15, "Phone number cannot exceed 15 digits")
    .regex(/^[0-9\s\-]+$/, "Phone number must contain only numbers"),
  dietaryPreference: z.enum(dietaryPreferences).default("None"),
  preferredCurrency: z.string().default("USD"),
  marketingOptIn: z.boolean().default(false),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const verifyEmailSchema = z.object({
  token: z.string().min(1, "Verification token is required"),
});

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

