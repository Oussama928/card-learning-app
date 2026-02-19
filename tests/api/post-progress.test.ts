import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const queryAsync = vi.fn();
const del = vi.fn();
const authenticateRequest = vi.fn();

vi.mock("@/lib/db", () => ({
  default: { queryAsync },
}));

vi.mock("@/app/api/authenticateRequest", () => ({
  authenticateRequest,
}));

vi.mock("@/lib/cache", () => ({
  cache: { del },
  cacheKeys: {
    userStats: (userId: string | number) => `stats:user:${userId}`,
    globalStats: "stats:global",
  },
}));

describe("post progress route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates progress and invalidates stats cache keys", async () => {
    authenticateRequest.mockResolvedValue(1);
    queryAsync.mockResolvedValue({ rowCount: 1, rows: [] });

    const { POST } = await import("@/app/api/postProgress/route");
    const req = new NextRequest("http://localhost/api/postProgress", {
      method: "POST",
      body: JSON.stringify({ word_id: 42, is_learned: true }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(queryAsync).toHaveBeenCalledTimes(3);
    expect(queryAsync.mock.calls[0][0]).toContain("FROM user_progress");
    expect(queryAsync.mock.calls[1][0]).toContain("INSERT INTO user_progress");
    expect(queryAsync.mock.calls[2][0]).toContain("INSERT INTO study_activity");
    expect(del).toHaveBeenCalledWith("stats:user:1");
    expect(del).toHaveBeenCalledWith("stats:global");
  });
});
