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
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--accent-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--primary-foreground))",
        },
        zona5: {
          navy: "#111B3C",
          navyMid: "#1B2750",
          navySoft: "#2A3768",
          coral: "#F47700",
          coralDark: "#DB6800",
          coralSoft: "#FF9947",
          green: "#205B4B",
          greenDark: "#163E33",
          greenSoft: "#3A7A66",
          cream: "#F5DCB4",
          sand: "#F0E6D2",
          warm: "#FFF9F0",
          gold: "#E9A12B",
          goldDark: "#C4861F",
          goldSoft: "#F0C065",
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
        soft: "0 1px 3px rgba(17, 27, 60, 0.06), 0 1px 2px rgba(17, 27, 60, 0.04)",
        card: "0 2px 8px rgba(17, 27, 60, 0.06), 0 1px 3px rgba(17, 27, 60, 0.04)",
        lift: "0 8px 24px rgba(17, 27, 60, 0.10), 0 2px 8px rgba(17, 27, 60, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
