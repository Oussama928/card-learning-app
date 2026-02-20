import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/app/api/authenticateRequest";
import { saveUpload, UploadValidationError } from "@/lib/uploads/service";
import { handleApiError } from "@/lib/apiHandler";

export const runtime = "nodejs";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    await authenticateRequest(request);

    const formData = await request.formData();
    const file = formData.get("file");
    // optional target folder
    const target = typeof formData.get("target") === "string" ? (formData.get("target") as string) : (formData.get("target") instanceof FormDataEntryValue ? String(formData.get("target")) : null);

    if (!(file instanceof Blob)) {
      return NextResponse.json(
        { success: false, error: "File is required" },
        { status: 400 }
      );
    }

    const result = await saveUpload(file, target || undefined);
    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof UploadValidationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }

    return handleApiError(error, request);
  }
}
