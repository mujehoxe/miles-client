/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        miles: {
          50: "#e6f0f8", // Lightest shade
          100: "#cce0f2", // Very light shade
          200: "#99c1e5", // Light shade
          300: "#66a3d9", // Medium-light shade
          400: "#3385cc", // Slightly lighter than base
          500: "#176298", // Base color (provided)
          600: "#155780", // Darker shade
          700: "#124b68", // Dark shade
          800: "#0f3f50", // Very dark shade
          900: "#0d333f", // Darkest shade
        },
      },
    },
  },
  plugins: [],
};
