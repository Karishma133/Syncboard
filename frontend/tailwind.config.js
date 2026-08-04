/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0B1720",
          800: "#101E2A",
          700: "#152836",
          600: "#1D3444",
        },
        mist: "#F3F6F5",
        paper: "#FBFAF7",
        sync: {
          teal: "#17C9B2",
          violet: "#7C6CF6",
          coral: "#FF7A59",
          amber: "#F5B441",
        },
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(11,23,32,0.06), 0 8px 24px -12px rgba(11,23,32,0.18)",
        pop: "0 20px 60px -20px rgba(11,23,32,0.45)",
      },
      keyframes: {
        "pulse-ring": {
          "0%": { transform: "scale(0.9)", opacity: "0.8" },
          "80%": { transform: "scale(1.6)", opacity: "0" },
          "100%": { transform: "scale(1.6)", opacity: "0" },
        },
        "toast-in": {
          "0%": { transform: "translateY(8px) scale(0.98)", opacity: "0" },
          "100%": { transform: "translateY(0) scale(1)", opacity: "1" },
        },
        "palette-in": {
          "0%": { transform: "translateY(-6px) scale(0.98)", opacity: "0" },
          "100%": { transform: "translateY(0) scale(1)", opacity: "1" },
        },
        "confetti-fall": {
          "0%": { transform: "translateY(-10vh) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateY(105vh) rotate(600deg)", opacity: "0.4" },
        },
      },
      animation: {
        "pulse-ring": "pulse-ring 1.8s cubic-bezier(0.2,0.6,0.4,1) infinite",
        "toast-in": "toast-in 0.22s cubic-bezier(0.2,0.7,0.3,1) both",
        "palette-in": "palette-in 0.16s cubic-bezier(0.2,0.7,0.3,1) both",
      },
    },
  },
  plugins: [],
};
