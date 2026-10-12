import { NextResponse } from 'next/server';
import { userStatusOverrides } from '@/lib/userOverrides';

const APPS_SCRIPT_URL =
  process.env.NEXT_PUBLIC_APPS_SCRIPT_URL ||
  process.env.APPS_SCRIPT_URL ||
  'https://script.google.com/macros/s/AKfycbzLlZLTfhcsMK6uh28XFvVQCzLbopK9I2v9-xiNBEjQZw0-lL1oPeXvlKbpp04I1AtS/exec';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const targetEmail = searchParams.get('email')?.trim().toLowerCase();
    const targetRole = searchParams.get('role') || 'member';
    const targetDept = searchParams.get('department') || 'Product & Tech';

    if (!targetEmail) {
      return new NextResponse(renderHtmlPage('error', 'Email tidak ditemukan dalam parameter.'), {
        status: 400,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    // Simpan ke in-memory override langsung
    userStatusOverrides.set(targetEmail, {
      status: 'active',
      role: targetRole,
      department: targetDept,
      updatedAt: Date.now(),
    });

    // 1. Update user ke Google Sheets melalui Apps Script
    if (APPS_SCRIPT_URL) {
      // Metode A: GET parameter (reliabel tanpa drop body 302)
      const updateUrl = `${APPS_SCRIPT_URL}?action=updateUser&email=${encodeURIComponent(targetEmail)}&role=${encodeURIComponent(targetRole)}&department=${encodeURIComponent(targetDept)}&status=active`;
      try {
        await fetch(updateUrl, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          cache: 'no-store',
        });
      } catch (err) {
        console.warn('GET approve fallback error:', err);
      }

      // Metode B: POST Payload sebagai backup
      try {
        await fetch(APPS_SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'updateUser',
            payload: {
              email: targetEmail,
              role: targetRole,
              department: targetDept,
              status: 'active',
            },
          }),
        });
      } catch (err) {
        console.warn('POST approve fallback error:', err);
      }
    }

    return new NextResponse(
      renderHtmlPage('success', `Akun <strong>${targetEmail}</strong> telah berhasil disetujui (ACC). Pengguna sekarang dapat langsung masuk ke aplikasi.`),
      {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    );
  } catch (error: any) {
    return new NextResponse(renderHtmlPage('error', error.message || 'Terjadi kesalahan sistem.'), {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}

function renderHtmlPage(type: 'success' | 'error', messageHtml: string) {
  const isSuccess = type === 'success';
  const iconColor = isSuccess ? '#10b981' : '#ef4444';
  const title = isSuccess ? 'Akses Berhasil Disetujui (ACC)!' : 'Gagal Menyetujui Akses';
  const iconSvg = isSuccess
    ? '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>'
    : '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} - Syncro</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: #090d16; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
    .card { background: #131b2e; border: 1px solid rgba(255,255,255,0.08); border-radius: 24px; padding: 40px 32px; max-width: 480px; width: 100%; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
    .icon-wrapper { width: 72px; height: 72px; border-radius: 20px; background: ${isSuccess ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)'}; border: 1px solid ${isSuccess ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; }
    h1 { font-size: 22px; font-weight: 800; margin-bottom: 12px; color: #ffffff; }
    p { font-size: 14px; color: #94a3b8; line-height: 1.6; margin-bottom: 28px; }
    .btn { display: inline-block; background: #EE3726; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 12px; font-size: 14px; font-weight: 700; transition: 0.2s; box-shadow: 0 4px 14px rgba(238,55,38,0.4); }
    .btn:hover { background: #dc2626; transform: translateY(-1px); }
    .footer { margin-top: 24px; font-size: 12px; color: #64748b; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon-wrapper">${iconSvg}</div>
    <h1>${title}</h1>
    <p>${messageHtml}</p>
    <div>
      <a href="/inbox" class="btn">Buka Aplikasi Syncro</a>
    </div>
    <div class="footer">Syncro Workspace Access Control</div>
  </div>
</body>
</html>`;
}
