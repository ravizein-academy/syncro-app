import type { Metadata, Viewport } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Toaster } from "@/components/ui/toaster";

const roboto = Roboto({
  weight: ["300", "400", "500", "700", "900"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: "Syncro | ITSEC Academy Task Management",
  description:
    "Sistem manajemen tugas dan pusat kendali operasional tiket ITSEC Academy dengan penyimpanan cloud dan kapabilitas PWA.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/syncro-icon.png", sizes: "any" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/icons/syncro-icon.png" },
    ],
    shortcut: "/icons/syncro-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Syncro",
  },
};

export const viewport: Viewport = {
  themeColor: "#ee3726",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/png" href="/icons/syncro-icon.png" />
        <link rel="shortcut icon" href="/icons/syncro-icon.png" />
        <link rel="apple-touch-icon" href="/icons/syncro-icon.png" />
        {/* Instant Theme Hydration Script - Strictly Light Mode */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  localStorage.removeItem('syncro-theme');
                  localStorage.setItem('syncro-theme', 'light');
                  document.documentElement.classList.remove('dark');
                  document.documentElement.classList.add('light');
                } catch (e) {}
              })();
            `,
          }}
        />
        {/* Development SW & Cache Cleaner to prevent stale CSS caching */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && 'serviceWorker' in navigator && window.location.hostname === 'localhost') {
                navigator.serviceWorker.getRegistrations().then(function(registrations) {
                  for (var i = 0; i < registrations.length; i++) {
                    registrations[i].unregister();
                  }
                });
                if ('caches' in window) {
                  caches.keys().then(function(keys) {
                    for (var j = 0; j < keys.length; j++) {
                      caches.delete(keys[j]);
                    }
                  });
                }
              }
            `,
          }}
        />
      </head>
      <body className={`${roboto.variable} ${roboto.className} font-sans antialiased min-h-screen bg-slate-50 text-slate-900 transition-colors duration-200`}>
        <ThemeProvider>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
