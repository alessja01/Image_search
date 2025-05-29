/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html", //file html
    "./src/**/*.{js,jsx,ts,tsx}",  // Includi tutte le estensioni corrette
    "./src/**/+.css", //include i file css
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require("tailwindcss-animate"),
  ],
}

