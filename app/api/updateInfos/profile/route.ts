import { NextRequest, NextResponse } from "next/server";
import db from "../../../../lib/db";
import { authenticateRequest } from "../../authenticateRequest";
import type { ApiErrorResponseDTO, UpdateProfileRequestDTO, UpdateProfileResponseDTO } from "@/types";

export async function POST(
  request: NextRequest
): Promise<NextResponse<UpdateProfileResponseDTO | ApiErrorResponseDTO>> {
  const userId = await authenticateRequest(request);

  try {
    const { field, value }: UpdateProfileRequestDTO = await request.json();

    const allowedFields = ["bio", "country", "username"];
    if (!allowedFields.includes(field)) {
      return NextResponse.json(
        { success: false, error: "Invalid field" },
        { status: 400 }
      );
    }

    const updateQuery = `UPDATE users SET ${field} = $1 WHERE id = $2 RETURNING id, email, username, image, bio, country`;
    const result = await db.queryAsync(updateQuery, [value, userId]);
    const updated = result.rows[0];

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      updated_user: updated,
    });
  } catch (error: unknown) {
    console.error("User info update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update user info" },
      { status: 500 }
    );
  }
}
