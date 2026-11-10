/**
 * Google Drive Client Utilities
 * Handles account switching, shared folder integration, and safe media opening
 */

export interface MediaLinkInfo {
  type: 'gdrive' | 'gdoc' | 'gsheet' | 'gslide' | 'gfolder' | 'image' | 'file';
  label: string;
  isDrive: boolean;
  isDataUrl: boolean;
}

const SHARED_FOLDER_STORAGE_KEY = "syncro_gdrive_shared_folder";
export const DEFAULT_SHARED_FOLDER = "https://drive.google.com/drive/shared-with-me";

/**
 * Mendapatkan URL folder bersama Google Drive yang tersimpan di browser
 */
export function getSavedSharedFolderUrl(): string {
  if (typeof window === "undefined") return DEFAULT_SHARED_FOLDER;
  return localStorage.getItem(SHARED_FOLDER_STORAGE_KEY) || DEFAULT_SHARED_FOLDER;
}

/**
 * Menyimpan URL folder bersama Google Drive ke browser
 */
export function saveSharedFolderUrl(url: string): void {
  if (typeof window === "undefined") return;
  const cleanUrl = url.trim() || DEFAULT_SHARED_FOLDER;
  localStorage.setItem(SHARED_FOLDER_STORAGE_KEY, cleanUrl);
}

/**
 * Mengarahkan URL Google Drive agar otomatis dibuka dengan akun Google sesuai email login
 */
export function getGoogleAccountTargetUrl(targetUrl: string, userEmail?: string): string {
  if (!userEmail || !userEmail.includes("@")) {
    return targetUrl;
  }
  
  // Gunakan Google Account Chooser untuk memilih akun secara otomatis
  return `https://accounts.google.com/AccountChooser?Email=${encodeURIComponent(
    userEmail
  )}&continue=${encodeURIComponent(targetUrl)}`;
}

/**
 * Dapatkan URL folder bersama Google Drive yang langsung terkoneksi ke email pengguna
 */
export function getSharedFolderAccountUrl(userEmail?: string): string {
  const folderUrl = getSavedSharedFolderUrl();
  return getGoogleAccountTargetUrl(folderUrl, userEmail);
}

/**
 * Dapatkan URL folder Google Drive untuk Space / Project tertentu
 * Otomatis membuka folder Syncro / <Nama Space> di Google Drive akun email yang login
 */
export function getSpaceDriveFolderUrl(spaceName?: string, userEmail?: string): string {
  const cleanSpace = (spaceName || "").trim();
  
  if (!cleanSpace || cleanSpace === "Semua Spaces" || cleanSpace === "Semua Tugas") {
    // Buka folder utama "Syncro" di Google Drive
    const targetUrl = `https://drive.google.com/drive/search?q=${encodeURIComponent(
      "name = 'Syncro' and mimeType = 'application/vnd.google-apps.folder'"
    )}`;
    return getGoogleAccountTargetUrl(targetUrl, userEmail);
  }

  // Buka folder space spesifik (misal: "IT Support Academy" atau "Design for ITSEC Academy Event")
  const targetUrl = `https://drive.google.com/drive/search?q=${encodeURIComponent(
    `name = '${cleanSpace}' and mimeType = 'application/vnd.google-apps.folder'`
  )}`;
  return getGoogleAccountTargetUrl(targetUrl, userEmail);
}

/**
 * Identifikasi jenis tautan media (Google Drive, Docs, Sheets, Slides, Folder, Image, File)
 */
export function identifyMediaLink(url: string): MediaLinkInfo {
  if (!url) {
    return { type: 'file', label: 'Berkas', isDrive: false, isDataUrl: false };
  }

  const isDataUrl = url.startsWith("data:");
  if (isDataUrl) {
    const isImage = url.startsWith("data:image/");
    return {
      type: isImage ? 'image' : 'file',
      label: isImage ? 'Gambar Lampiran' : 'Berkas Lampiran',
      isDrive: false,
      isDataUrl: true,
    };
  }

  const lower = url.toLowerCase();

  if (lower.includes("drive.google.com/drive/folders/")) {
    return { type: 'gfolder', label: 'Folder Google Drive', isDrive: true, isDataUrl: false };
  }
  if (lower.includes("docs.google.com/document/")) {
    return { type: 'gdoc', label: 'Google Docs', isDrive: true, isDataUrl: false };
  }
  if (lower.includes("docs.google.com/spreadsheets/")) {
    return { type: 'gsheet', label: 'Google Sheets', isDrive: true, isDataUrl: false };
  }
  if (lower.includes("docs.google.com/presentation/")) {
    return { type: 'gslide', label: 'Google Slides', isDrive: true, isDataUrl: false };
  }
  if (lower.includes("drive.google.com/file/")) {
    return { type: 'gdrive', label: 'Berkas Google Drive', isDrive: true, isDataUrl: false };
  }
  if (lower.includes("drive.google.com")) {
    return { type: 'gdrive', label: 'Google Drive', isDrive: true, isDataUrl: false };
  }

  if (/\.(jpeg|jpg|gif|png|webp|svg)($|\?)/i.test(url)) {
    return { type: 'image', label: 'Gambar', isDrive: false, isDataUrl: false };
  }

  return { type: 'file', label: 'Tautan Lampiran', isDrive: false, isDataUrl: false };
}

