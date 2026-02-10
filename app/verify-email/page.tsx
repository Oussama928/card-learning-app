"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type {
  ApiResponseDTO,
  VerifyEmailResponseDTO,
  ResendOtpResponseDTO,
} from "@/types";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") || "";

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage("");
    setErrorMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data: ApiResponseDTO<VerifyEmailResponseDTO> = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to verify email");
      }

      setMessage(data.data?.message || "Email verified successfully");
      router.push("/login");
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error ? error.message : "Verification failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setMessage("");
    setErrorMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data: ApiResponseDTO<ResendOtpResponseDTO> = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to resend OTP");
      }

      setMessage(data.data?.message || "OTP sent");
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to resend OTP"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <img
          alt="Your Company"
          src="https://tailwindui.com/plus/img/logos/mark.svg?color=indigo&shade=600"
          className="mx-auto h-10 w-auto"
        />
        <h2 className="mt-10 text-center text-2xl/9 font-bold tracking-tight text-gray-900">
          Verify your email
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form onSubmit={handleVerify} className="space-y-6">
          {message && (
            <div className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
              {message}
            </div>
          )}
          {errorMessage && (
            <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          <div>
            <label className="block text-sm/6 font-medium text-gray-900" htmlFor="email">
              Email
            </label>
            <div className="mt-2">
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm/6 font-medium text-gray-900" htmlFor="otp">
              OTP Code
            </label>
            <div className="mt-2">
              <input
                id="otp"
                type="text"
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            {loading ? "Verifying..." : "Verify"}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between text-sm">
          <button
            onClick={handleResend}
            disabled={loading}
            className="font-semibold text-indigo-600 hover:text-indigo-500"
          >
            Resend OTP
          </button>
          <Link href="/login" className="text-gray-600 hover:text-gray-900">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
