import { realtimeEmitter } from '@/lib/serverCache';

export async function GET(req: Request) {

  let isClosed = false;

  const stream = new ReadableStream({
    start(controller) {
      // Kirim event pembuka koneksi
      const initialMessage = `event: connected\ndata: ${JSON.stringify({ status: 'connected', time: Date.now() })}\n\n`;
      controller.enqueue(new TextEncoder().encode(initialMessage));

      // Listener untuk event realtime dari server
      const onRealtimeEvent = (event: any) => {
        if (isClosed) return;
        try {
          const msg = `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`;
          controller.enqueue(new TextEncoder().encode(msg));
        } catch (err) {
          console.warn('[SSE Enqueue Error]', err);
        }
      };

      realtimeEmitter.on('realtime_event', onRealtimeEvent);

      // Heartbeat ping setiap 15 detik agar koneksi tetap hidup
      const pingInterval = setInterval(() => {
        if (isClosed) {
          clearInterval(pingInterval);
          return;
        }
        try {
          controller.enqueue(new TextEncoder().encode(': ping\n\n'));
        } catch {
          clearInterval(pingInterval);
        }
      }, 15000);

      // Handle abort / disconnect
      req.signal.addEventListener('abort', () => {
        isClosed = true;
        clearInterval(pingInterval);
        realtimeEmitter.off('realtime_event', onRealtimeEvent);
        try {
          controller.close();
        } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable buffering di proxy/Nginx/Vercel
    },
  });
}
