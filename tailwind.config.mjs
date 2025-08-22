/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/artifacts/**/*.{js,ts,jsx,tsx}",  // Add this line
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
