/**
 * Google Drive API Client - 100% Edge Runtime Compatible
 * Strictly uses standard Web APIs (fetch, TextEncoder, Uint8Array, Blob).
 * NO Node.js packages (no `googleapis`, no `fs`, no `stream`).
 */

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface GoogleDriveUploadResult {
  id: string;
  name: string;
  webViewLink: string;
  webContentLink?: string;
  thumbnailLink?: string;
}

/**
 * Request a fresh access token dynamically using Google OAuth 2.0 Refresh Token
 */
export async function getGoogleDriveAccessToken(): Promise<string> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken || refreshToken === "sample-refresh-token") {
    throw new Error(
      "MISSING_DRIVE_CREDENTIALS: Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_DRIVE_REFRESH_TOKEN in .env"
    );
  }

  const tokenUrl = "https://oauth2.googleapis.com/token";
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[Google Drive OAuth] Token refresh failed:", errorText);
    throw new Error(`Failed to refresh Google OAuth token: ${response.status} ${errorText}`);
  }

  const data: GoogleTokenResponse = await response.json();
  return data.access_token;
}

/**
 * Cari atau buat folder Space di dalam folder utama Syncro di Google Drive
 */
export async function getOrCreateSpaceFolder(
  spaceName: string,
  rootFolderId?: string
): Promise<string> {
  const accessToken = await getGoogleDriveAccessToken();
  const targetRoot = rootFolderId || process.env.GOOGLE_DRIVE_FOLDER_ID;
  const cleanName = (spaceName || "").trim() || "General";

  // 1. Cari apakah folder space sudah ada di Google Drive
  let query = `name = '${cleanName.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  if (targetRoot && targetRoot !== "sample-folder-id") {
    query += ` and '${targetRoot}' in parents`;
  }

  try {
    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      query
    )}&fields=files(id,name)`;

    const searchRes = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (searchRes.ok) {
      const data = await searchRes.json();
      if (data.files && data.files.length > 0) {
        return data.files[0].id;
      }
    }
  } catch (searchErr) {
    console.warn("[Google Drive Space Folder] Search warning:", searchErr);
  }

  // 2. Jika belum ada, buat folder baru di Google Drive
  try {
    const createMetadata: Record<string, any> = {
      name: cleanName,
      mimeType: "application/vnd.google-apps.folder",
    };
    if (targetRoot && targetRoot !== "sample-folder-id") {
      createMetadata.parents = [targetRoot];
    }

    const createRes = await fetch("https://www.googleapis.com/drive/v3/files?fields=id,name", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(createMetadata),
    });

    if (createRes.ok) {
      const newFolder = await createRes.json();
      return newFolder.id;
    }
  } catch (createErr) {
    console.warn("[Google Drive Space Folder] Create warning:", createErr);
  }

  return targetRoot || "";
}

/**
 * Upload a file directly to Google Drive using multipart/related REST API
 * Compatible with Cloudflare Workers / Pages Edge Runtime
 */
export async function uploadFileToGoogleDrive({
  fileName,
  mimeType,
  fileBytes,
  spaceName,
  folderId,
}: {
  fileName: string;
  mimeType: string;
  fileBytes: ArrayBuffer;
  spaceName?: string;
  folderId?: string;
}): Promise<GoogleDriveUploadResult> {
  const accessToken = await getGoogleDriveAccessToken();
  
  // Dapatkan folder ID spesifik sesuai nama space tugas jika ada
  let targetFolderId = folderId || process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (spaceName && spaceName.trim()) {
    try {
      targetFolderId = await getOrCreateSpaceFolder(spaceName, targetFolderId);
    } catch (e) {
      console.warn("[Google Drive Upload] Get space folder fallback:", e);
    }
  }

  // Metadata object
  const metadata: Record<string, any> = {
    name: fileName,
  };

  if (targetFolderId && targetFolderId !== "sample-folder-id") {
    metadata.parents = [targetFolderId];
  }

  // Construct multipart/related body manually using Web API TextEncoder & Uint8Array
  const boundary = `-------SyncroEdgeDriveBoundary${Date.now()}`;
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const encoder = new TextEncoder();
  const metadataHeader =
    `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    JSON.stringify(metadata) +
    `\r\n--${boundary}\r\nContent-Type: ${mimeType || "application/octet-stream"}\r\n\r\n`;

  const headerBytes = encoder.encode(metadataHeader);
  const fileData = new Uint8Array(fileBytes);
  const footerBytes = encoder.encode(closeDelimiter);

  // Combine segments into a single Uint8Array
  const totalLength = headerBytes.byteLength + fileData.byteLength + footerBytes.byteLength;
  const combinedBody = new Uint8Array(totalLength);
  combinedBody.set(headerBytes, 0);
  combinedBody.set(fileData, headerBytes.byteLength);
  combinedBody.set(footerBytes, headerBytes.byteLength + fileData.byteLength);

  const uploadUrl =
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink,thumbnailLink";

  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body: combinedBody,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[Google Drive Upload] REST API error:", errorText);
    throw new Error(`Google Drive upload failed: ${response.status} ${errorText}`);
  }

  const result: GoogleDriveUploadResult = await response.json();

  // Berikan izin baca publik agar berkas dapat dibuka oleh siapa saja yang memiliki link
  try {
    await fetch(`https://www.googleapis.com/drive/v3/files/${result.id}/permissions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        role: "reader",
        type: "anyone",
      }),
    });
  } catch (permErr) {
    console.warn("[Google Drive] Set permission warning:", permErr);
  }

  return result;
}
