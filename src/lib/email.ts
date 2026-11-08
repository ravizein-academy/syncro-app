/**
 * Syncro Email Dispatcher Service
 * Mendukung pengiriman email otomatis ke pengguna via HTTP REST API
 * Kompatibel 100% dengan Cloudflare Pages Edge Runtime (tanpa dependensi node socket)
 *
 * Provider yang didukung:
 * 1. Resend (Direkomendasikan - https://resend.com) -> RESEND_API_KEY
 * 2. SendGrid -> SENDGRID_API_KEY
 * 3. Brevo (Sendinblue) -> BREVO_API_KEY
 * 4. Custom Webhook / HTTP SMTP Bridge -> EMAIL_WEBHOOK_URL
 */

export interface EmailNotificationPayload {
  to: string;
  recipientName?: string;
  actorName?: string;
  title: string;
  message: string;
  type?: string;
  taskId?: string;
  projectId?: string;
  taskTitle?: string;
}

export interface EmailSendResult {
  success: boolean;
  provider: string;
  messageId?: string;
  simulated?: boolean;
  error?: string;
}

const APP_URL = process.env.NEXTAUTH_URL || "https://syncro-app.pages.dev";
const DEFAULT_SENDER =
  process.env.EMAIL_FROM || "Syncro Workspace <onboarding@resend.dev>";

/**
 * Menghasilkan HTML email yang modern, responsif, dan rapi sesuai desain tema Syncro
 */
