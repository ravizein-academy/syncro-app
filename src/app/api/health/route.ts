import { NextResponse } from 'next/server';

export async function GET() {
  const appsScriptUrl = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL || process.env.APPS_SCRIPT_URL;
  let appsScriptStatus = 'unconfigured';

  if (appsScriptUrl) {
    try {
      const res = await fetch(`${appsScriptUrl}?action=health`, {
        cache: 'no-store'
      });
      if (res.ok) {
        const json = await res.json().catch(() => null);
        if (json && (json.status === 'success' || json.status === 'ok' || json?.data?.status === 'ok')) {
          appsScriptStatus = 'connected';
        } else {
          appsScriptStatus = 'invalid-response';
        }
      } else {
        appsScriptStatus = `error-${res.status}`;
      }
    } catch (e: any) {
      appsScriptStatus = 'connection-timeout';
    }
  }

  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Syncro Next.js Serverless API',
    appsScriptBackend: appsScriptStatus,
    environment: process.env.NODE_ENV || 'production',
    region: process.env.VERCEL_REGION || 'edge'
  });
}
