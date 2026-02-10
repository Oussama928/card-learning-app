import { hash } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import db from "../../../lib/db";
import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const formData = await request.formData();

    const email = formData.get("email") as string;
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;
    const photoFile = formData.get("photo") as Blob | null;

    if (!email || !username || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const existingUsersResult = await db.queryAsync(
      `SELECT id FROM users WHERE email = $1 OR username = $2`,
      [email, username]
    );
    const existingUsers = existingUsersResult.rows;

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 409 }
      );
    }

    let photoUrl: string | null = null;
    if (photoFile instanceof Blob) {
      try {
        const buffer = Buffer.from(await photoFile.arrayBuffer());
        const processedImage = await sharp(buffer)
          .resize(500, 500)
          .webp()
          .toBuffer();

        const photoName = `${uuidv4()}.webp`;
        const uploadDir = path.join(process.cwd(), "public/uploads");
        await fs.mkdir(uploadDir, { recursive: true });
        const photoPath = path.join(uploadDir, photoName);
        await fs.writeFile(photoPath, processedImage);
        photoUrl = `/uploads/${photoName}`;
      } catch (error: any) {
        console.error("Error processing image:", error);
        return NextResponse.json(
          { error: "Failed to process image" },
          { status: 500 }
        );
      }
    }

    const hashedPassword = await hash(password, 12);

    const result = await db.queryAsync(
      `INSERT INTO users 
       (email, password, username, image, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [email, hashedPassword, username, photoUrl, new Date(), new Date()]
    );
    const userId = result.rows[0].id;

    return NextResponse.json(
      { user: { id: userId, email, username } },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
