"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useFormik } from "formik";
import * as yup from "yup";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Mail, Key, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import type { ApiResponseDTO, VerifyEmailResponseDTO, ResendOtpResponseDTO } from "@/types";

const verifyEmailSchema = yup.object().shape({
  email: yup.string().email("Invalid email").required("Email is required"),
  otp: yup.string().length(6, "Code must be 6 digits").required("Code is required"),
});

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") || "";

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [resendLoading, setResendLoading] = useState(false);

  const formik = useFormik({
    initialValues: {
      email: initialEmail,
      otp: "",
    },
    validationSchema: verifyEmailSchema,
    enableReinitialize: true,
    onSubmit: async (values, { setSubmitting }) => {
      setMessage("");
      setErrorMessage("");

      try {
        const res = await fetch("/api/auth/verify-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });

        const data: ApiResponseDTO<VerifyEmailResponseDTO> = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || "Verification failed");
        }

        setMessage(data.data?.message || "Email verified successfully!");
        
        // Redirect to login after a short delay
        setTimeout(() => {
          router.push("/login?verified=true");
        }, 2000);
      } catch (error: any) {
        setErrorMessage(error.message || "Verification failed");
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleResendOtp = async () => {
    if (!formik.values.email) {
      setErrorMessage("Please enter your email address to resend code.");
      return;
    }

    setResendLoading(true);
    setMessage("");
    setErrorMessage("");

    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formik.values.email }),
      });

      const data: ApiResponseDTO<ResendOtpResponseDTO> = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to resend code");
      }

      setMessage(data.data?.message || "Verification code sent!");
    } catch (error: any) {
      setErrorMessage(error.message || "Failed to resend code");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md border-border/50 shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-foreground">Verify Email</CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            Enter the 6-digit code sent to your email
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={formik.handleSubmit} className="space-y-4">
            {message && (
              <div className="flex items-center gap-2 rounded-md bg-green-500/15 p-3 text-sm text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                <span>{message}</span>
              </div>
            )}
            
            {errorMessage && (
              <div className="flex items-center gap-2 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  className="pl-9 bg-background"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
              </div>
              {formik.touched.email && formik.errors.email && (
                <p className="text-sm text-destructive">{formik.errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="otp">Verification Code</Label>
              <div className="relative">
                <Key className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="otp"
                  name="otp"
                  type="text"
                  placeholder="123456"
                  className="pl-9 bg-background tracking-widest"
                  maxLength={6}
                  value={formik.values.otp}
                  onChange={(e) => {
                    // unexpected behavior fix: ensure only numbers
                    const val = e.target.value.replace(/\D/g, "");
                    formik.setFieldValue("otp", val);
                  }}
                  onBlur={formik.handleBlur}
                />
              </div>
              {formik.touched.otp && formik.errors.otp && (
                <p className="text-sm text-destructive">{formik.errors.otp}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={formik.isSubmitting || resendLoading}
            >
              {formik.isSubmitting ? "Verifying..." : "Verify Email"}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Didn't receive code?{" "}
              <button
                type="button"
                className="text-primary hover:underline font-medium disabled:opacity-50"
                onClick={handleResendOtp}
                disabled={resendLoading || formik.isSubmitting}
              >
                {resendLoading ? "Sending..." : "Resend Code"}
              </button>
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center border-t pt-4">
          <Link href="/login" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            Back to login
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
