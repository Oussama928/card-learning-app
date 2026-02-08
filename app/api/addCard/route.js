import { NextResponse } from "next/server";
import db from "../../../lib/db";
import { authenticateRequest } from "../authenticateRequest";

export async function POST(request) {
  try {
    const { title, targetLanguage, description, words, edit, id,garbageCollector } =
      await request.json();
    const userId = await authenticateRequest(request);

    const cardData = {
      title,
      targetLanguage,
      description,
      words,
    };
    if (edit) {
      const updateCardQuery = `
            UPDATE cards
            SET title = $1, target_language = $2, description = $3,total_words = $4
            WHERE id = $5 AND user_id = $6
            `;
      const new_size = words.length;
      console.log(new_size);
      const cardResult = await db.queryAsync(
        updateCardQuery,
        [title, targetLanguage, description,new_size, id, userId]
      );

      for (const word of words) {
        if (typeof word[2] === 'number') {
          const updateWordQuery = `
            UPDATE words
            SET word = $1, translated_word = $2
            WHERE words.id = $3 
              AND words.card_id IN (SELECT id FROM cards WHERE user_id = $4)
              AND words.card_id = $5
          `;
          await db.queryAsync(
            updateWordQuery,
            [word[0], word[1], word[2], userId, id]
          );
        } else {
          const insertQuery = `INSERT INTO words (word, translated_word, card_id) VALUES ($1, $2, $3)`;
          await db.queryAsync(insertQuery, [word[0], word[1], id]);
        }
        
      }
      for(const idd of garbageCollector){
      const deleteQuery1 = `DELETE FROM user_progress WHERE word_id = $1`;
        const deleteQuery2 = `DELETE FROM words WHERE id = $1`;
        await db.queryAsync(deleteQuery1, [idd]);

        await db.queryAsync(deleteQuery2, [idd]);
      }

      return NextResponse.json({
        message: "Card edited successfully",
      });
    } else {
      const filteredWords = words.filter(
        ([word, trans]) => word.trim() && trans.trim()
      );
      const insertCardQuery = `
            INSERT INTO cards 
                (title, target_language, description, user_id, total_words)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
        `;

      const cardResult = await db.queryAsync(
        insertCardQuery,
        [title, targetLanguage, description, userId, filteredWords.length]
      );

      const cardId = cardResult.rows[0].id;

      if (filteredWords.length > 0) {
        const insertWordQuery = `
                INSERT INTO words 
                    (word, translated_word, card_id)
                VALUES 
            ` + filteredWords.map((_, i) => {
              const baseIdx = i * 3;
              return `($${baseIdx + 1}, $${baseIdx + 2}, $${baseIdx + 3})`;
            }).join(', ');

        const wordValues = filteredWords.flatMap(([word, translation]) => [
          word.trim(),
          translation.trim(),
          cardId,
        ]);

        await db.queryAsync(insertWordQuery, wordValues);
      }

      return NextResponse.json({
        message: "Card added successfully",
        cardData: { ...cardData, id: cardId },
      });
    }
  } catch (error) {
    console.error("Error in POST request:", error);
    return NextResponse.json(
      { message: "Error adding card", error: error.message },
      { status: 500 }
    );
  }
}