export function generateNotificationHtml(payload: EmailNotificationPayload): string {
  const {
    recipientName = "Pengguna Syncro",
    actorName = "Rekan Tim",
    title,
    message,
    type = "info",
    taskId,
  } = payload;

  const targetLink = taskId ? `${APP_URL}?task=${taskId}` : APP_URL;

  // Tentukan badge dan warna berdasarkan jenis notifikasi
  let badgeLabel = "Pemberitahuan Sistem";
  let badgeColor = "#6366f1"; // Indigo
  let badgeBg = "#e0e7ff";

  switch (type) {
    case "assign":
      badgeLabel = "Penugasan Tugas Baru (PIC)";
      badgeColor = "#7c3aed"; // Violet
      badgeBg = "#ede9fe";
      break;
    case "status":
      badgeLabel = "Pembaruan Status Tugas";
      badgeColor = "#2563eb"; // Blue
      badgeBg = "#dbeafe";
      break;
    case "priority":
      badgeLabel = "Perubahan Prioritas";
      badgeColor = "#d97706"; // Amber
      badgeBg = "#fef3c7";
      break;
    case "task_delete":
      badgeLabel = "Tugas Dihapus";
      badgeColor = "#dc2626"; // Red
      badgeBg = "#fee2e2";
      break;
    case "custom":
      badgeLabel = "Pesan Langsung Tim";
      badgeColor = "#059669"; // Emerald
      badgeBg = "#d1fae5";
      break;
    case "comment":
      badgeLabel = "Komentar Baru";
      badgeColor = "#0284c7"; // Sky
      badgeBg = "#e0f2fe";
      break;
  }

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #f8fafc;
      padding: 32px 16px;
    }
    .container {
      max-width: 580px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .header {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      padding: 24px 32px;
      color: #ffffff;
      text-align: left;
    }
    .header-logo {
      font-size: 20px;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin: 0;
      display: inline-block;
    }
    .header-sub {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.85);
      margin-top: 4px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .content {
      padding: 32px;
    }
    .greeting {
      font-size: 15px;
      color: #64748b;
      margin-bottom: 16px;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      font-size: 12px;
      font-weight: 600;
      border-radius: 9999px;
      margin-bottom: 16px;
      color: ${badgeColor};
      background-color: ${badgeBg};
    }
    .notif-card {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-left: 4px solid ${badgeColor};
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 24px;
    }
    .notif-title {
      font-size: 17px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 8px 0;
    }
    .notif-message {
      font-size: 14px;
      line-height: 1.6;
      color: #334155;
      margin: 0;
    }
    .meta-box {
      font-size: 12px;
      color: #64748b;
      margin-top: 14px;
      padding-top: 12px;
      border-top: 1px dashed #cbd5e1;
    }
    .cta-container {
      text-align: center;
      margin: 32px 0 16px 0;
    }
    .cta-button {
      display: inline-block;
      background: #4f46e5;
      color: #ffffff !important;
      text-decoration: none;
      font-size: 14px;
      font-weight: 600;
      padding: 12px 28px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(79, 70, 229, 0.2);
    }
    .cta-button:hover {
      background: #4338ca;
    }
    .footer {
      background-color: #f1f5f9;
      padding: 20px 32px;
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
      border-top: 1px solid #e2e8f0;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="header-logo">⚡ SYNCRO</div>
        <div class="header-sub">Workspace & Task Operations</div>
      </div>
      <div class="content">
        <div class="greeting">Halo <strong>${recipientName}</strong>,</div>
        <div class="badge">${badgeLabel}</div>
        
        <div class="notif-card">
          <h2 class="notif-title">${title}</h2>
          <p class="notif-message">${message}</p>
          <div class="meta-box">
            <span>Diterbitkan oleh: <strong>${actorName}</strong></span>
          </div>
        </div>

        <div class="cta-container">
          <a href="${targetLink}" class="cta-button" target="_blank">
            Buka di Syncro App →
          </a>
        </div>
      </div>
      <div class="footer">
        <p style="margin: 0 0 6px 0;">Notifikasi ini dikirim secara otomatis dari platform kolaborasi <strong>Syncro</strong>.</p>
        <p style="margin: 0;">IT SEC Academy &copy; 2026. Seluruh hak cipta dilindungi.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Menghasilkan teks plain untuk fallback email client
 */
export function generateNotificationText(payload: EmailNotificationPayload): string {
  const {
    recipientName = "Pengguna Syncro",
    actorName = "Rekan Tim",
    title,
    message,
    taskId,
  } = payload;
  const targetLink = taskId ? `${APP_URL}?task=${taskId}` : APP_URL;

  return `Halo ${recipientName},

[Notifikasi Syncro]
${title}

Pesan:
${message}

Diterbitkan oleh: ${actorName}

Buka di Syncro:
${targetLink}

---
Syncro Workspace & Task Operations
IT SEC Academy © 2026`;
}

/**
 * Mengirim email notifikasi ke alamat email penerima.
 * Mendukung Resend, SendGrid, Brevo, dan Webhook HTTP.
 * Jika belum ada API key, sistem melakukan simulasi yang tercatat di console tanpa error.
 */
export async function sendNotificationEmail(
  payload: EmailNotificationPayload
): Promise<EmailSendResult> {
  const { to, title } = payload;

  if (!to || !to.includes("@")) {
    return {
      success: false,
      provider: "none",
      error: "Alamat email penerima tidak valid",
    };
  }

  const subject = `[Syncro] ${title}`;
  const html = generateNotificationHtml(payload);
  const text = generateNotificationText(payload);

  // 1. Opsi Provider: Resend (Direkomendasikan)
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey.trim()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: DEFAULT_SENDER,
          to: [to.trim()],
          subject,
          html,
          text,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        return {
          success: true,
          provider: "resend",
          messageId: data.id,
        };
      } else {
        console.error("[Email Dispatch] Resend error:", data);
        return {
          success: false,
          provider: "resend",
          error: data.message || "Resend API error",
        };
      }
    } catch (err: any) {
      console.error("[Email Dispatch] Resend fetch exception:", err);
      return {
        success: false,
        provider: "resend",
        error: err.message || "Network error to Resend",
      };
    }
  }

  // 2. Opsi Provider: SendGrid
  const sendgridApiKey = process.env.SENDGRID_API_KEY;
  if (sendgridApiKey) {
    try {
      const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sendgridApiKey.trim()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to.trim() }] }],
          from: { email: DEFAULT_SENDER.split("<")[1]?.replace(">", "") || "noreply@syncro.app" },
          subject,
          content: [
            { type: "text/plain", value: text },
            { type: "text/html", value: html },
          ],
        }),
      });

      if (res.ok || res.status === 202) {
        return { success: true, provider: "sendgrid" };
      } else {
        const errorText = await res.text();
        return { success: false, provider: "sendgrid", error: errorText };
      }
    } catch (err: any) {
      return { success: false, provider: "sendgrid", error: err.message };
    }
  }

  // 3. Opsi Provider: Brevo (Sendinblue)
  const brevoApiKey = process.env.BREVO_API_KEY;
  if (brevoApiKey) {
    try {
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": brevoApiKey.trim(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender: { name: "Syncro App", email: "notifications@syncro.app" },
          to: [{ email: to.trim(), name: payload.recipientName || "Pengguna" }],
          subject,
          htmlContent: html,
          textContent: text,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        return { success: true, provider: "brevo", messageId: data.messageId };
      } else {
        return { success: false, provider: "brevo", error: data.message };
      }
    } catch (err: any) {
      return { success: false, provider: "brevo", error: err.message };
    }
  }

  // 4. Opsi Provider: Custom Webhook HTTP
  const webhookUrl = process.env.EMAIL_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: to.trim(),
          subject,
          html,
          text,
          payload,
        }),
      });
      return { success: res.ok, provider: "webhook" };
    } catch (err: any) {
      return { success: false, provider: "webhook", error: err.message };
    }
  }

  // 5. Fallback Mode: Simulation Logging (Aktif saat API Key belum diisi di environment)
  console.log(
    `[Email Service Simulation] 📧 Email tersinkronisasi ke: ${to} | Subjek: "${subject}" | Tipe: ${payload.type || "info"}`
  );

  return {
    success: true,
    provider: "simulation",
    simulated: true,
    messageId: `sim-${Date.now()}`,
  };
}

