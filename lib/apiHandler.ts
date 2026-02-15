import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import logger from "@/lib/logger";
import { captureException } from "@/lib/sentry";
import { RateLimitError } from "@/lib/rateLimit";
import { z, ZodSchema } from "zod";

export class AppError extends Error {
  status: number;
  details?: string;

  constructor(message: string, status: number = 500, details?: string) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const parseRequestBody = async <T>(
  request: NextRequest,
  schema: ZodSchema<T>
): Promise<T> => {
  const body = await request.json();
  const result = schema.safeParse(body);

  if (!result.success) {
    const firstIssue = result.error.issues[0];
    throw new AppError("Invalid request body", 400, firstIssue?.message);
  }

  return result.data;
};

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

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        details: error.details,
      },
      { status: error.status }
    ) as NextResponse<T>;
  }

  if (error instanceof z.ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid request body",
        details: error.issues[0]?.message,
      },
      { status: 400 }
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
