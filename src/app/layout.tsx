import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNavbar } from "@/components/layout/TopNavbar";

const fontSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const viewport: Viewport = {
  themeColor: "#0b0c10",
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
    <html lang="en" className={`${fontSans.variable} font-sans h-full antialiased dark`}>
      <body className="flex h-screen overflow-hidden bg-[#0b0c10] text-slate-100 font-sans selection:bg-rose-500/30 selection:text-rose-200">
        <Sidebar />
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0e0f15]">
          <TopNavbar />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
