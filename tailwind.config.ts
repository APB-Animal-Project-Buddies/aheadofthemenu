import type { Config } from "tailwindcss";
export default {
  content: ["./app/**/*.{ts,tsx,js,jsx}", "./components/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        apb: { DEFAULT: "#1e4d2b", light: "#2d7a3e", accent: "#ff6b35", "accent-light": "#ff8c61", cream: "#faf8f5" },
      },
      borderRadius: { xl2: "16px" },
      // Match the fonts the pages actually load (globals.css / brand.css):
      // DM Sans for body text, Fraunces for display serif. Keeps `font-sans` /
      // `font-serif` classes identical to the static apps' typography.
      fontFamily: {
        sans: ["'DM Sans'", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["Fraunces", "Georgia", "'Times New Roman'", "serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
