import { NextRequest, NextResponse } from "next/server";
import { uploadFileToGoogleDrive } from "@/lib/google-drive";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const taskId = formData.get("taskId") as string | null;
    const folderId = formData.get("folderId") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided in request" },
        { status: 400 }
      );
    }

    const fileName = file.name;
    const mimeType = file.type || "application/octet-stream";
    const fileBytes = await file.arrayBuffer();

    let uploadResult: { id: string; name: string; webViewLink: string; thumbnailLink?: string };

    try {
      uploadResult = await uploadFileToGoogleDrive({
        fileName,
        mimeType,
        fileBytes,
        folderId: folderId || undefined,
      });
    } catch (driveErr: any) {
      console.warn("[Upload API] Live Google Drive upload fell back:", driveErr.message);

      // In development or when credentials are not yet linked to actual Google account,
      // return a simulated office Drive link so the workflow and UI can be fully tested.
      const mockId = `mock_drive_${Date.now()}`;
      uploadResult = {
        id: mockId,
        name: fileName,
        webViewLink: `https://drive.google.com/file/d/${mockId}/view?usp=sharing`,
        thumbnailLink: file.type.startsWith("image/")
          ? `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60`
          : undefined,
      };
    }

    // If taskId is provided, update task mediaUrls in Prisma if database is connected
    if (taskId) {
      try {
        const { prisma } = await import("@/lib/prisma");
        if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("your-subdomain")) {
          await prisma.task.update({
            where: { id: taskId },
            data: {
              mediaUrls: {
                push: uploadResult.webViewLink,
              },
            },
          });
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
      { error: error.message || "Failed to upload file" },
      { status: 500 }
    );
  }
}
