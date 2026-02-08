import { NextResponse } from "next/server";
import db from "@/lib/db";
import { authenticateRequest } from '../../authenticateRequest'; 

export async function DELETE(request, { params }) {
  const { id } =await params;

  try {
    const userId = await authenticateRequest(request); 


    const cardResult = await db.queryAsync(
      `SELECT id FROM cards WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );
    const card = cardResult.rows[0];

    if (!card) {
      return NextResponse.json(
        { error: "Card not found or access denied" },
        { status: 404 }
      );
    }

    await db.queryAsync(
      `DELETE FROM words WHERE card_id = $1`,
      [id]
    );

    const result = await db.queryAsync(
      `DELETE FROM cards WHERE id = $1`,
      [id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Failed to delete card" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Card and all associated words deleted successfully",
      deletedCardId: id
    });

  } catch (error) {
    console.error("Card deletion error:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error.message 
      },
      { status: 500 }
    );
  }
}