/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1e3a5f",
        primaryDark: "#152a47",
        accent: "#166534",
        gov: {
          navy: "#1e3a5f",
          green: "#166534",
          gold: "#b45309",
        }
      }
    },
  },
  plugins: [],
};

