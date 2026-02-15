import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const queryAsync = vi.fn();
const bumpNamespaceVersion = vi.fn();
const authenticateRequest = vi.fn();

vi.mock("@/lib/db", () => ({
  default: { queryAsync },
}));

vi.mock("@/app/api/authenticateRequest", () => ({
  authenticateRequest,
}));

vi.mock("@/lib/cache", () => ({
  cache: { bumpNamespaceVersion },
}));

describe("delete card scoped invalidation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("bumps official namespace when admin card is deleted", async () => {
    authenticateRequest.mockResolvedValue(1);
    queryAsync
      .mockResolvedValueOnce({ rows: [{ id: 10, role: "admin" }] })
      .mockResolvedValueOnce({ rows: [], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 1 });

    const { DELETE } = await import("@/app/api/deleteCard/[id]/route");
    const req = new NextRequest("http://localhost/api/deleteCard/10", { method: "DELETE" });
    const res = await DELETE(req, { params: Promise.resolve({ id: "10" }) });

    expect(res.status).toBe(200);
    expect(bumpNamespaceVersion).toHaveBeenCalledWith("cards:official");
    expect(bumpNamespaceVersion).toHaveBeenCalledWith("search");
  });
});
