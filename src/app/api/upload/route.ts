import { NextRequest, NextResponse } from "next/server";
import { uploadFileToGoogleDrive } from "@/lib/google-drive";
import { prisma } from "@/lib/prisma";
import { Buffer } from "node:buffer";

export const runtime = "edge";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return Buffer.from(buffer).toString("base64");
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const taskId = formData.get("taskId") as string | null;
    const folderId = formData.get("folderId") as string | null;
    const spaceName = (formData.get("spaceName") as string | null) || undefined;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided in request" },
        { status: 400 }
      );
    }

    const fileName = file.name;
    const mimeType = file.type || "application/octet-stream";
    const fileBytes = await file.arrayBuffer();

    let uploadResult: {
      id: string;
      name: string;
      webViewLink: string;
      thumbnailLink?: string;
      isDataUrl?: boolean;
    };

    // Periksa apakah Google Drive OAuth nyata telah dikonfigurasi
    const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const hasDriveConfigured =
      Boolean(clientId) &&
      !clientId?.includes("sample-") &&
      Boolean(refreshToken) &&
      !refreshToken?.includes("sample-");

    if (hasDriveConfigured) {
      try {
        const driveResult = await uploadFileToGoogleDrive({
          fileName,
          mimeType,
          fileBytes,
          spaceName,
          folderId: folderId || undefined,
        });
        uploadResult = {
          ...driveResult,
          isDataUrl: false,
        };
      } catch (driveErr: any) {
        console.warn("[Upload API] Google Drive error, fallback to direct data storage:", driveErr.message);
        const base64 = arrayBufferToBase64(fileBytes);
        const dataUrl = `data:${mimeType};base64,${base64}`;
        uploadResult = {
          id: `media_${Date.now()}`,
          name: fileName,
          webViewLink: dataUrl,
          thumbnailLink: mimeType.startsWith("image/") ? dataUrl : undefined,
          isDataUrl: true,
        };
      }
    } else {
      // Simpan langsung sebagai data URL yang valid dan dapat langsung dibuka/dilihat oleh siapa saja
      const base64 = arrayBufferToBase64(fileBytes);
      const dataUrl = `data:${mimeType};base64,${base64}`;
      uploadResult = {
        id: `media_${Date.now()}`,
        name: fileName,
        webViewLink: dataUrl,
        thumbnailLink: mimeType.startsWith("image/") ? dataUrl : undefined,
        isDataUrl: true,
      };
    }

    // Jika taskId disertakan, simpan langsung ke mediaUrls task di Neon DB
    if (taskId) {
      try {
        if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("your-subdomain")) {
          await prisma.$executeRawUnsafe(
            `UPDATE "tasks" SET "mediaUrls" = array_append(COALESCE("mediaUrls", ARRAY[]::text[]), $1) WHERE "id" = $2`,
            uploadResult.webViewLink,
            taskId
          );
        }
      } catch (dbErr) {
        console.warn("[Upload API] Database task update note:", dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      file: uploadResult,
      taskId: taskId || null,
    });
  } catch (error: any) {
    console.error("[Upload API] Error processing upload:", error);
    return NextResponse.json(
      { error: error.message || "Gagal mengunggah file" },
      { status: 500 }
    );
  }
}
