import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNavbar } from "@/components/layout/TopNavbar";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

const fontSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const viewport: Viewport = {
  themeColor: "#e11d48",
};

export const metadata: Metadata = {
  title: "Syncro | ClickUp-Style Task & Time Management",
  description: "Progressive Web App for Task Management, Time Tracking, and Collaboration.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${fontSans.variable} font-sans h-full antialiased`}>
      <body className="flex h-screen overflow-hidden bg-background text-foreground font-sans selection:bg-rose-500/30 selection:text-rose-600 transition-colors duration-200">
        <ThemeProvider>
          <Sidebar />
          <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
            <TopNavbar />
            <main className="flex-1 overflow-y-auto">
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
