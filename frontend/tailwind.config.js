/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        // Government portal palette
        primary: "#0B3C5D",
        primaryDark: "#1A4D8F",
        gov: {
          blue: "#0B3C5D",
          saffron: "#FF9933",
          bg: "#F5F7FA",
          card: "#FFFFFF",
          border: "#E2E8F0",
          text: "#2C2C2C",
          success: "#2E7D32",
          warning: "#F9A825",
          alert: "#D32F2F",
        },
        // Landing dark theme
        bhoomi: {
          dark: "#0B0F1A",
          darker: "#061018",
          cyan: "#22D3EE",
          cyanDim: "rgba(34, 211, 238, 0.2)",
          card: "rgba(255, 255, 255, 0.06)",
          border: "rgba(255, 255, 255, 0.12)",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        display: ["var(--font-inter)", "Inter", "Poppins", "system-ui", "sans-serif"],
      },
      boxShadow: {
        "gov-card": "0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)",
        "gov-card-hover": "0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.06)",
        "glow-cyan": "0 0 20px rgba(0, 229, 255, 0.3), 0 0 40px rgba(0, 229, 255, 0.1)",
        "glow-cyan-sm": "0 0 12px rgba(0, 229, 255, 0.25)",
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease-out forwards",
        "glow-pulse": "glowPulse 2.5s ease-in-out infinite",
        "node-pulse": "nodePulse 3s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        glowPulse: {
          "0%, 100%": { opacity: "0.6", filter: "drop-shadow(0 0 8px rgba(0, 229, 255, 0.4))" },
          "50%": { opacity: "1", filter: "drop-shadow(0 0 16px rgba(0, 229, 255, 0.7))" },
        },
        nodePulse: {
          "0%, 100%": { opacity: "0.7" },
          "50%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

