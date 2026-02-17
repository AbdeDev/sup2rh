/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        body: ["Montserrat", "system-ui", "sans-serif"],
        heading: ["Figtree", "Gotham", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
