import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { AppShell } from "@/components/layout/AppShell";

const fontSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const viewport: Viewport = {
  themeColor: "#EE3726",
};

export const metadata: Metadata = {
  title: "Syncro | Task Management & Productivity Hub",
  description: "Progressive Web App for Smart Task Management, Planning, and Team Collaboration.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${fontSans.variable} font-sans h-full antialiased`}>
      <body className="h-full bg-background text-foreground font-sans selection:bg-rose-500/30 selection:text-rose-600 transition-colors duration-200">
        <ThemeProvider>
          <Suspense fallback={<div className="h-screen w-screen bg-background" />}>
            <AppShell>{children}</AppShell>
          </Suspense>
        </ThemeProvider>
      </body>
    </html>
  );
}