/**
 * Membuka media dengan aman tanpa diblokir oleh browser Chrome (mengatasi Not allowed to navigate top frame to data URL)
 */
export function openMediaSafely(url: string, userEmail?: string, onPreviewImage?: (url: string) => void): void {
  if (!url) return;

  // Jika URL berupa Base64 Data URL
  if (url.startsWith("data:")) {
    if (url.startsWith("data:image/") && onPreviewImage) {
      onPreviewImage(url);
      return;
    }

    try {
      // Konversi Data URL ke Blob URL yang tidak akan diblokir oleh Chrome
      const parts = url.split(",");
      const mime = parts[0].match(/:(.*?);/)?.[1] || "application/octet-stream";
      const byteString = atob(parts[1]);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mime });
      const blobUrl = URL.createObjectURL(blob);
      const win = window.open(blobUrl, "_blank");
      if (!win) {
        // Fallback jika pop-up diblokir: trigger download langsung
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = `lampiran-${Date.now()}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (e) {
      console.error("[Media] Gagal membuka data URL:", e);
      // Fallback modal preview
      if (onPreviewImage) onPreviewImage(url);
    }
    return;
  }

  // Jika Google Drive/Docs link, buka dengan akun email yang sesuai
  const info = identifyMediaLink(url);
  if (info.isDrive) {
    const accountUrl = getGoogleAccountTargetUrl(url, userEmail);
    window.open(accountUrl, "_blank");
    return;
  }

  // URL standar lainnya
  window.open(url, "_blank");
}

/**
 * Kompresi gambar di sisi klien (browser) untuk memastikan upload super cepat,
 * tidak membebani batas kuota CPU Cloudflare Edge, dan gambar berukuran optimal.
 */
export async function compressImageClient(
  file: File,
  maxDim = 1600,
  quality = 0.82
): Promise<File | Blob> {
  if (typeof window === "undefined" || !file.type.startsWith("image/")) {
    return file;
  }

  // Jika ukuran file sudah sangat kecil (< 200KB) atau SVG/GIF animasi, jangan dikompres ulang
  if (file.size < 200 * 1024 || file.type === "image/svg+xml" || file.type === "image/gif") {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        return resolve(file);
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Gunakan image/jpeg untuk kompresi efektif jika bukan PNG transparan kecil
      const targetMime = "image/jpeg";
      canvas.toBlob(
        (blob) => {
          if (blob && blob.size < file.size) {
            resolve(blob);
          } else {
            resolve(file);
          }
        },
        targetMime,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}

/**
 * Helper unggah berkas yang tahan banting (resilient) untuk browser:
 * 1. Otomatis kompresi gambar besar di browser
 * 2. Coba upload via POST /api/upload
 * 3. Jika API gagal atau offline, fallback ke pembacaan FileReader data URL lokal langsung
 */
export async function uploadFileHelper(
  file: File,
  taskId?: string
): Promise<{ url: string; name: string }> {
  // 1. Kompresi jika berupa gambar
  let fileToSend: File | Blob = file;
  if (file.type.startsWith("image/")) {
    try {
      fileToSend = await compressImageClient(file);
    } catch (e) {
      console.warn("Kompresi gambar dilewati:", e);
      fileToSend = file;
    }
  }

  // 2. Coba kirim ke endpoint /api/upload
  try {
    const formData = new FormData();
    formData.append("file", fileToSend, file.name);
    if (taskId) {
      formData.append("taskId", taskId);
    }

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      if (data.file?.webViewLink) {
        return { url: data.file.webViewLink, name: file.name };
      }
    } else {
      const errData = await res.json().catch(() => ({}));
      console.warn("[Upload] Server API note:", errData.error || res.statusText);
    }
  } catch (apiErr) {
    console.warn("[Upload] Network API error, fallback to client-side data URL:", apiErr);
  }

  // 3. Fallback client-side FileReader: Menjamin upload berkas tidak pernah gagal
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve({ url: reader.result, name: file.name });
      } else {
        reject(new Error("Gagal membaca berkas perangkat"));
      }
    };
    reader.onerror = () => reject(new Error("Gagal memproses berkas"));
    reader.readAsDataURL(fileToSend);
  });
}


