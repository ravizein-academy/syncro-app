import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ITSEC Official Brand Palette
        itsec: {
          red: "#ee3726",
          darkRed: "#c92010",
          lightRed: "#ff5242",
          black: "#0a0d14",
          charcoal: "#111726",
          navy: "#0f172a",
        },
        brand: {
          50: "#fff1f1",
          100: "#ffe1df",
          200: "#ffc7c4",
          300: "#ffa09b",
          400: "#ff6d63",
          500: "#ee3726", // Official ITSEC Pomegranate Red
          600: "#d92312",
          700: "#b81b0c",
          800: "#981a0e",
          900: "#7e1c12",
          950: "#450a05",
        },
        cyber: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
        },
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        border: "var(--border)",
      },
      borderRadius: {
        lg: "0.625rem",
        md: "calc(0.625rem - 2px)",
        sm: "calc(0.625rem - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-roboto)", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
        roboto: ["var(--font-roboto)", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
        serif: ['"Playfair Display"', "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
