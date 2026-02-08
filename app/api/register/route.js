import { ok } from "assert";
import db from "../../../lib/db";
import { NextResponse } from 'next/server';
import { stat } from "fs";

export async function POST(request) {
  try {
    const { email, username } = await request.json();
    console.log("Data:", email, username);

    const checkQuery = "SELECT * FROM users WHERE email = $1 OR username = $2";
    
    const checkResult = await db.queryAsync(checkQuery, [email, username]);
    const rows = checkResult.rows;
    
    if (rows.length > 0) {
      return NextResponse.json({ message: "User already exists. It's aight!"  },{ status: 200 });
    }

    const query = "INSERT INTO users (username, email) VALUES ($1, $2)";
    
    const result = await db.queryAsync(query, [username, email]);
    return NextResponse.json({ message: "User registered successfully", result });
    
  } catch (error) {
    console.error("Error in POST request:", error);
    return NextResponse.json({ message: "Error registering user", error: error.message });
  }
  
}
