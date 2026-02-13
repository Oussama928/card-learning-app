import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import logger from "@/lib/logger";
import { captureException } from "@/lib/sentry";
import { RateLimitError } from "@/lib/rateLimit";

export const withApiHandler = <T>(
  handler: (request: NextRequest, context?: unknown) => Promise<NextResponse<T>>
) => {
  return async (request: NextRequest, context?: unknown): Promise<NextResponse<T>> => {
    try {
      return await handler(request, context);
    } catch (error: unknown) {
      if (error instanceof RateLimitError) {
        return NextResponse.json(
          { error: error.message },
          {
            status: error.status,
            headers: {
              "Retry-After": error.retryAfter.toString(),
            },
          }
        ) as NextResponse<T>;
      }

      logger.error("api_error", {
        message: error?.message || "Unknown error",
        stack: error?.stack,
        path: request.nextUrl?.pathname,
        method: request.method,
      });
      captureException(error, {
        path: request.nextUrl?.pathname,
        method: request.method,
      });

      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      ) as NextResponse<T>;
    }
  };
};

export const handleApiError = <T>(error: unknown, request: NextRequest) => {
  if (error instanceof RateLimitError) {
    return NextResponse.json(
      { error: error.message },
      {
        status: error.status,
        headers: {
          "Retry-After": error.retryAfter.toString(),
        },
      }
    ) as NextResponse<T>;
  }

  const err = error as { message?: string; stack?: string };
  logger.error("api_error", {
    message: err?.message || "Unknown error",
    stack: err?.stack,
    path: request.nextUrl?.pathname,
    method: request.method,
  });
  captureException(error, {
    path: request.nextUrl?.pathname,
    method: request.method,
  });

  return NextResponse.json(
    { error: "Internal server error" },
    { status: 500 }
  ) as NextResponse<T>;
};
