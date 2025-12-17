import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: pathArray } = await params;
  const filePath = pathArray.join("/");

  // Security: Only allow files from uploads directory
  // Allow sessions/, avatars/, and character-avatars/ subdirectories
  if (
    filePath.includes("..") ||
    (!filePath.startsWith("sessions/") &&
      !filePath.startsWith("avatars/") &&
      !filePath.startsWith("character-avatars/"))
  ) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const uploadDir = process.env.UPLOAD_DIR ?? "./uploads";
  const fullPath = join(uploadDir, filePath);

  if (!existsSync(fullPath)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  try {
    const fileBuffer = await readFile(fullPath);
    const ext = fullPath.split(".").pop()?.toLowerCase();
    
    let contentType = "application/octet-stream";
    if (ext === "png") contentType = "image/png";
    if (ext === "jpg" || ext === "jpeg") contentType = "image/jpeg";
    if (ext === "gif") contentType = "image/gif";
    if (ext === "webp") contentType = "image/webp";

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Error serving file:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

