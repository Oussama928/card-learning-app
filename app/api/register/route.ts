import { NextRequest, NextResponse } from "next/server";
import db from "../../../lib/db";
import { authenticateRequest } from "../authenticateRequest";
import type { RegisterRequest } from "@/types";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { email, username }: RegisterRequest = await request.json();
    console.log("Data:", email, username);

    const checkQuery =
      "SELECT * FROM users WHERE email = $1 OR username = $2";

    const checkResult = await db.queryAsync(checkQuery, [email, username]);
    const rows = checkResult.rows;

    if (rows.length > 0) {
      return NextResponse.json(
        { message: "User already exists. It's aight!" },
        { status: 200 }
      );
    }

    const query = "INSERT INTO users (username, email) VALUES ($1, $2)";

    const result = await db.queryAsync(query, [username, email]);
    return NextResponse.json({
      message: "User registered successfully",
      result,
    });
  } catch (error: any) {
    console.error("Error in POST request:", error);
    return NextResponse.json(
      { message: "Error registering user", error: error.message },
      { status: 500 }
    );
  }
}
