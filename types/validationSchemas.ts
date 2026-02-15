import * as yup from "yup";

export const signupSchema = yup.object().shape({
  email: yup
    .string()
    .email("Invalid email address")
    .required("Email is required"),
  username: yup
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must be at most 50 characters")
    .matches(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
    .required("Username is required"),
  password: yup
    .string()
    .min(8, "Password must be at least 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one lowercase letter, one uppercase letter, and one number")
    .required("Password is required"),
  photo: yup.mixed().optional(),
});

export const loginSchema = yup.object().shape({
  email: yup
    .string()
    .email("Invalid email address")
    .required("Email is required"),
  password: yup
    .string()
    .required("Password is required"),
});

export const verifyEmailSchema = yup.object().shape({
  email: yup
    .string()
    .email("Invalid email address")
    .required("Email is required"),
  otp: yup
    .string()
    .length(6, "OTP must be exactly 6 digits")
    .matches(/^\d{6}$/, "OTP must be numeric")
    .required("OTP is required"),
});

export const forgotPasswordSchema = yup.object().shape({
  email: yup
    .string()
    .matches(/^[^@\s]+@[^@\s]+\.[^@\s]+$/, "Invalid email address")
    .required("Email is required"),
});

export const resetPasswordSchema = yup.object().shape({
  password: yup
    .string()
    .min(8, "Password must be at least 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one lowercase letter, one uppercase letter, and one number")
    .required("Password is required"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords must match")
    .required("Confirm password is required"),
});

export const cardAddSchema = yup.object().shape({
  title: yup
    .string()
    .required("Card title is required")
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must be at most 100 characters"),
  targetLanguage: yup
    .string()
    .required("Target language is required")
    .min(2, "Language must be at least 2 characters")
    .max(50, "Language must be at most 50 characters"),
  description: yup
    .string()
    .required("Description is required")
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description must be at most 500 characters"),
  agreed: yup
    .boolean()
    .oneOf([true], "You must agree to the policies")
    .required("You must agree to the policies"),
});

export const addNotificationSchema = yup.object().shape({
  type: yup
    .string()
    .oneOf(["system", "feature", "reminder"], "Invalid notification type")
    .required("Notification type is required"),
  content: yup
    .string()
    .required("Content is required")
    .min(5, "Content must be at least 5 characters")
    .max(1000, "Content must be at most 1000 characters"),
});

export const profileUpdateSchema = yup.object().shape({
  username: yup
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must be at most 50 characters")
    .matches(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
    .optional(),
  country: yup
    .string()
    .oneOf(["United States", "Germany", "Japan", "Canada"], "Invalid country")
    .optional(),
  bio: yup
    .string()
    .max(500, "Bio must be at most 500 characters")
    .optional(),
});

export const searchSchema = yup.object().shape({
  search: yup
    .string()
    .trim()
    .min(1, "Search term cannot be empty")
    .max(100, "Search term is too long")
    .required("Search term is required"),
});