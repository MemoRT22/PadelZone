import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        zona5: {
          navy: "#0e1634",
          navyMid: "#1a2347",
          navySoft: "#252d52",
          coral: "#f27435",
          coralDark: "#d85f24",
          coralSoft: "#ff9966",
          green: "#00ad38",
          greenDark: "#008a2d",
          greenSoft: "#3dd66b",
          cream: "#ffffeb",
          sand: "#f6f3e9",
          warm: "#faf8f0",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 3px rgba(14, 22, 52, 0.06), 0 1px 2px rgba(14, 22, 52, 0.04)",
        card: "0 2px 8px rgba(14, 22, 52, 0.06), 0 1px 3px rgba(14, 22, 52, 0.04)",
        lift: "0 8px 24px rgba(14, 22, 52, 0.10), 0 2px 8px rgba(14, 22, 52, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
