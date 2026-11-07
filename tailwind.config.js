/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        cream: "#FAF7F0",
        card: "#FFFFFF",
        primary: {
          DEFAULT: "#0B2A5B",
          light: "#123C85",
        },
        forest: "#14532D",
        accent: {
          DEFAULT: "#16A34A",
          dark: "#16A34A",
        },
        accentLight: "#DCFCE7",
        yolk: "#F5B83D",
        ink: "#0F172A",
        muted: "#64748B",
        line: "#E2E8F0",
        surface: {
          DEFAULT: "#FFFFFF",
          muted: "#F4F7FB",
        },
        brand: {
          navy: "#102A43",
          blue: "#1D4ED8",
          green: "#16A34A",
          canvas: "#F4F7FB",
        },
      },
      fontFamily: {
        sans: ["Poppins_400Regular"],
      },
    },
  },
  plugins: [],
};
