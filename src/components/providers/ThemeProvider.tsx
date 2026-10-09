"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/store/useStore";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, language } = useStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    document.documentElement.lang = language || "id";
  }, [language]);

  return <>{children}</>;
}
