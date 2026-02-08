import { NextResponse } from 'next/server';
import db from '../../../lib/db';
import { authenticateRequest } from '../authenticateRequest'; 

export async function POST(request) {
  try {
    const {  word_id, is_learned } = await request.json();
    const userId = await authenticateRequest(request); 


    await db.queryAsync(`
      INSERT INTO user_progress 
        (user_id, word_id, is_learned)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, word_id) DO UPDATE
        SET is_learned = EXCLUDED.is_learned
    `, [userId, word_id, is_learned]);

    return NextResponse.json({ 
      success: true,
      message: `Word marked as ${is_learned ? 'learned' : 'unlearned'}`
    });

  } catch (error) {
    console.error("Progress update error:", error);
    return NextResponse.json(
      { 
        error: "Progress update failed",
        details: error.message.includes('foreign key constraint') 
          ? "Invalid user_id or word_id" 
          : "Database error"
      },
      { status: 500 }
    );
  }
}