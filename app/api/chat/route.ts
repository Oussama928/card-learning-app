import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError, parseRequestBody } from "@/lib/apiHandler";

const ChatMessageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string().min(1),
});

const ChatRequestSchema = z.object({
  message: z.string().min(1),
  history: z.array(ChatMessageSchema).max(20).optional(),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { message, history } = await parseRequestBody(request, ChatRequestSchema);

    const apiKey = process.env.HF_API_KEY || process.env.HUGGINGFACE_HUB_TOKEN;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing HF_API_KEY environment variable" },
        { status: 500 }
      );
    }

    const model = process.env.HF_MODEL ;

    const messages = [
      ...(history || []).map(h => ({ role: h.role, content: h.content })),
      { role: "user", content: message }
    ];

    const response = await fetch("https://router.huggingface.co/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: `${model}:fastest`,
        messages: messages,
        max_tokens: 160,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("HF API error:", response.status, errorText);
      return NextResponse.json(
        { error: "HF inference error", details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content ?? "";
    return NextResponse.json({ reply });
  } catch (error: unknown) {
    console.error("Chat API error:", error);
    return handleApiError(error, request);
  }
}