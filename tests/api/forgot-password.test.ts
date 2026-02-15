import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const queryAsync = vi.fn();
const sendTemplatedEmail = vi.fn();
const rateLimitOrThrow = vi.fn();

vi.mock("@/lib/db", () => ({
  default: { queryAsync },
}));

vi.mock("@/lib/email/service", () => ({
  sendTemplatedEmail,
}));

vi.mock("@/lib/rateLimit", () => ({
  rateLimitOrThrow,
  RateLimitError: class extends Error {
    status = 429;
    retryAfter = 1;
  },
}));

describe("forgot password route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 on invalid payload", async () => {
    const { POST } = await import("@/app/api/auth/forgot-password/route");
    const req = new NextRequest("http://localhost/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email: "bad-email" }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("sends email when user exists and verified", async () => {
    queryAsync
      .mockResolvedValueOnce({ rows: [{ id: 1, email_verified: true }] })
      .mockResolvedValueOnce({ rows: [], rowCount: 1 });

    const { POST } = await import("@/app/api/auth/forgot-password/route");
    const req = new NextRequest("http://localhost/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email: "user@example.com" }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(sendTemplatedEmail).toHaveBeenCalledTimes(1);
    expect(queryAsync).toHaveBeenCalledTimes(2);
  });
});
