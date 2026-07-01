import type { Config } from "tailwindcss";
export default {
  content: ["./app/**/*.{ts,tsx,js,jsx}", "./components/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        apb: { DEFAULT: "#1e4d2b", light: "#2d7a3e", accent: "#ff6b35", "accent-light": "#ff8c61", cream: "#faf8f5" },
      },
      borderRadius: { xl2: "16px" },
      fontFamily: { sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"] },
    },
  },
  plugins: [],
} satisfies Config;
