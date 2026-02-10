import { NextResponse } from "next/server";
import db from "../../../lib/db";
import { authenticateRequest } from "../authenticateRequest";

// input sanitization and validation functions
const sanitizeText = (text, maxLength = 200) => {
  if (typeof text !== 'string') {
    throw new Error('Input must be a string');
  }

  return text
    .trim()
    .replace(/[<>\"'&]/g, '') //  dangerous characters
    .replace(/\s+/g, ' ') //  whitespace
    .substring(0, maxLength); 
};

const parseFileContent = (fileContent) => {
  if (typeof fileContent !== 'string') {
    throw new Error('File content must be a string');
  }

  const lines = fileContent.split(/\r?\n/).map(line => line.trim()).filter(line => line);
  const parsedExpressions = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const colonIndex = line.indexOf(':');
    
    if (colonIndex === -1) {
      throw new Error(`Invalid format at line ${i + 1}: "${line}". Expected format: "expression:translation"`);
    }

    const expression = sanitizeText(line.substring(0, colonIndex), 100);
    const translation = sanitizeText(line.substring(colonIndex + 1), 100);

    if (!expression || !translation) {
      throw new Error(`Empty expression or translation at line ${i + 1}`);
    }

    parsedExpressions.push([expression, translation, false]);
  }

  if (parsedExpressions.length === 0) {
    throw new Error('No valid expression pairs found in the file');
  }

  if (parsedExpressions.length > 1000) {
    throw new Error('Maximum 1000 expression pairs allowed');
  }

  return parsedExpressions;
};

const validateWordPair = (wordPair, index) => {
  if (!Array.isArray(wordPair) || wordPair.length < 2) {
    throw new Error(`Invalid expression pair at index ${index}: must be an array with at least 2 elements`);
  }

  const [word, translation] = wordPair;

  if (typeof word !== 'string' || typeof translation !== 'string') {
    throw new Error(`Invalid expression pair at index ${index}: expression and translation must be strings`);
  }

  const sanitizedWord = sanitizeText(word, 100);
  const sanitizedTranslation = sanitizeText(translation, 100);

  if (!sanitizedWord || !sanitizedTranslation) {
    throw new Error(`Empty expression or translation at index ${index} after sanitization`);
  }

  return [sanitizedWord, sanitizedTranslation, wordPair[2] || false];
};

const validateWordsArray = (words) => {
  if (!Array.isArray(words)) {
    throw new Error('Words must be an array');
  }

  if (words.length === 0) {
    throw new Error('At least one expression pair is required');
  }

  if (words.length > 1000) {
    throw new Error('Maximum 1000 expression pairs allowed');
  }

  const validatedWords = [];
  for (let i = 0; i < words.length; i++) {
    try {
      const validatedPair = validateWordPair(words[i], i);
      validatedWords.push(validatedPair);
    } catch (error) {
      throw new Error(`Expression pair validation failed: ${error.message}`);
    }
  }

  return validatedWords;
};

export async function POST(request) {
  try {
    const { title, targetLanguage, description, words, fileContent, edit, id, garbageCollector } =
      await request.json();
    const userId = await authenticateRequest(request);

    const sanitizedTitle = sanitizeText(title, 100);
    const sanitizedTargetLanguage = sanitizeText(targetLanguage, 50);
    const sanitizedDescription = sanitizeText(description, 500);

    if (!sanitizedTitle || !sanitizedTargetLanguage || !sanitizedDescription) {
      return NextResponse.json(
        { message: "Title, target language, and description are required and cannot be empty after sanitization" },
        { status: 400 }
      );
    }

    let validatedWords;
    
    if (fileContent) {
      try {
        validatedWords = parseFileContent(fileContent);
      } catch (error) {
        return NextResponse.json(
          { message: "File parsing error: " + error.message },
          { status: 400 }
        );
      }
    } else if (words) {
      //  manual input
      try {
        validatedWords = validateWordsArray(words);
      } catch (error) {
        return NextResponse.json(
          { message: error.message },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { message: "Either words array or file content is required" },
        { status: 400 }
      );
    }

    const cardData = {
      title: sanitizedTitle,
      targetLanguage: sanitizedTargetLanguage,
      description: sanitizedDescription,
      words: validatedWords,
    };
    if (edit) {
      const updateCardQuery = `
            UPDATE cards
            SET title = $1, target_language = $2, description = $3, total_words = $4
            WHERE id = $5 AND user_id = $6
            `;
      const new_size = validatedWords.length;
      console.log(new_size);
      const cardResult = await db.queryAsync(
        updateCardQuery,
        [sanitizedTitle, sanitizedTargetLanguage, sanitizedDescription, new_size, id, userId]
      );

      // check if card was found and updated
      if (cardResult.rowCount === 0) {
        return NextResponse.json(
          { message: "Card not found or access denied" },
          { status: 404 }
        );
      }

      for (const word of validatedWords) {
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

      // handle garbage collection for deleted words
      if (garbageCollector && Array.isArray(garbageCollector)) {
        for (const wordId of garbageCollector) {
          if (typeof wordId === 'number' && wordId > 0) {
            const deleteQuery1 = `DELETE FROM user_progress WHERE word_id = $1`;
            const deleteQuery2 = `DELETE FROM words WHERE id = $1 AND card_id IN (SELECT id FROM cards WHERE user_id = $2)`;
            await db.queryAsync(deleteQuery1, [wordId]);
            await db.queryAsync(deleteQuery2, [wordId, userId]);
          }
        }
      }

      return NextResponse.json({
        message: "Card edited successfully",
      });
    } else {
      const filteredWords = validatedWords.filter(
        ([word, trans]) => word.trim() && trans.trim()
      );

      if (filteredWords.length === 0) {
        return NextResponse.json(
          { message: "No valid expression pairs found after filtering" },
          { status: 400 }
        );
      }

      const insertCardQuery = `
            INSERT INTO cards
                (title, target_language, description, user_id, total_words)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
        `;

      const cardResult = await db.queryAsync(
        insertCardQuery,
        [sanitizedTitle, sanitizedTargetLanguage, sanitizedDescription, userId, filteredWords.length]
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

    if (error.message.includes('validation') || error.message.includes('sanitization')) {
      return NextResponse.json(
        { message: "Input validation failed", details: error.message },
        { status: 400 }
      );
    }

    if (error.code === '23505') { 
      return NextResponse.json(
        { message: "A card with this title already exists" },
        { status: 409 }
      );
    }

    if (error.code === '23503') { 
      return NextResponse.json(
        { message: "Invalid reference or permission denied" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { message: "Error processing card data", error: error.message },
      { status: 500 }
    );
  }
}
